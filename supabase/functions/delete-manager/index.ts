import { createClient } from 'npm:@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { userId, managerId } = await req.json();

    // Validate inputs
    if (!userId || !managerId) {
      return new Response(
        JSON.stringify({ error: 'User ID and Manager ID are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // 1. Get store_id before deleting the manager record (for audit log)
    const { data: managerData, error: fetchError } = await supabase
      .from('store_managers')
      .select('store_id')
      .eq('id', managerId)
      .single();

    if (fetchError) {
      console.error("Error fetching manager data:", fetchError);
      throw new Error(`Failed to fetch manager data: ${fetchError.message}`);
    }

    const storeId = managerData?.store_id;
    if (!storeId) {
      throw new Error('Store ID not found for this manager');
    }

    // 2. Delete the store_manager record
    const { error: managerError } = await supabase
      .from('store_managers')
      .delete()
      .eq('id', managerId);

    if (managerError) {
      console.error("Error deleting store manager:", managerError);
      throw new Error(`Failed to delete store manager: ${managerError.message}`);
    }

    // 3. Add entry to manager_audit_logs
    const { error: auditError } = await supabase
      .from('manager_audit_logs')
      .insert([{
        user_id: userId,
        store_id: storeId,
        action: 'removed',
        details: {
          removed_by: 'admin', // We could pass the admin's ID in the request if needed
          timestamp: new Date().toISOString()
        }
      }]);

    if (auditError) {
      console.error("Error creating audit log:", auditError);
      // Don't throw here, continue with deletion even if audit log fails
    }

    // 4. Delete the user record from public.users table
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (userError) {
      console.error("Error deleting user record:", userError);
      throw new Error(`Failed to delete user record: ${userError.message}`);
    }

    // 5. Delete the user from auth.users
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Error deleting auth user:", authError);
      throw new Error(`Failed to delete auth user: ${authError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Manager and associated user account deleted successfully' 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error deleting manager:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete manager' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});