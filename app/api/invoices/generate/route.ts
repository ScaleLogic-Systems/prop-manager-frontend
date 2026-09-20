// app/api/invoices/generate/route.ts

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/supabaseServer';
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
    const authClient = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : authClient;
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
    const billingMonth = new Date().toISOString().slice(0, 7) + '-01';
    const invoiceNumber = `INV-${invoice_type.toUpperCase().slice(0, 3)}-${Date.now()}`;
    let propertyId = body.property_id || null;

    if (unit_id) {
      const { data: unit, error: unitError } = await db
        .from('units')
        .select('property_id')
        .eq('id', unit_id)
        .single();

      if (unitError || !unit) {
        return NextResponse.json({ error: 'Unit not found.' }, { status: 404 });
      }

      propertyId = unit.property_id;
    }

    // 4. Insert record into Supabase invoices table with tax compliance fields
    const { data: invoiceRecord, error: dbError } = await db
      .from('invoices')
      .insert([
        {
          invoice_number: invoiceNumber,
          billing_month: billingMonth,
          issued_by: user.id,
          issuer_profile_id: user.id,
          unit_id: unit_id || null,
          property_id: propertyId,
          customer_name: tenant_name || '',
          customer_kra_pin: tenant_kra_pin || null,
          invoice_type,
          rent_amount: invoice_type === 'rent' ? Number(amount) : 0,
          water_bill: invoice_type === 'water' ? taxSummary.grandTotal : 0,
          garbage_fee: 0,
          parking_fee: 0,
          subtotal_amount: taxSummary.subtotalTaxable + taxSummary.subtotalExempt,
          taxable_amount: taxSummary.subtotalTaxable,
          exempt_amount: taxSummary.subtotalExempt,
          non_vat_amount: invoice_type === 'deposit' ? taxSummary.subtotalExempt : 0,
          vat_amount: taxSummary.totalVat,
          grand_total: taxSummary.grandTotal,
          line_items: taxSummary.items,
          tax_summary: taxSummary,
          etims_status: 'pending_transmission',
          status: 'sent',
          due_date: body.due_date || null,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error (invoices):', dbError);
      throw new Error(`Failed to create invoice record: ${dbError.message}`);
    }

    // 5. Insert granular line items into invoice_items table for eTIMS auditing
    const { error: itemsError } = await db.from('invoice_items').insert([
      {
        invoice_id: invoiceRecord.id,
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

    if (invoice_type === 'water' && unit_id) {
      const { error: readingError } = await db.from('meter_readings').insert({
        unit_id,
        recorded_by: user.id,
        previous_reading: Number(previous_reading || 0),
        current_reading: Number(current_reading),
      });

      if (readingError) {
        console.error('Database insert error (meter_readings):', readingError);
      }
    }

    // 6. Non-blocking eTIMS Sync with fully-calculated tax metadata
    if (profile_id) {
      processInvoiceForEtims(invoiceRecord.id, profile_id, {
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
      invoice: invoiceRecord,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}