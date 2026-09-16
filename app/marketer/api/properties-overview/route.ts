// app/marketer/api/properties-overview/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Helper to initialize Supabase client authenticated with the Bearer token passed in headers
 */
function getAuthenticatedSupabaseClient(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    }
  );
}

// ==========================================
// 1. GET: FETCH ALL PROPERTIES & UNITS
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const supabase = getAuthenticatedSupabaseClient(req);

    // Authenticate user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized user session.' }, { status: 401 });
    }

    // Query properties with nested units
    const { data: properties, error: dbError } = await supabase
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
          garbage_fee,
          parking_fee,
          water_fee,
          is_occupied
        )
      `)
      .order('name', { ascending: true });

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ properties: properties || [] }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ==========================================
// 2. POST: CREATE / UPSERT PROPERTY & ADD UNIT
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const supabase = getAuthenticatedSupabaseClient(req);

    // Authenticate user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized user session.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      propertyName,
      location,
      unitNumber,
      rentAmount,
      garbageFee,
      parkingFee,
      waterFee,
    } = body;

    if (!propertyName || !unitNumber) {
      return NextResponse.json(
        { error: 'Property Name and Unit Number are required fields.' },
        { status: 400 }
      );
    }

    // Step A: Check if property already exists by name
    const { data: existingProperty } = await supabase
      .from('properties')
      .select('id')
      .ilike('name', propertyName.trim())
      .maybeSingle();

    let propertyId = existingProperty?.id;

    // Step B: If property doesn't exist, create it
    if (!propertyId) {
      const { data: newProperty, error: propError } = await supabase
        .from('properties')
        .insert({
          name: propertyName.trim(),
          location: location ? location.trim() : '',
          created_by: user.id,
        })
        .select('id')
        .single();

      if (propError) {
        return NextResponse.json({ error: propError.message }, { status: 500 });
      }

      propertyId = newProperty.id;
    }

    // Step C: Insert new unit into units table
    const { data: newUnit, error: unitError } = await supabase
      .from('units')
      .insert({
        property_id: propertyId,
        unit_number: unitNumber.trim(),
        rent_amount: Number(rentAmount) || 0,
        garbage_fee: garbageFee !== null && garbageFee !== undefined ? Number(garbageFee) : null,
        parking_fee: parkingFee !== null && parkingFee !== undefined ? Number(parkingFee) : null,
        water_fee: waterFee !== null && waterFee !== undefined ? Number(waterFee) : null,
        is_occupied: false,
      })
      .select()
      .single();

    if (unitError) {
      return NextResponse.json({ error: unitError.message }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, message: 'Property unit recorded successfully.', unit: newUnit },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ==========================================
// 3. PUT: UPDATE EXISTING UNIT
// ==========================================
export async function PUT(req: NextRequest) {
  try {
    const supabase = getAuthenticatedSupabaseClient(req);

    // Authenticate user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized user session.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      unitId,
      unitNumber,
      rentAmount,
      garbageFee,
      parkingFee,
      waterFee,
    } = body;

    if (!unitId || !unitNumber) {
      return NextResponse.json(
        { error: 'Unit ID and Unit Number are required for updates.' },
        { status: 400 }
      );
    }

    const { data: updatedUnit, error: updateError } = await supabase
      .from('units')
      .update({
        unit_number: unitNumber.trim(),
        rent_amount: Number(rentAmount) || 0,
        garbage_fee: garbageFee !== null && garbageFee !== undefined ? Number(garbageFee) : null,
        parking_fee: parkingFee !== null && parkingFee !== undefined ? Number(parkingFee) : null,
        water_fee: waterFee !== null && waterFee !== undefined ? Number(waterFee) : null,
      })
      .eq('id', unitId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, message: 'Unit updated successfully.', unit: updatedUnit },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}