/* -------------------------------------------------------------------------- */
/*  src/hooks/useStartAttempt.ts                                              */
/*                                                                            */
/*  Kick-starts an *existing* exam attempt that was created earlier via the   */
/*  `attempt-create` edge function (free flow) or during checkout (paid flow) */
/*  and then routes the user straight into the runner.                        */
/*                                                                            */
/*  ── What it does                                                          ──
*   1. Marks the attempt `started_at = now`, `status = 'in_progress'`.        *
*   2. Fetches the full exam — *including questions* — in one round-trip.     *
*   3. Navigates to `/exam/:attemptId` with the exam & attempt ID in `state`.  */
/* -------------------------------------------------------------------------- */

import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Exam } from "@/types";

/* ── shape returned to the caller ----------------------------------------- */
interface StartAttemptResponse {
  attemptId: string;
  exam: Exam;
}

export function useStartAttempt() {
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation({
    /* --------------------------- core mutation --------------------------- */
    mutationFn: async (attemptId: string): Promise<StartAttemptResponse> => {
      if (!attemptId) throw new Error("Attempt ID is required");

      /* 1 ── flag attempt as “in progress” -------------------------------- */
      const { data: attemptRow, error: attemptErr } = await supabase
        .from("attempts")
        .update({
          started_at: new Date().toISOString(),
          status: "in_progress",
        })
        .eq("id", attemptId)
        .select("id, exam_id")
        .single();

      if (attemptErr || !attemptRow) {
        throw attemptErr ?? new Error("Attempt not found");
      }

      /* 2 ── fetch exam + questions in one go ----------------------------- */
      const { data: examRow, error: examErr } = await supabase
        .from("exams")
        .select(
          "id, job_role_id, title, description, time_limit_minutes, passing_score, questions:questions(id, text, type, category, options)"
        )
        .eq("id", attemptRow.exam_id)
        .single();

      if (examErr || !examRow) {
        throw examErr ?? new Error("Exam not found");
      }

      /* 3 ── map DB → front-end shape ------------------------------------ */
      const exam: Exam = {
        id: examRow.id,
        jobRoleId: examRow.job_role_id,
        title: examRow.title,
        description: examRow.description ?? "",
        timeLimit: examRow.time_limit_minutes,
        passingScore: examRow.passing_score,
        questions: examRow.questions ?? [],
      };

      return { attemptId: attemptRow.id, exam };
    },

    /* --------------------------- happy path ----------------------------- */
    onSuccess: ({ attemptId, exam }) => {
      navigate(`/exam/${attemptId}`, { state: { exam, attemptId } });
    },

    /* --------------------------- error path ----------------------------- */
    onError: (err) => {
      console.error("Attempt-start error:", err);
      toast({
        title: "Error",
        description: "Could not start the exam. Please try again.",
        variant: "destructive",
      });
    },
  });
}
