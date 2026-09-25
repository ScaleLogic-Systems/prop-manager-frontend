// app/agent/api/profile/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing token.' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid session.' }, { status: 401 });
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Fetch properties assigned to this agent (via manager_id or agent_id column)
    const { data: properties } = await supabase
      .from('properties')
      .select('id, name')
      .or(`manager_id.eq.${user.id},agent_id.eq.${user.id}`);

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        full_name: profile?.full_name || profile?.name || 'Property Agent',
        email: profile?.email || user.email || '',
        phone: profile?.phone || '',
        role: profile?.role || 'agent',
      },
      properties: properties || []
    });
  } catch (err: any) {
    console.error('Agent Profile API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}