
import { useQuery } from "@tanstack/react-query";
import { callEdge } from "@/lib/api";
import { Question } from "@/types";

interface ExamQuestionsResponse {
  questions: Question[];
}

/**
 * Hook for fetching exam questions
 */
export function useExamQuestions(attemptId: string | undefined) {
  return useQuery({
    queryKey: ['examQuestions', attemptId],
    queryFn: async () => {
      if (!attemptId) {
        throw new Error("Attempt ID is required");
      }
      return callEdge<ExamQuestionsResponse>("exam-generate", {
        method: "POST",
        body: { attemptId }
      });
    },
    enabled: !!attemptId,
  });
}
