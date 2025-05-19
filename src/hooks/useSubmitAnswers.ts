
import { useMutation } from "@tanstack/react-query";
import { callEdge } from "@/lib/api";

interface SubmitAnswersRequest {
  attemptId: string;
  answers: Record<string, string | number>;
}

interface SubmitAnswersResponse {
  resultId: string;
}

/**
 * Hook for submitting exam answers
 */
export function useSubmitAnswers() {
  return useMutation({
    mutationFn: async (data: SubmitAnswersRequest) => {
      return callEdge<SubmitAnswersResponse>("exam-grade", {
        method: "POST",
        body: data
      });
    }
  });
}
