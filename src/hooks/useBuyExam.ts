import { useMutation } from "@tanstack/react-query";
import { callEdge } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface BuyExamResponse {
  checkoutUrl: string;
}

interface CreateAttemptResponse {
  attempt: {
    id: string;
    exam_id: string;
  };
}

interface JobRolePrice {
  price_cents: number;   // we will coerce string → number
}

/**
 * Hook for initiating exam purchase or creating a free attempt
 */
export function useBuyExam() {
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (jobRoleId: string) => {
      /* -------------------------------------------------------------
       * 1. Fetch job role price (typed)
       * ----------------------------------------------------------- */
      const { data: jobRole, error: jobRoleError } = await supabase
        .from("job_roles")
        .select<JobRolePrice>("price_cents")
        .eq("id", jobRoleId)
        .single();

      if (jobRoleError) {
        throw new Error(`Failed to fetch job role: ${jobRoleError.message}`);
      }

      const price = Number(jobRole?.price_cents);

      /* -------------------------------------------------------------
       * 2. FREE flow – create attempt, no Stripe
       * ----------------------------------------------------------- */
      if (price === 0) {
        const data = await callEdge<CreateAttemptResponse>("attempt-create", {
          method: "POST",
          body: { jobRoleId },
        });

        navigate(`/exam/${data.attempt.id}`);

        toast({
          title: "Success",
          description: "Your free exam is ready!",
        });

        return data;
      }

      /* -------------------------------------------------------------
       * 3. PAID flow – create Stripe Checkout session
       * ----------------------------------------------------------- */
      const data = await callEdge<BuyExamResponse>("stripe-checkout", {
        method: "POST",
        body: { jobRoleId },
      });

      window.location.href = data.checkoutUrl;
      return data;
    },

    onError: (error) => {
      console.error("Error processing exam request:", error);
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    },
  });
}
