// app/api/users/remove/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies(); // <-- Await cookies() here
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // 1. Client for checking session of the requester
    const supabaseClient = createServerClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user: requester }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !requester) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch requester's role from profiles
    const { data: requesterProfile } = await supabaseClient
      .from('profiles')
      .select('role, full_name')
      .eq('id', requester.id)
      .single();

    const requesterRole = requesterProfile?.role || 'tenant';

    // 3. Parse target user to delete
    const body = await request.json();
    const { targetUserId, targetRole, propertyId, unitId } = body;

    if (!targetUserId || !targetRole) {
      return NextResponse.json({ error: 'Target user ID and role are required' }, { status: 400 });
    }

    // 4. Validate Hierarchical Permissions
    let hasPermission = false;
    if (requesterRole === 'super_admin') {
      hasPermission = true;
    } else if (requesterRole === 'owner') {
      hasPermission = ['property_manager', 'caretaker', 'tenant'].includes(targetRole);
    } else if (requesterRole === 'property_manager') {
      hasPermission = ['caretaker', 'tenant'].includes(targetRole);
    } else if (requesterRole === 'caretaker') {
      hasPermission = targetRole === 'tenant';
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to remove this user.' }, { status: 403 });
    }

    // 5. Admin client using Service Role to perform deletions & updates
    const supabaseAdmin = createServerClient(supabaseUrl, supabaseServiceKey, {
      cookies: { get: () => undefined },
    });

    // 6. If target is a tenant, free up their assigned unit (preserving payment/invoice history)
    if (targetRole === 'tenant' && unitId) {
      await supabaseAdmin
        .from('units')
        .update({ is_occupied: false, tenant_id: null })
        .eq('id', unitId);
    }

    // 7. Delete user from Supabase Auth & public profiles
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (deleteAuthError) {
      console.warn('Auth user deletion warning:', deleteAuthError.message);
    }

    await supabaseAdmin.from('profiles').delete().eq('id', targetUserId);

    // 8. Record in Audit Logs (Who removed whom and when)
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: requester.id,
      actor_name: requesterProfile?.full_name || 'System User',
      actor_role: requesterRole,
      action: 'REMOVE_USER',
      target_user_id: targetUserId,
      target_user_role: targetRole,
      details: `Removed ${targetRole} (ID: ${targetUserId}) from property ${propertyId || 'N/A'}.`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'User successfully removed and unit updated.' });
  } catch (err: any) {
    console.error('Error removing user:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}