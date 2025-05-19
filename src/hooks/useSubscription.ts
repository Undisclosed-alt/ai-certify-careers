
import { useQuery } from "@tanstack/react-query";
import { callEdge } from "@/lib/api";
import { SubscriptionType } from "supabase/functions/_shared/types";

export interface SubscriptionResponse {
  subscription: SubscriptionType | null;
}

/**
 * Hook for fetching the current user's subscription
 */
export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const response = await callEdge<SubscriptionResponse>("get-subscription", {
        method: "POST"
      });
      return response.subscription;
    }
  });
}
