
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabase } from "../_shared/config.ts";
import { logError, logInfo } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get JWT from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // Get session data using Supabase Auth
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      logError("Authentication failed", userError || new Error("User not found"), { 
        path: "get-exam-results" 
      });
      return new Response(
        JSON.stringify({ error: "Authentication failed" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request parameters
    const requestData = await req.json().catch(() => ({}));
    const examId = requestData.exam_id;
    const userId = user.id;

    logInfo("Processing exam results request", {
      userId,
      examId: examId || "all",
    });

    // Define the query based on whether an exam_id is provided
    let query = supabase
      .from('attempts')
      .select(`
        id, 
        created_at, 
        completed_at, 
        rank, 
        status,
        score_json,
        exam_id,
        exams!inner(
          id,
          job_role_id,
          passing_score,
          time_limit_minutes
        ),
        job_roles:exams!inner(job_roles(
          id,
          title,
          description,
          level
        ))
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    // Filter by exam_id if provided
    if (examId) {
      query = query.eq('id', examId);
    }

    // Execute the query
    const { data: results, error } = await query;

    if (error) {
      logError("Database query error", error, { 
        path: "get-exam-results",
        userId,
        examId: examId || "all" 
      });
      return new Response(
        JSON.stringify({ error: "Failed to fetch exam results" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the results for the response
    const formattedResults = results.map((result) => {
      const scoreJson = result.score_json || {};
      const exam = result.exams;
      const jobRole = result.job_roles;
      
      return {
        id: result.id,
        examId: result.exam_id,
        completedAt: result.completed_at,
        createdAt: result.created_at,
        ranking: result.rank,
        passed: scoreJson.overall_score >= (exam?.passing_score || 70),
        score: scoreJson.overall_score || 0,
        feedback: scoreJson.feedback || "No feedback available",
        jobRoleId: exam?.job_role_id,
        jobRole: jobRole ? {
          id: jobRole.id,
          title: jobRole.title,
          description: jobRole.description,
          level: jobRole.level
        } : null
      };
    });

    // Respond based on whether we're getting one or many results
    const responseBody = examId 
      ? { result: formattedResults[0] || null } 
      : { results: formattedResults };

    logInfo("Successfully retrieved exam results", {
      userId,
      examId: examId || "all",
      count: formattedResults.length
    });

    return new Response(
      JSON.stringify(responseBody),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    logError("Unexpected error", error as Error, { path: "get-exam-results" });
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
