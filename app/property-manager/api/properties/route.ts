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

    // 1. Check user profile role
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = String(profile?.role || '').toLowerCase().trim();
    const isPrivileged = ['super_admin', 'superadmin', 'developer', 'accountant'].includes(role);

    // 2. Build query based on role permissions
    let query = db.from('properties').select('id, name, property_manager_id, owner_id, units(id, unit_number, is_occupied)');

    if (!isPrivileged) {
      // Allow property managers and owners to see properties they manage or own
      query = query.or(`property_manager_id.eq.${user.id},owner_id.eq.${user.id}`);
    }

    const { data: properties, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
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