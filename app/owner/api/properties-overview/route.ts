import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Helper to create a Supabase client scoped to the user's request token
function getSupabaseClient(authHeader: string | null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Using service role for robust backend transaction handling

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

// Helper to generate a clean slug code for utility types
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '_')
    .replace(/^-+|-+$/g, '');
}

// ==================== GET: Fetch Properties, Units & Utilities ====================
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const supabase = getSupabaseClient(authHeader);

    // Fetch properties with units
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select(`
        id,
        name,
        location,
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
          is_occupied
        )
      `)
      .order('created_at', { ascending: false });

    if (propError) {
      throw new Error(propError.message);
    }

    // For each unit, fetch its associated dynamic utilities from unit_utility_charges & property_utility_types
    const formattedProperties = await Promise.all(
      (properties || []).map(async (prop) => {
        const unitsWithUtilities = await Promise.all(
          (prop.units || []).map(async (unit: any) => {
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
          ...prop,
          units: unitsWithUtilities,
        };
      })
    );

    return NextResponse.json({ success: true, properties: formattedProperties });
  } catch (err: any) {
    console.error('API GET error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch properties.' }, { status: 500 });
  }
}

// ==================== POST: Create Property & Unit with Utilities ====================
export async function POST(request: Request) {
  try {
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
      utilities, // Array of { name: string, amount: number }
    } = body;

    if (!propertyName || !unitNumber || rentAmount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: propertyName, unitNumber, or rentAmount.' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    const supabase = getSupabaseClient(authHeader);

    // 1. Check if property already exists for this name/location, otherwise create it
    let propertyId: string;
    const { data: existingProp } = await supabase
      .from('properties')
      .select('id')
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
        })
        .select('id')
        .single();

      if (propErr || !newProp) {
        throw new Error(`Failed to create property: ${propErr?.message}`);
      }
      propertyId = newProp.id;
    }

    // 2. Insert the Unit
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

    const unitId = newUnit.id;

    // 3. Process Dynamic Utilities
    if (Array.isArray(utilities) && utilities.length > 0) {
      for (const util of utilities) {
        if (!util.name || util.amount === undefined) continue;

        const utilityName = util.name.trim();
        const utilityCode = slugify(utilityName);

        // Check if utility type exists for this property
        let utilityTypeId: string;
        const { data: existingUtilType } = await supabase
          .from('property_utility_types')
          .select('id')
          .eq('property_id', propertyId)
          .eq('code', utilityCode)
          .maybeSingle();

        if (existingUtilType) {
          utilityTypeId = existingUtilType.id;
        } else {
          const { data: newUtilType, error: utErr } = await supabase
            .from('property_utility_types')
            .insert({
              property_id: propertyId,
              name: utilityName,
              code: utilityCode,
              billing_method: 'fixed',
              default_amount: Number(util.amount),
              default_tax_treatment: vatTreatment || 'A_EXEMPT',
              default_vat_rate: vatRate || 0,
            })
            .select('id')
            .single();

          if (utErr || !newUtilType) {
            console.error(`Failed to create utility type ${utilityName}:`, utErr);
            continue;
          }
          utilityTypeId = newUtilType.id;
        }

        // Insert unit utility charge
        await supabase.from('unit_utility_charges').insert({
          unit_id: unitId,
          utility_type_id: utilityTypeId,
          amount: Number(util.amount),
          tax_treatment: vatTreatment || 'A_EXEMPT',
          vat_rate: vatRate || 0,
          is_active: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Property and unit saved successfully with custom utilities.',
    });
  } catch (err: any) {
    console.error('API POST error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to save property record.' }, { status: 500 });
  }
}

// ==================== PUT: Update Unit & Utilities ====================
export async function PUT(request: Request) {
  try {
    const body = await request.json();
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
      return NextResponse.json(
        { success: false, error: 'Missing required fields: unitId, unitNumber, or rentAmount.' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    const supabase = getSupabaseClient(authHeader);

    // 1. Get unit's property_id
    const { data: unitData, error: uFetchErr } = await supabase
      .from('units')
      .select('property_id')
      .eq('id', unitId)
      .single();

    if (uFetchErr || !unitData) {
      throw new Error('Unit not found.');
    }

    const propertyId = unitData.property_id;

    // 2. Update Unit core details
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

    if (updateErr) {
      throw new Error(`Failed to update unit: ${updateErr.message}`);
    }

    // 3. Refresh Unit Utilities: Deactivate existing charges and re-sync
    await supabase
      .from('unit_utility_charges')
      .update({ is_active: false })
      .eq('unit_id', unitId);

    if (Array.isArray(utilities) && utilities.length > 0) {
      for (const util of utilities) {
        if (!util.name || util.amount === undefined) continue;

        const utilityName = util.name.trim();
        const utilityCode = slugify(utilityName);

        let utilityTypeId: string;
        const { data: existingUtilType } = await supabase
          .from('property_utility_types')
          .select('id')
          .eq('property_id', propertyId)
          .eq('code', utilityCode)
          .maybeSingle();

        if (existingUtilType) {
          utilityTypeId = existingUtilType.id;
        } else {
          const { data: newUtilType, error: utErr } = await supabase
            .from('property_utility_types')
            .insert({
              property_id: propertyId,
              name: utilityName,
              code: utilityCode,
              billing_method: 'fixed',
              default_amount: Number(util.amount),
              default_tax_treatment: vatTreatment || 'A_EXEMPT',
              default_vat_rate: vatRate || 0,
            })
            .select('id')
            .single();

          if (utErr || !newUtilType) continue;
          utilityTypeId = newUtilType.id;
        }

        // Upsert unit utility charge
        const { data: existingCharge } = await supabase
          .from('unit_utility_charges')
          .select('id')
          .eq('unit_id', unitId)
          .eq('utility_type_id', utilityTypeId)
          .maybeSingle();

        if (existingCharge) {
          await supabase
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
          await supabase.from('unit_utility_charges').insert({
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

    return NextResponse.json({
      success: true,
      message: 'Unit and utilities updated successfully.',
    });
  } catch (err: any) {
    console.error('API PUT error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to update unit record.' }, { status: 500 });
  }
}