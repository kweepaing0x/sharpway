import { createClient } from 'npm:@supabase/supabase-js@2.38.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Verify the user is a superadmin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Check if user is superadmin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'superadmin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only superadmins can manage categories' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Handle different HTTP methods
    switch (req.method) {
      case "GET": {
        const { data, error } = await supabase
          .from('store_categories')
          .select('*')
          .order('name');

        if (error) throw error;

        return new Response(
          JSON.stringify(data),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      case "POST": {
        const body = await req.json();
        
        // Validate input
        if (!body.name) {
          return new Response(
            JSON.stringify({ error: 'Category name is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }

        const { data, error } = await supabase
          .from('store_categories')
          .insert([{
            name: body.name,
            description: body.description || null,
            is_active: body.is_active !== undefined ? body.is_active : true
          }])
          .select();

        if (error) throw error;

        return new Response(
          JSON.stringify(data),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      case "PUT": {
        const body = await req.json();
        
        // Validate input
        if (!body.id) {
          return new Response(
            JSON.stringify({ error: 'Category ID is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }

        const updates: any = {};
        if (body.name !== undefined) updates.name = body.name;
        if (body.description !== undefined) updates.description = body.description;
        if (body.is_active !== undefined) updates.is_active = body.is_active;
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
          .from('store_categories')
          .update(updates)
          .eq('id', body.id)
          .select();

        if (error) throw error;

        return new Response(
          JSON.stringify(data),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      case "DELETE": {
        const body = await req.json();
        
        // Validate input
        if (!body.id) {
          return new Response(
            JSON.stringify({ error: 'Category ID is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }

        // Check if category is in use
        const { data: usageData, error: usageError } = await supabase
          .from('store_category_assignments')
          .select('id')
          .eq('category_id', body.id)
          .limit(1);

        if (usageError) throw usageError;

        if (usageData && usageData.length > 0) {
          return new Response(
            JSON.stringify({ error: 'Cannot delete category that is in use' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
          );
        }

        const { error } = await supabase
          .from('store_categories')
          .delete()
          .eq('id', body.id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
    }
  } catch (error) {
    console.error("Error in store-category-manager:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});