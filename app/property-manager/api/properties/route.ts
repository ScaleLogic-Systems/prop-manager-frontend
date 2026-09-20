import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const authClient = await createServerSupabaseClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : authClient;
    const { data: properties, error } = await db.from('properties')
      .select('id, name, units(id, unit_number, is_occupied)')
      .eq('property_manager_id', user.id);
    if (error) throw error;
    return NextResponse.json({ properties: (properties || []).map((property) => ({
      ...property,
      units: (property.units || []).map((unit) => unit.unit_number),
    })) });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load properties' }, { status: 500 });
  }
}
