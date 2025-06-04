
/* -------------------------------------------------------------------------- */
/*  src/hooks/useStartAttempt.ts                                              */
/*                                                                            */
/*  Starts an existing attempt by invoking the `attempt-start` edge function  */
/*  and maps its raw response into the shape expected by the UI.              */
/* -------------------------------------------------------------------------- */

import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { callEdge } from "@/lib/api";

/* ---------- domain types -------------------------------------------------- */
export interface Question {
  id: string;
  text: string;
  type: string;
  category?: string;
  options?: unknown;
}

export interface Exam {
  id: string;
  certificationId: string; // TODO: Rename from jobRoleId in future migration
  title: string;
  description: string;
  timeLimit: number;
  passingScore: number;
  questions: Question[];
}

interface AttemptStartResponse {
  attempt:   { id: string; exam_id: string };
  exam:      any;          // raw row from DB (will map below)
  questions: any[];        // raw question rows
}

export function useStartAttempt() {
  const navigate  = useNavigate();
  const { toast } = useToast();

  return useMutation({
    /* --------------------------- core mutation --------------------------- */
    mutationFn: async (attemptId: string): Promise<AttemptStartResponse> => {
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error("User not authenticated");

      return await callEdge<AttemptStartResponse>("attempt-start", {
        method: "POST",
        body: { attemptId, userId: user.id },
      });
    },

    /* --------------------------- happy path ----------------------------- */
    onSuccess: ({ attempt, exam, questions }) => {
      /* map DB rows ➜ front-end shape ----------------------------------- */
      const parsedExam: Exam = {
        id:            exam.id,
        certificationId: exam.job_role_id, // TODO: Rename from job_role_id in future migration
        title:         exam.title,
        description:   exam.description ?? "",          // safe fallback
        timeLimit:     exam.time_limit_minutes,
        passingScore:  exam.passing_score,
        questions: (questions ?? []).map((q: any) => ({
          id:         q.id,
          text:       q.text,                            // alias provided by edge fn
          type:       q.type,
          category:   q.category,
          options:    q.options,
        })),
      };

      navigate(`/exam/${attempt.id}`, {
        state: { exam: parsedExam, attemptId: attempt.id },
      });
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
