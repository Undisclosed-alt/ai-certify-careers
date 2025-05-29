import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabase } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

serve(async (req: Request) => {
  // ── CORS pre-flight ────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobRoleId, userId } = await req.json();

    // 1.  Grab the current (latest) exam for this job role
    const { data: exam, error: examError } = await supabase
      .from("exams")
      .select(
        `id, title, time_limit_minutes, questions:questions(id, text, type, options, category)`
      ) // include nested questions
      .eq("job_role_id", jobRoleId)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    if (examError || !exam) {
      return new Response(
        JSON.stringify({ error: "Exam not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2.  Create an attempt row
    const { data: attempt, error: attemptError } = await supabase
      .from("attempts")
      .insert({
        user_id: userId,
        exam_id: exam.id,
        status: "pending",
      })
      .select("*")
      .single();

    if (attemptError || !attempt) {
      throw attemptError ?? new Error("Failed to create attempt");
    }

    // 3.  Return both attempt + full exam payload
    return new Response(
      JSON.stringify({ attempt, exam }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("attempt-create error:", e);
    return new Response(
      JSON.stringify({ error: e.message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
