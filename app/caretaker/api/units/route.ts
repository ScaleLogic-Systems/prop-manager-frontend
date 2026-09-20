import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const authClient = await createServerSupabaseClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    const propertyId = request.nextUrl.searchParams.get('property_id');
    if (!propertyId) return NextResponse.json({ error: 'Property is required.' }, { status: 400 });
    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : authClient;
    const { data: property } = await db.from('properties').select('id').eq('id', propertyId).eq('caretaker_id', user.id).single();
    if (!property) return NextResponse.json({ error: 'Property not found or access denied.' }, { status: 403 });
    const { data: units, error } = await db.from('units').select('id, unit_number').eq('property_id', propertyId).eq('is_occupied', false).order('unit_number');
    if (error) throw error;
    return NextResponse.json({ units: units || [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load units' }, { status: 500 });
  }
}
