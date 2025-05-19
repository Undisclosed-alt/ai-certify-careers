
import { useMutation } from "@tanstack/react-query";
import { callEdge } from "@/lib/api";

interface BuyExamResponse {
  checkoutUrl: string;
}

/**
 * Hook for initiating exam purchase
 */
export function useBuyExam() {
  return useMutation({
    mutationFn: async (jobRoleId: string) => {
      return callEdge<BuyExamResponse>("stripe-checkout", {
        method: "POST",
        body: { jobRoleId }
      });
    }
  });
}
