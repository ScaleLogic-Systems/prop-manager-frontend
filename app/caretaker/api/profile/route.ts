import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : supabase;
    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    const { data: property, error: propertyError } = await db
      .from('properties')
      .select('id, name')
      .eq('caretaker_id', user.id)
      .limit(1)
      .maybeSingle();

    if (propertyError) throw propertyError;

    return NextResponse.json({
      profile: {
        id: profile?.id || user.id,
        full_name: profile?.full_name || user.user_metadata?.full_name || 'Caretaker',
        assigned_property_id: property?.id,
        assigned_property_name: property?.name,
      },
    });
  } catch (error: unknown) {
    console.error('Caretaker profile error:', error);
    return NextResponse.json({ error: 'Failed to load caretaker profile' }, { status: 500 });
  }
}
