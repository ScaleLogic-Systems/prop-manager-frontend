// app/agent/api/verify-payment/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { payment_id, action } = body; // action: 'approve' or 'reject'

    if (!payment_id || !action) {
      return NextResponse.json({ success: false, error: 'Payment ID and action are required.' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'completed' : 'rejected';

    // Update payment status
    const { error: updateErr } = await supabase
      .from('payments')
      .update({ status: newStatus })
      .eq('id', payment_id);

    if (updateErr) throw updateErr;

    // If approved, check if there's an associated invoice and mark it paid/settled
    if (action === 'approve') {
      const { data: payRecord } = await supabase
        .from('payments')
        .select('invoice_id, amount')
        .eq('id', payment_id)
        .single();

      if (payRecord?.invoice_id) {
        await supabase
          .from('invoices')
          .update({ status: 'paid' })
          .eq('id', payRecord.invoice_id);
      }
    }

    return NextResponse.json({ success: true, message: `Payment successfully ${action === 'approve' ? 'approved' : 'rejected'}.` });
  } catch (err: any) {
    console.error('Verify Payment Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}