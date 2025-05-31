/* -------------------------------------------------------------------------- */
/*  src/hooks/useStartAttempt.ts                                              */
/*                                                                            */
/*  Calls the edge function `attempt-start` so that all server-side           */
/*  bookkeeping (RLS-safe update + question set build) happens in one place.  */
/* -------------------------------------------------------------------------- */

import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { callEdge } from "@/lib/api";

/* ---------- shape returned by the edge function -------------------------- */
interface AttemptStartResponse {
  attempt:   { id: string; exam_id: string };
  exam:      unknown;       // replace with <Exam> if you have the type handy
  questions: unknown[];     // …and <Question[]> likewise
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

      /* call the Supabase Edge Function ---------------------------------- */
      const data = await callEdge<AttemptStartResponse>("attempt-start", {
        method: "POST",
        body: { attemptId, userId: user.id },
      });

      return data;
    },

    /* --------------------------- happy path ----------------------------- */
    onSuccess: ({ attempt, exam, questions }) => {
      navigate(`/exam/${attempt.id}`, {
        state: { exam, attemptId: attempt.id, questions },
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
