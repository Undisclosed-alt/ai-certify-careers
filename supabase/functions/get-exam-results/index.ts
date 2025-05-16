
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { supabase } from "../_shared/config.ts";

// Set up CORS headers for browser clients
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the JWT from the request
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the authenticated user from the JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse the request body
    const requestData = await req.json().catch(() => ({}));
    const examId = requestData.exam_id;
    
    console.log(`Fetching exam results for user ${user.id}, exam_id: ${examId || 'all'}`);
    
    // Query the database for exam results
    let query = supabase
      .from('attempts')
      .select(`
        id,
        exam_id,
        score_json,
        status,
        started_at,
        completed_at,
        rank
      `)
      .eq('user_id', user.id);
    
    // If an exam_id was provided, filter by it
    if (examId) {
      query = query.eq('exam_id', examId);
    }
    
    const { data: attempts, error } = await query;
    
    if (error) {
      console.error('Database query error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch exam results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Transform the results into a more user-friendly format
    const results = attempts.map(attempt => ({
      id: attempt.id,
      exam_id: attempt.exam_id,
      score: (attempt.score_json as any)?.score || 0,
      passed: attempt.status === 'passed',
      started_at: attempt.started_at,
      completed_at: attempt.completed_at,
      ranking: attempt.rank,
      feedback: (attempt.score_json as any)?.feedback || ''
    }));
    
    // Return the results
    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
