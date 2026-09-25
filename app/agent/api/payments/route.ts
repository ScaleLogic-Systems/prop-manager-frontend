// app/agent/api/payments/route.ts
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
    const statusFilter = url.searchParams.get('status');

    let propQuery = supabase.from('properties').select('id, name');
    if (paramPropertyId) {
      propQuery = propQuery.eq('id', paramPropertyId);
    } else {
      propQuery = propQuery.or(`manager_id.eq.${user.id},agent_id.eq.${user.id}`);
    }

    const { data: properties } = await propQuery;
    const propertyIds = (properties || []).map((p: any) => p.id);
    const propertyMap = new Map((properties || []).map((p: any) => [p.id, p.name]));

    if (propertyIds.length === 0) {
      return NextResponse.json({ success: true, payments: [] });
    }

    let payQuery = supabase
      .from('payments')
      .select(`
        id,
        reference,
        amount,
        method,
        status,
        created_at,
        description,
        tenants (
          profiles ( full_name ),
          units ( unit_number )
        )
      `)
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false });

    if (statusFilter) {
      payQuery = payQuery.eq('status', statusFilter);
    }

    const { data: payments, error: payErr } = await payQuery;
    if (payErr) throw payErr;

    const formattedPayments = (payments || []).map((p: any) => {
      const tenant = Array.isArray(p.tenants) ? p.tenants[0] : p.tenants || {};
      const profile = Array.isArray(tenant?.profiles) ? tenant.profiles[0] : tenant?.profiles || {};
      const unit = Array.isArray(tenant?.units) ? tenant.units[0] : tenant?.units || {};

      return {
        id: p.id,
        reference: p.reference || 'REF-N/A',
        tenant_name: profile.full_name || 'Tenant',
        unit_number: unit.unit_number || 'N/A',
        property_name: propertyMap.get(p.property_id) || 'Property',
        amount: Number(p.amount) || 0,
        method: p.method || 'M-Pesa',
        date: new Date(p.created_at).toLocaleDateString(),
        status: p.status || 'completed',
        description: p.description || 'Rent Payment',
      };
    });

    return NextResponse.json({ success: true, payments: formattedPayments });
  } catch (err: any) {
    console.error('Agent Payments API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}