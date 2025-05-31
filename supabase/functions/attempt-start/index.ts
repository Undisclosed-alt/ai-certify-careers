// supabase/functions/attempt-start/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabase } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

serve(async (req: Request) => {
  // ── CORS pre-flight ----------------------------------------------------
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { attemptId, userId } = await req.json();
    if (!attemptId || !userId) {
      throw new Error("Missing attemptId or userId");
    }

    /* 1. mark the attempt “in_progress” & return exam_id ----------------- */
    const { data: attempt, error: attemptErr } = await supabase
      .from("attempts")
      .update({
        started_at: new Date().toISOString(),
        status: "in_progress",
      })
      .eq("id", attemptId)
      .eq("user_id", userId)          // RLS safety
      .select("id, exam_id")
      .single();

    if (attemptErr || !attempt) {
      throw attemptErr ?? new Error("Attempt not found or not yours");
    }

    /* 2. pull the full exam + questions ---------------------------------- */
    const { data: exam, error: examErr } = await supabase
      .from("exams")
      .select(
        `id, title, time_limit_minutes, passing_score,
         questions:questions(id, text, type, category, options)`
      )
      .eq("id", attempt.exam_id)
      .single();

    if (examErr || !exam) {
      throw examErr ?? new Error("Exam not found");
    }

    /* 3. respond --------------------------------------------------------- */
    return new Response(
      JSON.stringify({ attempt, exam, questions: exam.questions }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("attempt-start error:", e);
    return new Response(
      JSON.stringify({ error: e.message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
