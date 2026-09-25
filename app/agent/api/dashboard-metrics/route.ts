// app/agent/api/dashboard-metrics/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const paramPropertyId = url.searchParams.get('property_id');

    // Get assigned properties
    let propQuery = supabase.from('properties').select('id');
    if (paramPropertyId) {
      propQuery = propQuery.eq('id', paramPropertyId);
    } else {
      propQuery = propQuery.or(`manager_id.eq.${user.id},agent_id.eq.${user.id}`);
    }

    const { data: properties } = await propQuery;
    const propertyIds = (properties || []).map((p: any) => p.id);

    if (propertyIds.length === 0) {
      return NextResponse.json({
        success: true,
        metrics: { totalUnits: 0, occupiedUnits: 0, vacantUnits: 0, totalCollected: 0, pendingReviewPayments: 0, activeTenantsCount: 0 }
      });
    }

    // Units metrics
    const { data: units } = await supabase.from('units').select('id, status').in('property_id', propertyIds);
    const totalUnits = (units || []).length;
    const occupiedUnits = (units || []).filter((u: any) => u.status === 'occupied' || u.status === 'OCCUPIED').length;
    const vacantUnits = totalUnits - occupiedUnits;

    // Tenants count
    const { count: tenantsCount } = await supabase
      .from('tenants')
      .select('id', { count: 'exact', head: true })
      .in('property_id', propertyIds);

    // Total collected payments (completed)
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, status')
      .in('property_id', propertyIds);

    const totalCollected = (payments || [])
      .filter((p: any) => p.status === 'completed' || p.status === 'settled')
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    const pendingReviewPayments = (payments || [])
      .filter((p: any) => p.status === 'under_review').length;

    return NextResponse.json({
      success: true,
      metrics: {
        totalUnits,
        occupiedUnits,
        vacantUnits,
        totalCollected,
        pendingReviewPayments,
        activeTenantsCount: tenantsCount || 0,
      }
    });
  } catch (err: any) {
    console.error('Agent Dashboard Metrics Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}