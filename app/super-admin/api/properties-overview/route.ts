import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/supabaseServer';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '_')
    .replace(/^-+|-+$/g, '');
}

// ==================== GET: Fetch Properties for Selected Client ====================
export async function GET(req: NextRequest) {
  try {
    const authClient = await createServerSupabaseClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId');
    if (!clientId) {
      return NextResponse.json({ properties: [] }, { status: 200 });
    }

    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : authClient;

    const { data: properties, error } = await db
      .from('properties')
      .select(`
        id,
        name,
        location,
        user_id,
        units (
          id,
          property_id,
          unit_number,
          rent_amount,
          deposit_fee,
          use_type,
          vat_treatment,
          vat_rate,
          water_fee,
          status
        )
      `)
      .eq('user_id', clientId)
      .order('name', { ascending: true });

    if (error) throw error;

    // Fetch dynamic utilities for units
    const formattedProperties = await Promise.all(
      (properties || []).map(async (prop) => {
        const unitsWithUtilities = await Promise.all(
          (prop.units || []).map(async (unit: any) => {
            const { data: charges } = await db
              .from('unit_utility_charges')
              .select(`
                amount,
                property_utility_types ( name )
              `)
              .eq('unit_id', unit.id)
              .eq('is_active', true);

            const utilities = (charges || []).map((c: any) => ({
              name: c.property_utility_types?.name || 'Utility',
              amount: c.amount || 0,
            }));

            return {
              ...unit,
              is_occupied: unit.status === 'OCCUPIED',
              utilities,
            };
          })
        );

        return {
          ...prop,
          units: unitsWithUtilities,
        };
      })
    );

    return NextResponse.json({ properties: formattedProperties });
  } catch (err: any) {
    console.error('Super-admin API GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch properties' }, { status: 500 });
  }
}

