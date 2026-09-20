// app/api/etims/sign-invoice/route.ts

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/supabaseServer';

interface EtimsLineItem {
  item_type?: string;
  itemType?: string;
  description: string;
  quantity: number;
  unit_price?: number;
  unitPrice?: number;
  taxable_amount?: number;
  taxableAmount?: number;
  vat_amount?: number;
  vatAmount?: number;
  total_amount?: number;
  totalAmount?: number;
  tax_category?: string;
  taxCategory?: string;
}

export async function POST(request: Request) {
  try {
    const { invoice_id, profile_id } = await request.json();

    if (!invoice_id || !profile_id) {
      return NextResponse.json(
        { error: 'Missing invoice_id or profile_id.' },
        { status: 400 }
      );
    }

    const authClient = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : authClient;

    // 1. Fetch Organization eTIMS Credentials
    const { data: agency, error: agencyError } = await supabase
      .from('agency_etims_configs')
      .select('profile_id, kra_pin, branch_code, is_enabled')
      .eq('profile_id', profile_id)
      .single();

    if (agencyError || !agency || !agency.is_enabled) {
      await supabase
        .from('invoices')
        .update({
          etims_status: 'failed',
          etims_error_message: 'eTIMS is not configured or enabled for this organization.',
        })
        .eq('id', invoice_id);

      return NextResponse.json(
        { error: 'eTIMS integration disabled for organization.' },
        { status: 400 }
      );
    }

    // 2. Fetch Invoice & Item Details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    // 3. Construct KRA eTIMS Payload Structure
    const etimsPayload = {
      tin: agency.kra_pin,
    bhfId: agency.branch_code || '00',
      invcNo: invoice.id,
      orgInvcNo: invoice.id,
      custTin: invoice.customer_kra_pin || '',
      custNm: invoice.customer_name,
      salesSttsCd: '02', // 02 = Normal Sale
      receptTyCd: 'S',  // S = Sales Invoice
      pmtTyCd: '01',    // 01 = Cash / Electronic Payment
      totItemCnt: invoice.invoice_items?.length || 1,
      taxblAmtA: invoice.exempt_amount || 0,
      taxblAmtB: invoice.taxable_amount || 0,
      taxAmtB: invoice.vat_amount || 0,
      totTaxblAmt: invoice.taxable_amount || 0,
      totTaxAmt: invoice.vat_amount || 0,
      totAmt: invoice.grand_total,
      itemList: (invoice.line_items || invoice.invoice_items || []).map((item: EtimsLineItem, idx: number) => ({
        itemSeq: idx + 1,
        itemCd: item.item_type || item.itemType,
        itemNm: item.description,
        qty: item.quantity,
        prc: item.unit_price ?? item.unitPrice,
        splyAmt: item.taxable_amount ?? item.taxableAmount,
        taxTyCd: (item.tax_category || item.taxCategory) === 'B_STANDARD_16' ? 'B' : 'A',
        taxAmt: item.vat_amount ?? item.vatAmount,
        totAmt: item.total_amount ?? item.totalAmount,
      })),
    };

    // 4. Send Transmission to KRA / Middleware API
    const ETIMS_ENDPOINT = process.env.ETIMS_API_URL || 'https://etims-api-sandbox.kra.go.ke/selectTrnsSalesSaveItm';
    
    // Perform API fetch call
    const etimsResponse = await fetch(ETIMS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'kra-api-key': process.env.ETIMS_API_KEY || '',
      },
      body: JSON.stringify(etimsPayload),
    });

    const etimsResult = await etimsResponse.json().catch(() => null);

    // Mock successful response if testing in local sandbox environment
    const isSuccess = etimsResponse.ok && etimsResult?.resultCd === '000';
    
    const cuSerialNumber = etimsResult?.data?.sdcId || `KRA-ESD-${Math.floor(100000 + Math.random() * 900000)}`;
    const cuInvoiceNumber = etimsResult?.data?.curInvcNo || `CUIN-${Date.now()}`;
    const qrCodeUrl = etimsResult?.data?.qrCodeUrl || `https://itax.kra.go.ke/KRA-Portal/qrVerify.htm?data=${cuInvoiceNumber}`;

    if (isSuccess || process.env.NODE_ENV === 'development') {
      // 5. Update Database Record with Signed Metadata
      await supabase
        .from('invoices')
        .update({
          cu_serial_number: cuSerialNumber,
          cu_invoice_number: cuInvoiceNumber,
          etims_qr_code_url: qrCodeUrl,
          etims_status: 'signed',
          etims_error_message: null,
        })
        .eq('id', invoice_id);

      return NextResponse.json({
        success: true,
        cu_serial_number: cuSerialNumber,
        cu_invoice_number: cuInvoiceNumber,
        etims_qr_code_url: qrCodeUrl,
      });
    } else {
      const errorMsg = etimsResult?.resultMsg || 'Failed to transmit invoice to KRA eTIMS.';
      await supabase
        .from('invoices')
        .update({
          etims_status: 'failed',
          etims_error_message: errorMsg,
        })
        .eq('id', invoice_id);

      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}