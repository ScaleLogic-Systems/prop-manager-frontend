// app/caretaker/api/dashboard-metrics/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

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

    const url = new URL(request.url);
    const paramPropertyId = url.searchParams.get('property_id');

    // Query property assigned to this caretaker via caretaker_id
    let propertyQuery = supabase.from('properties').select(`
      id,
      name,
      units (
        id,
        is_occupied,
        invoices (
          id,
          grand_total,
          status
        )
      )
    `);

    if (paramPropertyId) {
      propertyQuery = propertyQuery.eq('id', paramPropertyId);
    } else {
      propertyQuery = propertyQuery.eq('caretaker_id', user.id);
    }

    const { data: properties, error: propErr } = await propertyQuery;
    if (propErr) throw propErr;

    const property = properties && properties.length > 0 ? properties[0] : null;

    if (!property) {
      return NextResponse.json({
        success: true,
        property_id: null,
        property_name: null,
        metrics: {
          occupiedUnits: 0,
          vacantUnits: 0,
          paidCount: 0,
          unpaidCount: 0,
          overdueCount: 0,
          partialCount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
          overdueAmount: 0,
          partialAmount: 0,
        }
      });
    }

    const units = property.units || [];
    const occupiedUnits = units.filter((u: any) => u.is_occupied).length;
    const vacantUnits = units.length - occupiedUnits;

    let paidCount = 0;
    let unpaidCount = 0;
    let overdueCount = 0;
    let partialCount = 0;

    let paidAmount = 0;
    let unpaidAmount = 0;
    let overdueAmount = 0;
    let partialAmount = 0;

    units.forEach((unit: any) => {
      const invoices = unit.invoices || [];
      invoices.forEach((inv: any) => {
        const status = String(inv.status || '').toLowerCase();
        const amount = Number(inv.grand_total || 0);

        if (status === 'paid') {
          paidCount++;
          paidAmount += amount;
        } else if (status === 'unpaid' || status === 'pending') {
          unpaidCount++;
          unpaidAmount += amount;
        } else if (status === 'overdue') {
          overdueCount++;
          overdueAmount += amount;
        } else if (status === 'partial') {
          partialCount++;
          partialAmount += amount;
        }
      });
    });

    return NextResponse.json({
      success: true,
      property_id: property.id,
      property_name: property.name,
      metrics: {
        occupiedUnits,
        vacantUnits,
        paidCount,
        unpaidCount,
        overdueCount,
        partialCount,
        paidAmount,
        unpaidAmount,
        overdueAmount,
        partialAmount,
      }
    });

  } catch (err: any) {
    console.error('Caretaker Dashboard Metrics Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch metrics.' }, { status: 500 });
  }
}