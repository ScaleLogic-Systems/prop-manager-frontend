// app/api/tenant/submit-manual-payment/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { transaction_code, amount, invoice_id, notes } = body;

    if (!transaction_code || !amount) {
      return NextResponse.json({ success: false, error: 'Transaction code and amount are required.' }, { status: 400 });
    }

    const cleanCode = transaction_code.trim().toUpperCase();

    // 1. Duplicate check: Ensure this M-Pesa code hasn't already been submitted
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('reference', cleanCode)
      .single();

    if (existingPayment) {
      return NextResponse.json(
        { success: false, error: 'This M-Pesa transaction code has already been submitted or recorded.' },
        { status: 400 }
      );
    }

    // 2. Fetch tenant record linked to this user profile
    const { data: tenantRecord, error: tenantErr } = await supabase
      .from('tenants')
      .select('id, property_id, unit_id')
      .eq('profile_id', user.id)
      .single();

    if (tenantErr || !tenantRecord) {
      return NextResponse.json({ success: false, error: 'Tenant tenancy record not found.' }, { status: 404 });
    }

    // 3. Insert payment record with status 'under_review'
    const { error: insertErr } = await supabase.from('payments').insert({
      reference: cleanCode,
      amount: Number(amount),
      tenant_id: tenantRecord.id,
      property_id: tenantRecord.property_id,
      unit_id: tenantRecord.unit_id,
      invoice_id: invoice_id || null,
      method: 'M-Pesa Manual',
      status: 'under_review',
      description: notes ? `Manual M-Pesa: ${notes}` : 'Manual M-Pesa Payment Submission',
      created_at: new Date().toISOString(),
    });

    if (insertErr) throw insertErr;

    // Optional: If an invoice was linked, you can also mark it as 'under_review'
    if (invoice_id) {
      await supabase
        .from('invoices')
        .update({ status: 'under_review' })
        .eq('id', invoice_id);
    }

    return NextResponse.json({ success: true, message: 'Payment submitted successfully and is awaiting review.' });
  } catch (err: any) {
    console.error('Submit Manual Payment Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to submit payment.' }, { status: 500 });
  }
}