// app/api/invoices/generate/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { processInvoiceForEtims } from '@/lib/etimsService';
import { calculateInvoiceTaxes, BillingItemType } from '@/lib/etims/tax-engine';

/**
 * Maps incoming invoice_type string to Phase 2 BillingItemType
 */
function mapToBillingItemType(invoiceType: string): BillingItemType {
  const typeLower = invoiceType.toLowerCase();
  switch (typeLower) {
    case 'water':
      return 'water_utility';
    case 'electricity':
      return 'electricity';
    case 'rent':
    case 'residential_rent':
      return 'residential_rent';
    case 'commercial_rent':
      return 'commercial_rent';
    case 'service_charge':
      return 'service_charge';
    case 'parking':
      return 'parking';
    case 'deposit':
    case 'security_deposit':
      return 'security_deposit';
    default:
      return 'residential_rent';
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      profile_id,
      creator_role,
      unit_id,
      unit_number,
      tenant_name,
      previous_reading,
      current_reading,
      rate_per_unit,
      invoice_type = 'water',
      tenant_kra_pin,
      amount,
      description,
    } = body;

    // 1. Water meter reading validation
    if (invoice_type === 'water' && current_reading < previous_reading) {
      return NextResponse.json(
        { error: 'Current meter reading cannot be lower than previous reading.' },
        { status: 400 }
      );
    }

    // 2. Calculate quantities and raw line item details
    const units_consumed = invoice_type === 'water' ? (current_reading || 0) - (previous_reading || 0) : 1;
    const unitPrice = invoice_type === 'water' ? Number(rate_per_unit) : Number(amount);
    const itemDescription =
      description ||
      `${invoice_type.toUpperCase()} Invoice - Unit ${unit_number} (Issued by ${creator_role})`;

    // 3. Execute Phase 2 KRA Tax Calculation Engine
    const mappedItemType = mapToBillingItemType(invoice_type);
    const taxSummary = calculateInvoiceTaxes([
      {
        description: itemDescription,
        quantity: units_consumed,
        unitPrice: unitPrice,
        itemType: mappedItemType,
      },
    ]);

    const primaryItem = taxSummary.items[0];
    const invoiceId = `INV-${invoice_type.toUpperCase().slice(0, 3)}-${Date.now()}`;

    // 4. Insert record into Supabase invoices table with tax compliance fields
    const { data: invoiceRecord, error: dbError } = await supabase
      .from('invoices')
      .insert([
        {
          id: invoiceId,
          profile_id,
          creator_role,
          unit_id: unit_id || null,
          unit_number,
          tenant_name,
          invoice_type,
          previous_reading: invoice_type === 'water' ? previous_reading : null,
          current_reading: invoice_type === 'water' ? current_reading : null,
          units_consumed: invoice_type === 'water' ? units_consumed : null,
          rate_per_unit: invoice_type === 'water' ? rate_per_unit : null,
          amount: taxSummary.grandTotal,
          vat_amount: taxSummary.totalVat,
          tenant_kra_pin: tenant_kra_pin || null,
          tax_type: primaryItem.taxCategory,
          etims_status: 'pending_transmission',
          status: 'sent',
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error (invoices):', dbError);
      throw new Error(`Failed to create invoice record: ${dbError.message}`);
    }

    // 5. Insert granular line items into invoice_items table for eTIMS auditing
    const { error: itemsError } = await supabase.from('invoice_items').insert([
      {
        invoice_id: invoiceId,
        item_type: mappedItemType,
        description: primaryItem.description,
        quantity: primaryItem.quantity,
        unit_price: primaryItem.unitPrice,
        tax_category: primaryItem.taxCategory,
        tax_rate: primaryItem.taxRate,
        taxable_amount: primaryItem.taxableAmount,
        vat_amount: primaryItem.vatAmount,
        total_amount: primaryItem.totalAmount,
      },
    ]);

    if (itemsError) {
      console.error('Database insert error (invoice_items):', itemsError);
    }

    // 6. Non-blocking eTIMS Sync with fully-calculated tax metadata
    if (profile_id) {
      processInvoiceForEtims(invoiceId, profile_id, {
        amount: taxSummary.grandTotal,
        taxType: primaryItem.taxCategory,
        vatAmount: taxSummary.totalVat,
        tenantKraPin: tenant_kra_pin || '',
        description: itemDescription,
        items: taxSummary.items,
      }).catch((err: unknown) => console.error('eTIMS background processing error:', err));
    }

    return NextResponse.json({
      message: `${invoice_type.toUpperCase()} invoice generated successfully.`,
      tax_summary: taxSummary,
      invoice: invoiceRecord || { id: invoiceId, total_amount: taxSummary.grandTotal },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}