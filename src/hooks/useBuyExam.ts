import { useMutation } from "@tanstack/react-query";
import { callEdge } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BuyExamResponse {
  checkoutUrl: string;
}

interface CreateAttemptResponse {
  attempt: { id: string; exam_id: string };
}

export function useBuyExam() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (jobRoleId: string) => {
      // 1️⃣  Grab price
      const { data: jobRole, error } = await supabase
        .from("job_roles")
        .select("price_cents")
        .eq("id", jobRoleId)
        .single();

      if (error || !jobRole) throw new Error("Job role fetch failed");

      // 2️⃣  FREE flow  ➜  test redirect to Google
      if (Number(jobRole.price_cents) === 0) {
        await callEdge<CreateAttemptResponse>("attempt-create", {
          method: "POST",
          body: { jobRoleId },
        });

        // 👇 *** TEST REDIRECT ***  (remove after debugging)
        window.location.href = "https://google.com";
        return;
      }

      // 3️⃣  PAID flow  ➜  normal Stripe checkout
      const data = await callEdge<BuyExamResponse>("stripe-checkout", {
        method: "POST",
        body: { jobRoleId },
      });
      window.location.href = data.checkoutUrl;
    },

    onError: (err) => {
      console.error("Exam purchase error:", err);
      toast({
        title: "Error",
        description: "Failed to start exam. Please try again.",
        variant: "destructive",
      });
    },
  });
}
