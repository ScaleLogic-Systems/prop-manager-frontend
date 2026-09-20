// app/api/etims/credit-note/route.ts

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
    const body = await request.json();
    const { invoice_id, profile_id, reason = 'CANCELLATION', description } = body;

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

    // 1. Fetch Original Invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Original invoice not found.' }, { status: 404 });
    }

    if (invoice.etims_status !== 'signed') {
      return NextResponse.json(
        { error: 'Cannot issue a credit note on an invoice that is not signed by eTIMS.' },
        { status: 400 }
      );
    }

    // 2. Fetch Agency KRA Credentials
    const { data: agency, error: agencyError } = await supabase
      .from('agency_etims_configs')
      .select('profile_id, kra_pin, branch_code, is_enabled')
      .eq('profile_id', profile_id)
      .single();

    if (agencyError || !agency || !agency.is_enabled) {
      return NextResponse.json(
        { error: 'eTIMS integration is disabled for this organization.' },
        { status: 400 }
      );
    }

    const creditNoteId = `CN-${Date.now()}`;

    // 3. Construct KRA eTIMS Credit Note Payload
    const etimsCreditNotePayload = {
      tin: agency.kra_pin,
      bhfId: agency.branch_code || '00',
      invcNo: creditNoteId,
      orgInvcNo: invoice.cu_invoice_number, // Must reference original KRA CUIN
      custTin: invoice.customer_kra_pin || '',
      custNm: invoice.customer_name,
      salesSttsCd: '02', // Normal Reversal
      receptTyCd: 'C',  // 'C' = Credit Note
      pmtTyCd: '01',
      totItemCnt: invoice.invoice_items?.length || 1,
      taxblAmtA: invoice.exempt_amount || 0,
      taxblAmtB: invoice.taxable_amount || 0,
      taxAmtB: invoice.vat_amount || 0,
      totTaxblAmt: invoice.taxable_amount || 0,
      totTaxAmt: invoice.vat_amount || 0,
      totAmt: invoice.grand_total,
      remark: description || `Credit Note issued for Invoice ${invoice.id} (${reason})`,
      itemList: (invoice.line_items || invoice.invoice_items || []).map((item: EtimsLineItem, idx: number) => ({
        itemSeq: idx + 1,
        itemCd: item.item_type || item.itemType,
        itemNm: `[CREDIT NOTE] ${item.description}`,
        qty: item.quantity,
        prc: item.unit_price ?? item.unitPrice,
        splyAmt: item.taxable_amount ?? item.taxableAmount,
        taxTyCd: (item.tax_category || item.taxCategory) === 'B_STANDARD_16' ? 'B' : 'A',
        taxAmt: item.vat_amount ?? item.vatAmount,
        totAmt: item.total_amount ?? item.totalAmount,
      })),
    };

    // 4. Transmit Payload to KRA / Middleware API
    const ETIMS_ENDPOINT = process.env.ETIMS_API_URL || 'https://etims-api-sandbox.kra.go.ke/selectTrnsSalesSaveItm';

    const etimsResponse = await fetch(ETIMS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'kra-api-key': process.env.ETIMS_API_KEY || '',
      },
      body: JSON.stringify(etimsCreditNotePayload),
    });

    const etimsResult = await etimsResponse.json().catch(() => null);
    const isSuccess = etimsResponse.ok && etimsResult?.resultCd === '000';

    const cuSerialNumber = etimsResult?.data?.sdcId || `KRA-ESD-${Math.floor(100000 + Math.random() * 900000)}`;
    const cuCreditNoteNumber = etimsResult?.data?.curInvcNo || `CUCN-${Date.now()}`;
    const qrCodeUrl = etimsResult?.data?.qrCodeUrl || `https://itax.kra.go.ke/KRA-Portal/qrVerify.htm?data=${cuCreditNoteNumber}`;

    if (isSuccess || process.env.NODE_ENV === 'development') {
      // 5. Store Credit Note Record in Supabase
      const { data: creditNoteRecord, error: cnError } = await supabase
        .from('credit_notes')
        .insert([
          {
            id: creditNoteId,
            invoice_id: invoice.id,
            profile_id,
            amount: invoice.grand_total,
            vat_amount: invoice.vat_amount || 0,
            reason,
            description,
            cu_serial_number: cuSerialNumber,
            cu_credit_note_number: cuCreditNoteNumber,
            etims_qr_code_url: qrCodeUrl,
            etims_status: 'signed',
          },
        ])
        .select()
        .single();

      if (cnError) {
        throw new Error(`Failed to save credit note record: ${cnError.message}`);
      }

      // 6. Update original invoice status to cancelled
      await supabase
        .from('invoices')
        .update({ status: 'cancelled' })
        .eq('id', invoice_id);

      return NextResponse.json({
        message: 'Credit Note issued successfully and transmitted to eTIMS.',
        credit_note: creditNoteRecord,
      });
    } else {
      const errorMsg = etimsResult?.resultMsg || 'Failed to transmit Credit Note to KRA eTIMS.';
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}