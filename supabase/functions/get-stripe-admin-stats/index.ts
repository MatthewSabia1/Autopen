// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Follow this pattern to import other modules from the Deno standard library:
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts'
import Stripe from "https://esm.sh/stripe@14.24.0?target=deno&deno-std=0.132.0"; // Use appropriate version
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2' // Use appropriate version

console.log("get-stripe-admin-stats function starting...");

// Initialize Stripe client
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16", // Use the API version you are developing against
  httpClient: Stripe.createFetchHttpClient(),
});

// Initialize Supabase client (needed for admin check)
const supabaseAdmin = createClient(
  Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Check Authorization header and get user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Check if user is admin
    // Adjust this query based on your actual table structure for profiles/roles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles') // Assuming your table is named 'profiles'
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    if (!profile?.is_admin) {
      console.warn(`Non-admin user attempt: ${user.id}`);
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Admin user ${user.id} requesting Stripe stats...`);

    // 3. Fetch data from Stripe (add error handling for each call)
    const now = Math.floor(Date.now() / 1000);
    const twentyFourHoursAgo = now - (24 * 60 * 60);

    // --- Fetch Total Revenue (Example: Summing recent charges - adjust as needed) ---
    // Note: For large accounts, iterating through all charges is inefficient.
    // Consider using Stripe Reports or calculating/storing this incrementally.
    let totalRevenue = 0;
    // Placeholder - In a real app, you might query balance transactions or sum charges carefully
    // const charges = await stripe.charges.list({ limit: 100, succeeded: true });
    // totalRevenue = charges.data.reduce((sum, charge) => sum + charge.amount, 0) / 100; // Amount is in cents
    console.warn('Total Revenue calculation is a placeholder.');
    totalRevenue = 9745; // Using placeholder for now

    // --- Fetch Active Subscriptions and Calculate MRR ---
    let activeSubsCount = 0;
    let mrr = 0;
    const subscriptions = await stripe.subscriptions.list({ status: 'active', limit: 100, expand: ['data.items.data.price'] });
    // TODO: Handle pagination if more than 100 active subs
    subscriptions.data.forEach(sub => {
      activeSubsCount++;
      sub.items.data.forEach(item => {
        if (item.price?.recurring?.interval === 'month') {
          mrr += (item.price.unit_amount || 0) * (item.quantity || 1);
        } else if (item.price?.recurring?.interval === 'year') {
          // Convert yearly to monthly
          mrr += ((item.price.unit_amount || 0) * (item.quantity || 1)) / 12;
        }
        // Add handling for other intervals if needed
      });
    });
    mrr = mrr / 100; // Convert cents to dollars

    // --- Fetch New Customers (24h) ---
    const newCustomers = await stripe.customers.list({
      created: {
        gte: twentyFourHoursAgo,
      },
      limit: 100, // Adjust limit if needed, handle pagination
    });
    const newUsersCount = newCustomers.data.length; // Note: Might count customers without subs yet

    // 4. Construct response
    const stats = {
      totalRevenue: totalRevenue.toFixed(2),
      mrr: mrr.toFixed(2),
      activeSubsCount,
      newUsersCount,
    };

    console.log("Successfully fetched Stripe stats:", stats);

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

/* 
To deploy:
1. Set environment variables in Supabase Dashboard: 
   - STRIPE_SECRET_KEY
   - NEXT_PUBLIC_SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
2. Run: supabase functions deploy get-stripe-admin-stats --no-verify-jwt
*/

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get-stripe-admin-stats' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
