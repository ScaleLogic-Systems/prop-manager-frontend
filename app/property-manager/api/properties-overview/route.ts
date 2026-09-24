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

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing auth token.' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Verify user session
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid session.' }, { status: 401 });
    }

    // 2. Fetch profile role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = String(profile?.role || '').toLowerCase().trim();
    const isPrivileged = ['super_admin', 'superadmin', 'admin', 'developer', 'accountant'].includes(role);

    // 3. Build query based on role
    let query = supabase.from('properties').select(`
      id,
      name,
      location,
      property_manager_id,
      owner_id,
      units (
        id,
        unit_number,
        is_occupied,
        invoices (
          id,
          amount,
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

    // 4. Format and compute financials per property
    const formattedProperties = (properties || []).map((prop: any) => {
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

      units.forEach((unit: any) => {
        const invoices = unit.invoices || [];
        invoices.forEach((inv: any) => {
          const status = String(inv.status || '').toLowerCase();
          const amount = Number(inv.amount || 0);

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
      });

      return {
        propertyId: prop.id,
        propertyName: prop.name,
        totalUnits,
        occupiedUnits,
        vacantUnits,
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
    });

    return NextResponse.json({ success: true, properties: formattedProperties });
  } catch (err: any) {
    console.error('Property Manager Overview API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch properties overview.' }, { status: 500 });
  }
}