/* -------------------------------------------------------------------------- */
/*  supabase/functions/attempt-start/index.ts                                 */
/*                                                                            */
/*  – Validates payload (`attemptId`, `userId`)                                */
/*  – Marks the attempt as “started” + timestamps it                          */
/*  – Fetches the exam + questions, aliasing DB columns so the JSON contract  */
/*    remains { exam.title, exam.description?, question.text, … }             */
/*  – Returns { attempt, exam, questions }                                    */
/* -------------------------------------------------------------------------- */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabase } from "../_shared/config.ts";

/* ---------- CORS ---------------------------------------------------------- */
const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

/* ---------- Edge Function ------------------------------------------------- */
serve(async (req: Request) => {
  /* ----- pre-flight ------------------------------------------------------ */
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { attemptId, userId } = await req.json();
    if (!attemptId || !userId) throw new Error("Missing attemptId or userId");

    /* -------------------------------------------------------------------- */
    /* 1. flip attempt ➜ started                                            */
    /* -------------------------------------------------------------------- */
    const { data: attempt, error: attemptErr } = await supabase
      .from("attempts")
      .update({
        started_at: new Date().toISOString(),
        status:     "started",
      })
      .eq("id", attemptId)
      .eq("user_id", userId)           // RLS: only owner may update
      .select("id, exam_id")
      .single();

    if (attemptErr || !attempt) {
      throw attemptErr ?? new Error("Attempt not found or not yours");
    }

    /* -------------------------------------------------------------------- */
    /* 2. fetch exam + questions (aliasing DB columns)                      */
    /* -------------------------------------------------------------------- */
    const { data: exam, error: examErr } = await supabase
      .from("exams")
      .select(
        `id,
         job_role_id,
         title:version,                -- DB column “version” ➜ JSON “title”
         time_limit_minutes,
         passing_score,
         questions:questions(
           id,
           text:body,                  -- DB column “body”   ➜ JSON “text”
           type,
           category,
           options
         )`
      )
      .eq("id", attempt.exam_id)
      .single();

    if (examErr || !exam) {
      throw examErr ?? new Error("Exam not found");
    }

    /* -------------------------------------------------------------------- */
    /* 3. respond OK                                                        */
    /* -------------------------------------------------------------------- */
    return new Response(
      JSON.stringify({ attempt, exam, questions: exam.questions }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (e) {
    console.error("attempt-start error:", e);
    return new Response(
      JSON.stringify({ error: e.message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
