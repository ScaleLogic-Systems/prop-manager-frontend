// app/property-manager/api/users/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const authClient = await createServerSupabaseClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    
    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : authClient;
    const { data: properties, error: propertiesError } = await db.from('properties').select('id, name').eq('property_manager_id', user.id);
    if (propertiesError) throw propertiesError;
    
    const propertyIds = (properties || []).map((property) => property.id);
    if (!propertyIds.length) return NextResponse.json({ users: [] });

    const [
      { data: tenants, error: tenantsError },
      { data: staff, error: staffError }
    ] = await Promise.all([
      db.from('tenants').select('id, profile_id, property_id, unit_id, profiles(id, full_name, email, phone, role), units(unit_number)').in('property_id', propertyIds),
      db.from('properties').select('id, caretaker_id, agent_id, caretaker:caretaker_id(id, full_name, email, phone, role), agent:agent_id(id, full_name, email, phone, role)').in('id', propertyIds),
    ]);

    if (tenantsError) throw tenantsError;
    if (staffError) throw staffError;

    const propertyMap = new Map((properties || []).map((property) => [property.id, property.name]));
    
    const users: Array<{ id: string; full_name: string; email: string; phone: string; role: string; property_id: string; property_name: string; unit_number?: string; status: string; invited_at: string }> = (tenants || []).map((tenant) => ({
      id: tenant.profile_id,
      full_name: (tenant.profiles as { full_name?: string })?.full_name || '',
      email: (tenant.profiles as { email?: string })?.email || '',
      phone: (tenant.profiles as { phone?: string })?.phone || '',
      role: 'tenant', 
      property_id: tenant.property_id, 
      property_name: propertyMap.get(tenant.property_id) || '',
      unit_number: (tenant.units as { unit_number?: string })?.unit_number, 
      status: 'active', 
      invited_at: '',
    }));

    for (const property of staff || []) {
      const caretaker = property.caretaker as unknown as { id: string; full_name: string; email: string; phone: string; role: string } | null;
      if (caretaker) {
        users.push({ 
          id: caretaker.id, 
          full_name: caretaker.full_name, 
          email: caretaker.email, 
          phone: caretaker.phone, 
          role: 'caretaker', 
          property_id: property.id, 
          property_name: propertyMap.get(property.id) || '', 
          unit_number: undefined, 
          status: 'active', 
          invited_at: '' 
        });
      }

      const agent = property.agent as unknown as { id: string; full_name: string; email: string; phone: string; role: string } | null;
      if (agent) {
        users.push({ 
          id: agent.id, 
          full_name: agent.full_name, 
          email: agent.email, 
          phone: agent.phone, 
          role: 'agent', 
          property_id: property.id, 
          property_name: propertyMap.get(property.id) || '', 
          unit_number: undefined, 
          status: 'active', 
          invited_at: '' 
        });
      }
    }

    return NextResponse.json({ users });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load users' }, { status: 500 });
  }
}