// ==================== POST: Create Property & Unit for Client ====================
export async function POST(req: NextRequest) {
  try {
    const authClient = await createServerSupabaseClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const body = await req.json();
    const {
      clientId,
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

    if (!clientId || !propertyName || !unitNumber || rentAmount === undefined) {
      return NextResponse.json({ error: 'Missing required fields: clientId, propertyName, unitNumber, or rentAmount.' }, { status: 400 });
    }

    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : authClient;

    // 1. Upsert property for the target clientId
    const { data: prop, error: propErr } = await db
      .from('properties')
      .upsert(
        {
          name: propertyName.trim(),
          location: location ? location.trim() : null,
          user_id: clientId,
        },
        { onConflict: 'name,user_id' }
      )
      .select('id')
      .single();

    if (propErr || !prop) throw new Error(propErr?.message || 'Failed to save property.');
    const propertyId = prop.id;

    // 2. Insert unit
    const { data: newUnit, error: unitErr } = await db
      .from('units')
      .insert({
        property_id: propertyId,
        unit_number: unitNumber.trim(),
        rent_amount: Number(rentAmount),
        deposit_fee: depositFee !== '' && depositFee !== null ? Number(depositFee) : null,
        use_type: useType || 'residential',
        vat_treatment: vatTreatment || 'A_EXEMPT',
        vat_rate: vatRate !== undefined ? Number(vatRate) : 0,
        water_fee: waterFee !== null && waterFee !== '' ? Number(waterFee) : null,
        status: 'VACANT',
      })
      .select('id')
      .single();

    if (unitErr || !newUnit) throw new Error(unitErr?.message || 'Failed to create unit.');
    const unitId = newUnit.id;

    // 3. Process Dynamic Utilities
    if (Array.isArray(utilities) && utilities.length > 0) {
      for (const util of utilities) {
        if (!util.name || util.amount === undefined) continue;

        const utilityName = util.name.trim();
        const utilityCode = slugify(utilityName);

        let utilityTypeId: string;
        const { data: existingUtilType } = await db
          .from('property_utility_types')
          .select('id')
          .eq('property_id', propertyId)
          .eq('code', utilityCode)
          .maybeSingle();

        if (existingUtilType) {
          utilityTypeId = existingUtilType.id;
        } else {
          const { data: newUtilType, error: utErr } = await db
            .from('property_utility_types')
            .insert({
              property_id: propertyId,
              name: utilityName,
              code: utilityCode,
              billing_method: 'fixed',
              default_amount: Number(util.amount),
              default_tax_treatment: vatTreatment || 'A_EXEMPT',
              default_vat_rate: vatRate || 0,
              created_by: user.id,
            })
            .select('id')
            .single();

          if (utErr || !newUtilType) continue;
          utilityTypeId = newUtilType.id;
        }

        await db.from('unit_utility_charges').insert({
          unit_id: unitId,
          utility_type_id: utilityTypeId,
          amount: Number(util.amount),
          tax_treatment: vatTreatment || 'A_EXEMPT',
          vat_rate: vatRate || 0,
          is_active: true,
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Property and unit saved successfully.' });
  } catch (err: any) {
    console.error('Super-admin API POST error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save property record.' }, { status: 500 });
  }
}

// ==================== PUT: Update Unit & Utilities ====================
export async function PUT(req: NextRequest) {
  try {
    const authClient = await createServerSupabaseClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const body = await req.json();
    const {
      unitId,
      unitNumber,
      rentAmount,
      depositFee,
      useType,
      vatTreatment,
      vatRate,
      waterFee,
      utilities,
    } = body;

    if (!unitId || !unitNumber || rentAmount === undefined) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : authClient;

    const { data: unitData, error: uFetchErr } = await db
      .from('units')
      .select('property_id')
      .eq('id', unitId)
      .single();

    if (uFetchErr || !unitData) throw new Error('Unit not found.');
    const propertyId = unitData.property_id;

    const { error: updateErr } = await db
      .from('units')
      .update({
        unit_number: unitNumber.trim(),
        rent_amount: Number(rentAmount),
        deposit_fee: depositFee !== '' && depositFee !== null ? Number(depositFee) : null,
        use_type: useType || 'residential',
        vat_treatment: vatTreatment || 'A_EXEMPT',
        vat_rate: vatRate !== undefined ? Number(vatRate) : 0,
        water_fee: waterFee !== null && waterFee !== '' ? Number(waterFee) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', unitId);

    if (updateErr) throw new Error(updateErr.message);

    // Refresh utilities
    await db
      .from('unit_utility_charges')
      .update({ is_active: false })
      .eq('unit_id', unitId);

    if (Array.isArray(utilities) && utilities.length > 0) {
      for (const util of utilities) {
        if (!util.name || util.amount === undefined) continue;

        const utilityName = util.name.trim();
        const utilityCode = slugify(utilityName);

        let utilityTypeId: string;
        const { data: existingUtilType } = await db
          .from('property_utility_types')
          .select('id')
          .eq('property_id', propertyId)
          .eq('code', utilityCode)
          .maybeSingle();

        if (existingUtilType) {
          utilityTypeId = existingUtilType.id;
        } else {
          const { data: newUtilType, error: utErr } = await db
            .from('property_utility_types')
            .insert({
              property_id: propertyId,
              name: utilityName,
              code: utilityCode,
              billing_method: 'fixed',
              default_amount: Number(util.amount),
              default_tax_treatment: vatTreatment || 'A_EXEMPT',
              default_vat_rate: vatRate || 0,
              created_by: user.id,
            })
            .select('id')
            .single();

          if (utErr || !newUtilType) continue;
          utilityTypeId = newUtilType.id;
        }

        const { data: existingCharge } = await db
          .from('unit_utility_charges')
          .select('id')
          .eq('unit_id', unitId)
          .eq('utility_type_id', utilityTypeId)
          .maybeSingle();

        if (existingCharge) {
          await db
            .from('unit_utility_charges')
            .update({
              amount: Number(util.amount),
              tax_treatment: vatTreatment || 'A_EXEMPT',
              vat_rate: vatRate || 0,
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingCharge.id);
        } else {
          await db.from('unit_utility_charges').insert({
            unit_id: unitId,
            utility_type_id: utilityTypeId,
            amount: Number(util.amount),
            tax_treatment: vatTreatment || 'A_EXEMPT',
            vat_rate: vatRate || 0,
            is_active: true,
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Unit updated successfully.' });
  } catch (err: any) {
    console.error('Super-admin API PUT error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update unit record.' }, { status: 500 });
  }
}