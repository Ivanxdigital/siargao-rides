import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for admin privileges
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') as string,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
);

Deno.serve(async (req) => {
  try {
    // Call the database function to update expired subscriptions
    const { data, error } = await supabase.rpc('check_expired_subscriptions');
    
    if (error) {
      console.error('Error checking subscriptions:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Query to get count of updated shops
    const { count, error: countError } = await supabase
      .from('rental_shops')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'expired')
      .eq('is_active', false);
      
    if (countError) {
      console.error('Error counting expired shops:', countError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Subscription check completed successfully',
        expiredCount: count || 0
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}); 