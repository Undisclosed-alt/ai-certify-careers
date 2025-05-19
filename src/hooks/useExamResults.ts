
import { useQuery } from "@tanstack/react-query";
import { callEdge } from "@/lib/api";
import { ExamResult } from "@/types";

interface ExamResultsResponse {
  results: ExamResult[];
}

interface ExamResultResponse {
  result: ExamResult;
}

/**
 * Hook for fetching all exam results for the current user
 */
export function useExamResults() {
  return useQuery({
    queryKey: ['examResults'],
    queryFn: async () => {
      const response = await callEdge<ExamResultsResponse>("get-exam-results", {
        method: "POST"
      });
      return response.results;
    }
  });
}

/**
 * Hook for fetching a single exam result
 */
export function useExamResult(resultId: string | undefined) {
  return useQuery({
    queryKey: ['examResult', resultId],
    queryFn: async () => {
      if (!resultId) {
        throw new Error("Result ID is required");
      }
      const response = await callEdge<ExamResultResponse>("get-exam-results", {
        method: "POST",
        body: { exam_id: resultId }
      });
      return response.result;
    },
    enabled: !!resultId,
  });
}
