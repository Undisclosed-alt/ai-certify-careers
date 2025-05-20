
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabase } from "../_shared/config.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the job role ID from the request body
    const { jobRoleId } = await req.json();
    if (!jobRoleId) {
      return new Response(
        JSON.stringify({ error: 'Job role ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user from the authorization header
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: authError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify if the job role has price_cents = 0
    const { data: jobRole, error: jobRoleError } = await supabase
      .from('job_roles')
      .select('price_cents')
      .eq('id', jobRoleId)
      .single();
      
    if (jobRoleError || !jobRole) {
      return new Response(
        JSON.stringify({ error: 'Job role not found', details: jobRoleError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If the job role is not free, return an error
    if (jobRole.price_cents !== 0) {
      return new Response(
        JSON.stringify({ error: 'This job role requires payment', free: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First, get or create an exam for this job role
    const { data: existingExams, error: examsError } = await supabase
      .from('exams')
      .select('id')
      .eq('job_role_id', jobRoleId)
      .order('version', { ascending: false })
      .limit(1);

    if (examsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to check for existing exams', details: examsError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let examId: string;
    
    if (existingExams && existingExams.length > 0) {
      examId = existingExams[0].id;
    } else {
      // If no exam exists, create a new one
      const { data: newExam, error: createExamError } = await supabase
        .from('exams')
        .insert({
          job_role_id: jobRoleId,
          version: 1,
          time_limit_minutes: 60,
          passing_score: 70
        })
        .select()
        .single();

      if (createExamError || !newExam) {
        return new Response(
          JSON.stringify({ error: 'Failed to create exam', details: createExamError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      examId = newExam.id;
    }

    // Create a new attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .insert({
        user_id: user.id,
        exam_id: examId,
        status: 'pending',
        payment_bypass: true,
      })
      .select()
      .single();

    if (attemptError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create attempt', details: attemptError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ attempt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
