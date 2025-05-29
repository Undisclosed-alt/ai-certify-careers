import { useMutation } from "@tanstack/react-query";
import { callEdge } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface StripeCheckout {
  checkoutUrl: string;
}

interface AttemptCreateResponse {
  attempt: { id: string; exam_id: string };
  exam: any; // you can type this more strictly if desired
}

export function useBuyExam() {
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (jobRoleId: string) => {
      // ── get price ───────────────────────────────────
      const { data: jobRole, error } = await supabase
        .from("job_roles")
        .select("price_cents")
        .eq("id", jobRoleId)
        .single();

      if (error || !jobRole) {
        throw new Error("Failed to fetch job role price");
      }

      // ── FREE exam flow ──────────────────────────────
      if (Number(jobRole.price_cents) === 0) {
        const data = await callEdge<AttemptCreateResponse>("attempt-create", {
          method: "POST",
          body: { jobRoleId },
        });

        // pass exam + attemptId via router state
        navigate(`/exam/${data.attempt.id}`, {
          state: { exam: data.exam, attemptId: data.attempt.id },
        });

        toast({ title: "Success", description: "Your free exam is ready!" });
        return;
      }

      // ── PAID exam flow ──────────────────────────────
      const stripe = await callEdge<StripeCheckout>("stripe-checkout", {
        method: "POST",
        body: { jobRoleId },
      });

      window.location.href = stripe.checkoutUrl;
    },

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
