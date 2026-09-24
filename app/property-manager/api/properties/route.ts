// app/property-manager/api/properties/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const authClient = await createServerSupabaseClient();
    const { data: { user } } = await authClient.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : authClient;

    // 1. Fetch user profile role
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = String(profile?.role || '').toLowerCase().trim();
    
    // Define privileged administrative roles that can view all properties platform-wide
    const isPrivileged = ['super_admin', 'superadmin', 'admin', 'developer', 'accountant'].includes(role);

    // 2. Build query based on precise role permissions
    let query = db.from('properties').select('id, name, property_manager_id, owner_id, units(id, unit_number, is_occupied)');

    if (!isPrivileged) {
      if (role === 'property_manager') {
        // Property managers only see properties assigned to them
        query = query.eq('property_manager_id', user.id);
      } else if (role === 'owner') {
        // Owners only see properties they own
        query = query.eq('owner_id', user.id);
      } else {
        // Fallback for other standard staff/caretakers: restrict to assigned property or deny
        query = query.or(`property_manager_id.eq.${user.id},owner_id.eq.${user.id}`);
      }
    }

    const { data: properties, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      properties: (properties || []).map((property) => ({
        id: property.id,
        name: property.name,
        units: (property.units || []).map((unit) => unit.unit_number),
      })),
    });

  } catch (error: unknown) {
    console.error('Property-Manager API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load properties' },
      { status: 500 }
    );
  }
}