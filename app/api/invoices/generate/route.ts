import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/supabaseServer';
import { processInvoiceForEtims } from '@/lib/etimsService';
import { calculateInvoiceTaxes, BillingItemType, KraTaxCategory } from '@/lib/etims/tax-engine';

interface RequestedItem {
  item_type: BillingItemType;
  description: string;
  quantity?: number;
  unit_price: number;
  override_tax_category?: KraTaxCategory;
}

interface UnitRecord {
  id: string;
  property_id: string;
  unit_number: string;
}

function isAuthorizedRole(role: string | undefined) {
  return ['owner', 'landlord', 'property_manager', 'caretaker', 'super_admin'].includes(
    (role || '').toLowerCase()
  );
}

export async function POST(request: Request) {
  try {
    const authClient = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });

    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : authClient;
    const body = await request.json();
    const unitId = String(body.unit_id || '');
    const items = body.items as RequestedItem[] | undefined;
    const billingKey = String(body.billing_key || 'rent');

    if (!unitId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'A unit and at least one invoice item are required.' }, { status: 400 });
    }

    const { data: actor, error: actorError } = await db
      .from('profiles').select('id, full_name, role').eq('id', user.id).single();
    if (actorError || !actor || !isAuthorizedRole(actor.role)) {
      return NextResponse.json({ error: 'This account cannot issue property invoices.' }, { status: 403 });
    }

    const { data: unit, error: unitError } = await db
      .from('units').select('id, property_id, unit_number').eq('id', unitId).single();
    if (unitError || !unit) return NextResponse.json({ error: 'Unit not found.' }, { status: 404 });

    const typedUnit = unit as UnitRecord;
    const { data: property, error: propertyError } = await db
      .from('properties').select('id, owner_id, property_manager_id, caretaker_id')
      .eq('id', typedUnit.property_id).single();
    if (propertyError || !property) return NextResponse.json({ error: 'Property not found.' }, { status: 404 });

    const hasPropertyAccess = [property.owner_id, property.property_manager_id, property.caretaker_id]
      .includes(user.id) || String(actor.role).toLowerCase() === 'super_admin';
    if (!hasPropertyAccess) return NextResponse.json({ error: 'You are not assigned to this property.' }, { status: 403 });

    const { data: tenant } = await db
      .from('tenants').select('id, profile_id, kra_pin, profiles(full_name)')
      .eq('unit_id', unitId).or(`lease_end.is.null,lease_end.gte.${new Date().toISOString().slice(0, 10)}`)
      .limit(1).maybeSingle();

    const month = String(body.billing_month || new Date().toISOString().slice(0, 7));
    const billingStart = new Date(`${month}-01T00:00:00.000Z`);
    if (Number.isNaN(billingStart.getTime())) return NextResponse.json({ error: 'Invalid billing month.' }, { status: 400 });
    const billingEnd = new Date(Date.UTC(billingStart.getUTCFullYear(), billingStart.getUTCMonth() + 1, 0));
    const billingPeriodStart = billingStart.toISOString().slice(0, 10);
    const billingPeriodEnd = billingEnd.toISOString().slice(0, 10);

    const { data: existingInvoice } = await db.from('invoices')
      .select('id, invoice_number, billing_key, issuer_profile_id')
      .eq('unit_id', unitId).eq('billing_period_start', billingPeriodStart)
      .eq('billing_period_end', billingPeriodEnd).eq('billing_key', billingKey).maybeSingle();
    if (existingInvoice) {
      return NextResponse.json({ error: `An invoice for this unit and billing scope already exists for this month (${existingInvoice.invoice_number}).` }, { status: 409 });
    }

    const normalizedItems = items.map((item) => ({
      description: String(item.description || '').trim(),
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unit_price),
      itemType: item.item_type,
      overrideTaxCategory: item.override_tax_category,
    }));
    if (normalizedItems.some((item) => !item.description || item.quantity <= 0 || item.unitPrice < 0)) {
      return NextResponse.json({ error: 'Invoice items must have valid descriptions, quantities, and amounts.' }, { status: 400 });
    }

    const taxSummary = calculateInvoiceTaxes(normalizedItems);
    const invoiceType = normalizedItems.length === 1 ? normalizedItems[0].itemType : 'utility';
    const invoiceNumber = `INV-${Date.now()}`;
    const legacyAmounts = normalizedItems.reduce((totals, item, index) => {
      const amount = taxSummary.items[index].totalAmount;
      if (item.itemType === 'residential_rent' || item.itemType === 'commercial_rent') totals.rent += amount;
      if (item.itemType === 'water_utility') totals.water += amount;
      if (item.itemType === 'parking') totals.parking += amount;
      if (item.itemType === 'service_charge') totals.garbage += amount;
      return totals;
    }, { rent: 0, water: 0, parking: 0, garbage: 0 });

    const tenantProfile = tenant?.profiles as { full_name?: string } | null;
    const { data: invoice, error: invoiceError } = await db.from('invoices').insert({
      invoice_number: invoiceNumber,
      billing_month: billingPeriodStart,
      billing_period_start: billingPeriodStart,
      billing_period_end: billingPeriodEnd,
      billing_key: billingKey,
      issued_by: user.id,
      issuer_profile_id: user.id,
      tenant_id: tenant?.id || null,
      unit_id: unitId,
      property_id: typedUnit.property_id,
      customer_name: tenantProfile?.full_name || body.tenant_name || 'Tenant',
      customer_kra_pin: tenant?.kra_pin || body.tenant_kra_pin || null,
      invoice_type: invoiceType,
      rent_amount: legacyAmounts.rent,
      water_bill: legacyAmounts.water,
      garbage_fee: legacyAmounts.garbage,
      parking_fee: legacyAmounts.parking,
      subtotal_amount: taxSummary.subtotalTaxable + taxSummary.subtotalExempt,
      taxable_amount: taxSummary.subtotalTaxable,
      exempt_amount: taxSummary.subtotalExempt,
      non_vat_amount: taxSummary.items.filter((item) => item.taxCategory === 'E_NON_VAT').reduce((total, item) => total + item.totalAmount, 0),
      vat_amount: taxSummary.totalVat,
      grand_total: taxSummary.grandTotal,
      line_items: taxSummary.items,
      tax_summary: taxSummary,
      etims_status: 'pending_transmission',
      status: 'Unpaid',
      due_date: body.due_date || null,
      issued_at: new Date().toISOString(),
    }).select().single();
    if (invoiceError || !invoice) throw new Error(`Failed to create invoice record: ${invoiceError?.message || 'unknown error'}`);

    const { error: itemsError } = await db.from('invoice_items').insert(taxSummary.items.map((item) => ({
      invoice_id: invoice.id,
      item_type: item.itemType,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      tax_category: item.taxCategory,
      tax_rate: item.taxRate,
      taxable_amount: item.taxableAmount,
      vat_amount: item.vatAmount,
      total_amount: item.totalAmount,
    })));
    if (itemsError) throw new Error(`Failed to save invoice items: ${itemsError.message}`);

    const { error: auditError } = await db.from('invoice_audit_logs').insert({
      invoice_id: invoice.id,
      actor_profile_id: user.id,
      actor_name_snapshot: actor.full_name,
      action: 'created',
      changed_fields: { billing_key: billingKey, item_types: normalizedItems.map((item) => item.itemType) },
    });
    if (auditError) throw new Error(`Failed to save invoice audit record: ${auditError.message}`);

    if (normalizedItems.some((item) => item.itemType === 'water_utility') && body.current_reading !== undefined) {
      const previousReading = Number(body.previous_reading || 0);
      const currentReading = Number(body.current_reading);
      if (currentReading < previousReading) return NextResponse.json({ error: 'Current meter reading cannot be lower than the previous reading.' }, { status: 400 });
      const { error: readingError } = await db.from('meter_readings').insert({ unit_id: unitId, recorded_by: user.id, previous_reading: previousReading, current_reading: currentReading });
      if (readingError) throw readingError;
    }

    processInvoiceForEtims(invoice.id, user.id, {
      amount: taxSummary.grandTotal,
      taxType: taxSummary.items[0]?.taxCategory || 'A_EXEMPT',
      vatAmount: taxSummary.totalVat,
      tenantKraPin: tenant?.kra_pin || body.tenant_kra_pin || '',
      description: `Invoice ${invoiceNumber} for Unit ${typedUnit.unit_number}`,
      items: taxSummary.items,
    }).catch((error: unknown) => console.error('eTIMS background processing error:', error));

    return NextResponse.json({ message: 'Invoice generated successfully.', tax_summary: taxSummary, invoice });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
