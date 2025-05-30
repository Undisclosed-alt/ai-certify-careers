/* -------------------------------------------------------------------------- */
/*  src/hooks/useBuyExam.ts                                                   */
/* -------------------------------------------------------------------------- */

import { useMutation } from "@tanstack/react-query";
import { callEdge } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

/* ----------- types returned by the edge functions ------------------------ */
interface AttemptCreateResponse {
  attempt: { id: string; exam_id: string };
  exam: unknown; // replace with your Exam interface if available
}

interface StripeCheckout {
  checkoutUrl: string;
}
/* ------------------------------------------------------------------------ */

export function useBuyExam() {
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (jobRoleId: string) => {
      /* 1 ── fetch the price for this job-role ----------------------------- */
      const { data: jobRole, error: priceErr } = await supabase
        .from("job_roles")
        .select("price_cents")
        .eq("id", jobRoleId)
        .single();

      if (priceErr || !jobRole) {
        throw new Error("Could not fetch price for this exam.");
      }

      /* 2 ── get the current authenticated user --------------------------- */
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();

      if (authErr || !user) {
        throw new Error("User not authenticated.");
      }

      /* 3 ── FREE exam flow ----------------------------------------------- */
      if (Number(jobRole.price_cents) === 0) {
        const data = await callEdge<AttemptCreateResponse>("attempt-create", {
          method: "POST",
          body: { jobRoleId, userId: user.id },
        });

        navigate(`/exam/${data.attempt.id}`, {
          state: { exam: data.exam, attemptId: data.attempt.id },
        });

        toast({
          title: "Success",
          description: "Your free exam is ready!",
        });

        return;
      }

      /* 4 ── PAID exam flow ----------------------------------------------- */
      const { checkoutUrl } = await callEdge<StripeCheckout>(
        "stripe-checkout",
        {
          method: "POST",
          body: { jobRoleId, userId: user.id },
        },
      );

      window.location.href = checkoutUrl;
    },

    /* 5 ── generic error handler ----------------------------------------- */
    onError: (err) => {
      console.error("Exam purchase error:", err);
      toast({
        title: "Error",
        description: "Could not start the exam. Please try again.",
        variant: "destructive",
      });
    },
  });
}
