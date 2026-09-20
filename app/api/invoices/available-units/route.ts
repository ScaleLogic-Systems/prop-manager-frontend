import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/supabaseServer';

interface UtilityChargeRecord {
  unit_id: string;
  amount: number | null;
  rate_per_unit: number | null;
  tax_treatment: string | null;
  property_utility_types: { name: string; code: string; billing_method: string; default_tax_treatment?: string };
}

export async function GET() {
  try {
    const authClient = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });

    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : authClient;
    const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
    const role = String(profile?.role || '').toLowerCase();
    let propertyQuery = db.from('properties').select('id, name, owner_id, property_manager_id, caretaker_id');
    if (role === 'owner' || role === 'landlord') propertyQuery = propertyQuery.eq('owner_id', user.id);
    else if (role === 'property_manager') propertyQuery = propertyQuery.eq('property_manager_id', user.id);
    else if (role === 'caretaker') propertyQuery = propertyQuery.eq('caretaker_id', user.id);
    else if (role !== 'super_admin') return NextResponse.json({ error: 'This account cannot issue invoices.' }, { status: 403 });

    const { data: properties, error: propertyError } = await propertyQuery;
    if (propertyError) throw propertyError;
    if (!properties?.length) return NextResponse.json({ units: [] });

    const propertyIds = properties.map((property) => property.id);
    const { data: units, error: unitsError } = await db.from('units')
      .select('id, property_id, unit_number, rent_amount, deposit_fee, water_fee, garbage_fee, parking_fee, use_type, vat_treatment, vat_rate')
      .in('property_id', propertyIds).eq('is_occupied', true);
    if (unitsError) throw unitsError;
    if (!units?.length) return NextResponse.json({ units: [] });

    const unitIds = units.map((unit) => unit.id);
    const [{ data: tenants, error: tenantsError }, { data: charges, error: chargesError }, { data: readings, error: readingsError }] = await Promise.all([
      db.from('tenants').select('unit_id, kra_pin, profiles(full_name)').in('unit_id', unitIds),
      db.from('unit_utility_charges').select('unit_id, amount, rate_per_unit, tax_treatment, vat_rate, property_utility_types(name, code, billing_method)').in('unit_id', unitIds).eq('is_active', true),
      db.from('meter_readings').select('unit_id, current_reading, reading_date, created_at').in('unit_id', unitIds).order('reading_date', { ascending: false }).order('created_at', { ascending: false }),
    ]);
    if (tenantsError) throw tenantsError;
    if (chargesError) throw chargesError;
    if (readingsError) throw readingsError;

    const tenantMap = new Map((tenants || []).map((tenant) => [tenant.unit_id, tenant]));
    const chargesMap = new Map<string, UtilityChargeRecord[]>();
    for (const rawCharge of charges || []) {
      const charge = rawCharge as unknown as UtilityChargeRecord & { property_utility_types: UtilityChargeRecord['property_utility_types'] | UtilityChargeRecord['property_utility_types'][] };
      const utilityType = Array.isArray(charge.property_utility_types) ? charge.property_utility_types[0] : charge.property_utility_types;
      if (utilityType) chargesMap.set(charge.unit_id, [...(chargesMap.get(charge.unit_id) || []), { ...charge, property_utility_types: utilityType }]);
    }
    const previousReadings = new Map<string, number>();
    for (const reading of readings || []) if (!previousReadings.has(reading.unit_id)) previousReadings.set(reading.unit_id, Number(reading.current_reading || 0));

    return NextResponse.json({
      units: units.map((unit) => {
        const tenant = tenantMap.get(unit.id);
        const tenantProfile = tenant?.profiles as { full_name?: string } | null;
        return {
          id: unit.id,
          property_id: unit.property_id,
          property_name: properties.find((property) => property.id === unit.property_id)?.name || 'Property',
          unit_number: unit.unit_number,
          tenant_name: tenantProfile?.full_name || 'Tenant',
          tenant_kra_pin: tenant?.kra_pin || null,
          previous_reading: previousReadings.get(unit.id) || 0,
          use_type: unit.use_type,
          vat_treatment: unit.vat_treatment,
          vat_rate: Number(unit.vat_rate || 0),
          charges: [
            { code: 'rent', name: 'Rent', item_type: unit.use_type === 'commercial' ? 'commercial_rent' : 'residential_rent', amount: Number(unit.rent_amount || 0), tax_category: unit.vat_treatment },
            { code: 'deposit', name: 'Security deposit', item_type: 'security_deposit', amount: Number(unit.deposit_fee || 0), tax_category: 'E_NON_VAT' },
            { code: 'water', name: 'Water', item_type: 'water_utility', amount: Number(unit.water_fee || 0), tax_category: unit.vat_treatment },
            { code: 'garbage', name: 'Garbage', item_type: 'service_charge', amount: Number(unit.garbage_fee || 0), tax_category: unit.vat_treatment },
            { code: 'parking', name: 'Parking', item_type: 'parking', amount: Number(unit.parking_fee || 0), tax_category: unit.vat_treatment },
            ...(chargesMap.get(unit.id) || []).map((charge) => ({
              code: `custom-${charge.property_utility_types.code}`,
              name: charge.property_utility_types.name,
              item_type: charge.property_utility_types.code === 'water' ? 'water_utility' : 'service_charge',
              amount: Number(charge.amount ?? charge.rate_per_unit ?? 0),
              tax_category: charge.tax_treatment || charge.property_utility_types.default_tax_treatment,
            })),
          ],
        };
      }),
    });
  } catch (error: unknown) {
    console.error('Invoice units error:', error);
    return NextResponse.json({ error: 'Failed to load invoice units' }, { status: 500 });
  }
}
