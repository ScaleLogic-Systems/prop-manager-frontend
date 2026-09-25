// app/owner/api/invite-user/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/supabaseServer';
import { resend, FROM_EMAIL } from '@/lib/resend';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone?: string | null;
  phone_number?: string | null;
  role: string | null;
  status: string | null;
  must_change_password: boolean | null;
  created_at: string;
}

interface Property {
  id: string;
  name: string;
  property_manager_id?: string | null;
  caretaker_id?: string | null;
  agent_id?: string | null;
}

interface Tenant {
  id: string;
  profile_id: string;
  property_id: string | null;
  unit_id: string | null;
  created_at: string;
}

interface Unit {
  id: string;
  unit_number: string;
}

export interface DirectoryUser {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  property_name: string;
  unit_number: string;
  status: string;
  created_at: string;
  invited_at: string;
}

// Helper to generate a clean, human-readable temporary password (e.g. PM-8A2K9X)
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomStr = '';
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PM-${randomStr}`;
}

// ==========================================
// 1. GET HANDLER: Fetch Directory
// ==========================================
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      console.error('[GET_USERS_DIRECTORY] Failed to create server Supabase client.');
      return NextResponse.json(
        { error: 'Failed to initialize session client.' },
        { status: 500 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized session.' },
        { status: 401 }
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      console.error(
        '[GET_USERS_DIRECTORY_ERROR] Service Role Admin Client is missing or unconfigured.'
      );
      return NextResponse.json(
        { error: 'Server configuration error: Service role key missing.' },
        { status: 500 }
      );
    }

    const ownerId = user.id;

    // Fetch properties owned by landlord
    const { data: ownerProperties, error: propsError } = await admin
      .from('properties')
      .select('id, name, property_manager_id, caretaker_id, agent_id')
      .eq('owner_id', ownerId);

    if (propsError) {
      console.error('[GET_USERS_PROPS_ERROR]', propsError.message);
      return NextResponse.json({ error: propsError.message }, { status: 400 });
    }

    const typedProperties: Property[] = ownerProperties || [];

    if (typedProperties.length === 0) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    const propertyIds = typedProperties.map((p) => p.id);
    const propertyMap = new Map<string, string>(
      typedProperties.map((p) => [p.id, p.name])
    );

    // Fetch Tenant Records for owned properties
    const { data: tenantRecords, error: tenantsError } = await admin
      .from('tenants')
      .select('id, profile_id, property_id, unit_id, created_at')
      .in('property_id', propertyIds);

    if (tenantsError) {
      console.error('[GET_TENANTS_ERROR]', tenantsError.message);
    }

    const typedTenants: Tenant[] = tenantRecords || [];

    // Collect all unique profile IDs
    const tenantProfileIds = typedTenants
      .map((t) => t.profile_id)
      .filter((id): id is string => Boolean(id));

    const staffUserIds = typedProperties
      .flatMap((p) => [p.property_manager_id, p.caretaker_id, p.agent_id])
      .filter((id): id is string => Boolean(id));

    const allProfileIds = Array.from(new Set([...tenantProfileIds, ...staffUserIds]));

    if (allProfileIds.length === 0) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    // Fetch Profiles directly for all resolved IDs including status & must_change_password
    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id, full_name, email, phone, role, status, must_change_password, created_at')
      .in('id', allProfileIds);

    if (profilesError) {
      console.error('[GET_PROFILES_ERROR]', profilesError.message);
      return NextResponse.json({ error: profilesError.message }, { status: 400 });
    }

    const typedProfiles: Profile[] = profiles || [];
    const profileMap = new Map<string, Profile>(
      typedProfiles.map((p) => [p.id, p])
    );

    // Fetch Units directly for tenant unit mappings
    const unitIds = typedTenants
      .map((t) => t.unit_id)
      .filter((id): id is string => Boolean(id));

    let unitMap = new Map<string, string>();
    if (unitIds.length > 0) {
      const { data: units, error: unitsError } = await admin
        .from('units')
        .select('id, unit_number')
        .in('id', unitIds);

      if (unitsError) {
        console.error('[GET_UNITS_ERROR]', unitsError.message);
      } else if (units) {
        const typedUnits: Unit[] = units;
        unitMap = new Map<string, string>(
          typedUnits.map((u) => [u.id, u.unit_number])
        );
      }
    }

    // Assemble Directory List safely
    const usersList: DirectoryUser[] = [];

    // Assemble Tenants
    typedTenants.forEach((tenant) => {
      const prof = profileMap.get(tenant.profile_id);
      if (prof) {
        const isPending = prof.must_change_password === true;
        usersList.push({
          id: prof.id,
          full_name: prof.full_name || 'N/A',
          email: prof.email || 'N/A',
          phone: prof.phone || prof.phone_number || 'N/A',
          role: prof.role || 'tenant',
          property_name: tenant.property_id
            ? propertyMap.get(tenant.property_id) || 'N/A'
            : 'N/A',
          unit_number: tenant.unit_id ? unitMap.get(tenant.unit_id) || 'N/A' : 'N/A',
          status: isPending ? 'pending' : (prof.status || 'active'),
          created_at: prof.created_at || tenant.created_at || new Date().toISOString(),
          invited_at: prof.created_at || tenant.created_at || new Date().toISOString(),
        });
      }
    });

    // Assemble Staff (Managers, Caretakers & Agents)
    staffUserIds.forEach((staffId) => {
      const prof = profileMap.get(staffId);
      if (prof && !usersList.some((u) => u.id === staffId)) {
        const assignedProp = typedProperties.find(
          (p) =>
            p.property_manager_id === staffId ||
            p.caretaker_id === staffId ||
            p.agent_id === staffId
        );
        const isPending = prof.must_change_password === true;
        usersList.push({
          id: prof.id,
          full_name: prof.full_name || 'N/A',
          email: prof.email || 'N/A',
          phone: prof.phone || prof.phone_number || 'N/A',
          role: prof.role || 'property_manager',
          property_name: assignedProp ? assignedProp.name : 'N/A',
          unit_number: 'N/A (Building Level)',
          status: isPending ? 'pending' : (prof.status || 'active'),
          created_at: prof.created_at || new Date().toISOString(),
          invited_at: prof.created_at || new Date().toISOString(),
        });
      }
    });

    return NextResponse.json({ users: usersList }, { status: 200 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[GET_USERS_DIRECTORY_CRASH]', err.stack || err.message);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// ==========================================
// 2. POST HANDLER: Create & Activate User
// ==========================================
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Session initialization failed.' },
        { status: 500 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY configuration.' },
        { status: 500 }
      );
    }

    const body = await request.json();

    const fullName = body.fullName || body.full_name;
    const email = body.email;
    const phone = body.phone || body.phone_number || null;
    const rawRole = body.role;
    const propertyId = body.propertyId || body.property_id;
    const rawUnitInput = body.unitId || body.unit_id || body.unit_number;

    if (!email || !fullName || !rawRole || !propertyId) {
      return NextResponse.json(
        { error: 'Full name, email, role, and property assignment are required.' },
        { status: 400 }
      );
    }

    const roleLower = rawRole.toString().trim().toLowerCase();
    let dbRole = 'tenant';

    if (roleLower === 'tenant') {
      dbRole = 'tenant';
    } else if (roleLower === 'caretaker') {
      dbRole = 'caretaker';
    } else if (roleLower === 'agent') {
      dbRole = 'agent';
    } else if (
      roleLower === 'property manager' ||
      roleLower === 'property_manager'
    ) {
      dbRole = 'property_manager';
    } else {
      dbRole = roleLower.replace(/\s+/g, '_');
    }

    let resolvedUnitId: string | null = null;
    if (rawUnitInput && rawUnitInput !== 'N/A' && !rawUnitInput.includes('N/A')) {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          rawUnitInput
        );

      if (isUuid) {
        resolvedUnitId = rawUnitInput;
      } else {
        const cleanUnitNum = rawUnitInput.replace(/^Unit\s*/i, '').trim();

        const { data: matchedUnit, error: unitSearchError } = await admin
          .from('units')
          .select('id')
          .eq('property_id', propertyId)
          .ilike('unit_number', cleanUnitNum)
          .maybeSingle();

        if (unitSearchError) {
          console.warn('[UNIT_LOOKUP_WARN]', unitSearchError.message);
        }
        if (matchedUnit) {
          resolvedUnitId = matchedUnit.id;
        }
      }
    }

    const tempPassword = generateTempPassword();

    const { data: userData, error: createError } = await admin.auth.admin.createUser(
      {
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: dbRole,
          must_change_password: true,
        },
      }
    );

    if (createError || !userData.user) {
      console.error('[CREATE_USER_ERROR]', createError?.message);
      return NextResponse.json(
        { error: createError?.message || 'Failed to create user.' },
        { status: 400 }
      );
    }

    const newUserId = userData.user.id;

    const { error: profileError } = await admin.from('profiles').upsert({
      id: newUserId,
      full_name: fullName,
      email: email,
      phone: phone,
      role: dbRole,
      status: 'active',
      must_change_password: true,
      created_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error('[CREATE_PROFILE_ERROR]', profileError.message);
      return NextResponse.json(
        { error: `Profile error: ${profileError.message}` },
        { status: 400 }
      );
    }

    if (dbRole === 'tenant') {
      const { error: tenantError } = await admin.from('tenants').insert({
        profile_id: newUserId,
        property_id: propertyId,
        unit_id: resolvedUnitId,
      });

      if (tenantError) {
        console.error('[CREATE_TENANT_ERROR]', tenantError.message);
        return NextResponse.json(
          { error: `Tenant record error: ${tenantError.message}` },
          { status: 400 }
        );
      }
      if (resolvedUnitId) {
        await admin.from('units').update({ is_occupied: true }).eq('id', resolvedUnitId);
      }
    } else if (dbRole === 'property_manager') {
      const { error: propError } = await admin
        .from('properties')
        .update({ property_manager_id: newUserId })
        .eq('id', propertyId);

      if (propError) {
        console.error('[UPDATE_PROPERTY_MANAGER_ERROR]', propError.message);
      }
    } else if (dbRole === 'caretaker') {
      const { error: caretakerError } = await admin
        .from('properties')
        .update({ caretaker_id: newUserId })
        .eq('id', propertyId);

      if (caretakerError) {
        console.error('[UPDATE_CARETAKER_ERROR]', caretakerError.message);
      }
    } else if (dbRole === 'agent') {
      const { error: agentError } = await admin
        .from('properties')
        .update({ agent_id: newUserId })
        .eq('id', propertyId);

      if (agentError) {
        console.error('[UPDATE_AGENT_ERROR]', agentError.message);
      }
    }

    const origin = new URL(request.url).origin;
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${origin}/auth/callback?next=/auth/change-password` },
    });

    if (linkError || !linkData.properties?.action_link) {
      console.error('[CREATE_INVITATION_LINK_ERROR]', linkError?.message);
      return NextResponse.json(
        { error: linkError?.message || 'Failed to create invitation link.' },
        { status: 500 }
      );
    }

    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Your PropManager account invitation',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:600px;margin:auto">
          <h2>Welcome to PropManager, ${fullName}</h2>
          <p>An account has been created for you. Use the temporary password below only to complete your first sign-in.</p>
          <p><strong>Temporary password:</strong> ${tempPassword}</p>
          <p><a href="${linkData.properties.action_link}" style="display:inline-block;background:#2563eb;color:white;padding:12px 18px;text-decoration:none;border-radius:6px">Set your permanent password</a></p>
          <p>The link will open a secure page where you must choose a new password before accessing your account.</p>
          <p><strong>Assigned role:</strong> ${dbRole.replace(/_/g, ' ')}</p>
          <p>If you did not expect this invitation, contact your property owner.</p>
        </div>
      `,
    });

    if (emailError) {
      console.error('[SEND_INVITATION_EMAIL_ERROR]', emailError);
      return NextResponse.json(
        { error: 'The account was created, but the invitation email could not be sent.' },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        message: 'User account created and invitation email sent successfully.',
        user: { id: userData.user.id, email: userData.user.email, role: dbRole },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[POST_USERS_DIRECTORY_ERROR]', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to add user.' },
      { status: 500 }
    );
  }
}