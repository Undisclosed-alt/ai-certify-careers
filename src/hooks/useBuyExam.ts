
import { useMutation, useQuery } from "@tanstack/react-query";
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
  }
}

/**
 * Hook for initiating exam purchase or creating a free attempt
 */
export function useBuyExam() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Query to check if a job role is free
  const checkJobRolePrice = async (jobRoleId: string) => {
    const { data, error } = await supabase
      .from('job_roles')
      .select('price_cents')
      .eq('id', jobRoleId)
      .single();
    
    if (error) throw error;
    return data?.price_cents === 0;
  };

  // Mutation for handling free exams
  const createFreeAttempt = useMutation({
    mutationFn: async (jobRoleId: string) => {
      return callEdge<CreateAttemptResponse>("attempt-create", {
        method: "POST",
        body: { jobRoleId }
      });
    },
    onSuccess: (data) => {
      const attemptId = data.attempt.id;
      navigate(`/exam/${attemptId}`);
      toast({
        title: "Success",
        description: "Your free exam is ready!",
      });
    },
    onError: (error) => {
      console.error("Error creating free attempt:", error);
      toast({
        title: "Error",
        description: "Failed to create free exam attempt. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation for paid exams
  const createCheckout = useMutation({
    mutationFn: async (jobRoleId: string) => {
      return callEdge<BuyExamResponse>("stripe-checkout", {
        method: "POST",
        body: { jobRoleId }
      });
    },
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
    onError: (error) => {
      console.error("Error creating checkout:", error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Combined mutation that checks price and routes to appropriate action
  return useMutation({
    mutationFn: async (jobRoleId: string) => {
      const isFree = await checkJobRolePrice(jobRoleId);
      
      if (isFree) {
        return createFreeAttempt.mutateAsync(jobRoleId);
      } else {
        return createCheckout.mutateAsync(jobRoleId);
      }
    }
  });
}
