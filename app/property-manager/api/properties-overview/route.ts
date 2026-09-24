// app/property-manager/api/properties-overview/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '_')
    .replace(/^-+|-+$/g, '');
}

// ==================== GET: Fetch Managed Properties, Units & Utilities ====================
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing auth token.' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid session.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = String(profile?.role || '').toLowerCase().trim();
    const isPrivileged = ['super_admin', 'superadmin', 'admin', 'developer', 'accountant'].includes(role);

    let query = supabase.from('properties').select(`
      id,
      name,
      location,
      property_manager_id,
      owner_id,
      units (
        id,
        unit_number,
        rent_amount,
        deposit_fee,
        use_type,
        vat_treatment,
        vat_rate,
        water_fee,
        is_occupied,
        invoices (
          id,
          grand_total,
          status
        )
      )
    `);

    if (!isPrivileged) {
      if (role === 'property_manager') {
        query = query.eq('property_manager_id', user.id);
      } else if (role === 'owner') {
        query = query.eq('owner_id', user.id);
      } else {
        query = query.or(`property_manager_id.eq.${user.id},owner_id.eq.${user.id}`);
      }
    }

    const { data: properties, error } = await query;
    if (error) throw error;

    const formattedProperties = await Promise.all(
      (properties || []).map(async (prop: any) => {
        const units = prop.units || [];
        const totalUnits = units.length;
        const occupiedUnits = units.filter((u: any) => u.is_occupied).length;
        const vacantUnits = totalUnits - occupiedUnits;

        let paidInvoices = 0;
        let unpaidInvoices = 0;
        let overdueInvoices = 0;
        let partialPayments = 0;

        let totalPaidAmount = 0;
        let totalUnpaidAmount = 0;
        let totalOverdueAmount = 0;
        let totalPartialAmount = 0;

        const unitsWithUtilities = await Promise.all(
          units.map(async (unit: any) => {
            const invoices = unit.invoices || [];
            invoices.forEach((inv: any) => {
              const status = String(inv.status || '').toLowerCase();
              const amount = Number(inv.grand_total || 0);

              if (status === 'paid') {
                paidInvoices++;
                totalPaidAmount += amount;
              } else if (status === 'unpaid' || status === 'pending') {
                unpaidInvoices++;
                totalUnpaidAmount += amount;
              } else if (status === 'overdue') {
                overdueInvoices++;
                totalOverdueAmount += amount;
              } else if (status === 'partial') {
                partialPayments++;
                totalPartialAmount += amount;
              }
            });

            const { data: charges } = await supabase
              .from('unit_utility_charges')
              .select(`
                amount,
                property_utility_types (
                  name
                )
              `)
              .eq('unit_id', unit.id)
              .eq('is_active', true);

            const utilities = (charges || []).map((c: any) => ({
              name: c.property_utility_types?.name || 'Custom Utility',
              amount: c.amount || 0,
            }));

            return {
              ...unit,
              utilities,
            };
          })
        );

        return {
          propertyId: prop.id,
          propertyName: prop.name,
          location: prop.location,
          totalUnits,
          occupiedUnits,
          vacantUnits,
          units: unitsWithUtilities,
          financials: {
            paidInvoices,
            unpaidInvoices,
            overdueInvoices,
            partialPayments,
            totalPaidAmount,
            totalUnpaidAmount,
            totalOverdueAmount,
            totalPartialAmount,
          }
        };
      })
    );

    return NextResponse.json({ success: true, properties: formattedProperties });
  } catch (err: any) {
    console.error('Property Manager Overview GET Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch properties.' }, { status: 500 });
  }
}

// ==================== POST: Create Property & Unit ====================
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      propertyName,
      location,
      unitNumber,
      rentAmount,
      depositFee,
      useType,
      vatTreatment,
      vatRate,
      waterFee,
      utilities,
    } = body;

    if (!propertyName || !unitNumber || rentAmount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: propertyName, unitNumber, or rentAmount.' },
        { status: 400 }
      );
    }

    let propertyId: string;
    const { data: existingProp } = await supabase
      .from('properties')
      .select('id, property_manager_id')
      .ilike('name', propertyName.trim())
      .maybeSingle();

    if (existingProp) {
      propertyId = existingProp.id;
    } else {
      const { data: newProp, error: propErr } = await supabase
        .from('properties')
        .insert({
          name: propertyName.trim(),
          location: location ? location.trim() : null,
          property_manager_id: user.id, // Bind to this property manager
        })
        .select('id')
        .single();

      if (propErr || !newProp) {
        throw new Error(`Failed to create property: ${propErr?.message}`);
      }
      propertyId = newProp.id;
    }

    const { data: newUnit, error: unitErr } = await supabase
      .from('units')
      .insert({
        property_id: propertyId,
        unit_number: unitNumber.trim(),
        rent_amount: Number(rentAmount),
        deposit_fee: depositFee !== '' ? Number(depositFee) : null,
        use_type: useType || 'residential',
        vat_treatment: vatTreatment || 'A_EXEMPT',
        vat_rate: vatRate !== undefined ? Number(vatRate) : 0,
        water_fee: waterFee !== null && waterFee !== '' ? Number(waterFee) : null,
        is_occupied: false,
      })
      .select('id')
      .single();

    if (unitErr || !newUnit) {
      throw new Error(`Failed to create unit: ${unitErr?.message}`);
    }

    return NextResponse.json({ success: true, message: 'Property and unit saved successfully.' });
  } catch (err: any) {
    console.error('Property Manager POST Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to save property.' }, { status: 500 });
  }
}

// ==================== PUT: Update Unit ====================
export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { unitId, unitNumber, rentAmount, depositFee, useType, vatTreatment, vatRate, waterFee, utilities } = body;

    if (!unitId || !unitNumber || rentAmount === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    const { error: updateErr } = await supabase
      .from('units')
      .update({
        unit_number: unitNumber.trim(),
        rent_amount: Number(rentAmount),
        deposit_fee: depositFee !== '' ? Number(depositFee) : null,
        use_type: useType || 'residential',
        vat_treatment: vatTreatment || 'A_EXEMPT',
        vat_rate: vatRate !== undefined ? Number(vatRate) : 0,
        water_fee: waterFee !== null && waterFee !== '' ? Number(waterFee) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', unitId);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, message: 'Unit updated successfully.' });
  } catch (err: any) {
    console.error('Property Manager PUT Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to update unit.' }, { status: 500 });
  }
}