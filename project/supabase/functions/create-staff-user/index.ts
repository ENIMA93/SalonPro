import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateStaffUserBody {
  staff_id: string;
  email: string;
  password: string;
}

function getBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim() || null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const token = getBearerToken(authHeader);
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          error: 'Edge Function misconfigured: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for privileged operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Standard Supabase Edge Function JWT verification
    console.log('Verifying JWT token using standard pattern...');
    
    // Create client with anon key for user operations
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey || supabaseServiceKey,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('JWT verification failed:', {
        error: userError?.message,
        hasAuthHeader: !!req.headers.get('Authorization'),
        tokenLength: token?.length
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Authentication required. Please sign out and sign in again.',
          details: userError?.message
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('JWT verified successfully for user:', user.id);
    const callerId = user.id;
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', callerId)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: admin only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = (await req.json()) as CreateStaffUserBody;
    const { staff_id, email, password } = body;
    if (!staff_id || !email?.trim() || !password) {
      return new Response(
        JSON.stringify({ error: 'staff_id, email, and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: updateStaffError } = await adminClient
      .from('staff')
      .update({ user_id: newUser.user.id })
      .eq('id', staff_id);

    if (updateStaffError) {
      return new Response(
        JSON.stringify({ error: 'Failed to link staff: ' + updateStaffError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let profileError: { message: string } | null = null;
    const profilePayload: { id: string; role: string; staff_id: string; must_change_password?: boolean } = {
      id: newUser.user.id,
      role: 'staff',
      staff_id,
      must_change_password: true,
    };
    const insertResult = await adminClient.from('profiles').insert(profilePayload);
    profileError = insertResult.error;

    // If column must_change_password doesn't exist (migration not run), retry without it so profile is still created
    if (profileError?.message?.includes('must_change_password')) {
      const { error: retryError } = await adminClient.from('profiles').insert({
        id: newUser.user.id,
        role: 'staff',
        staff_id,
      });
      profileError = retryError;
    }

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create profile: ' + profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ user_id: newUser.user.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
