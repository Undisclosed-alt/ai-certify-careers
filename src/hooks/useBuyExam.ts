
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

  // Combined mutation that checks price and routes to appropriate action
  return useMutation({
    mutationFn: async (jobRoleId: string) => {
      // Fetch the job role to check if it's free
      const { data: jobRole, error: jobRoleError } = await supabase
        .from('job_roles')
        .select('price_cents')
        .eq('id', jobRoleId)
        .single();
      
      if (jobRoleError) {
        throw new Error(`Failed to fetch job role: ${jobRoleError.message}`);
      }
      
      // If the job role is free, create an attempt directly
      if (Number(jobRole.price_cents) === 0) {
        const data = await callEdge<CreateAttemptResponse>("attempt-create", {
          method: "POST",
          body: { jobRoleId }
        });
        
        // Navigate to the exam page
        navigate(`/exam/${data.attempt.id}`);
        
        toast({
          title: "Success",
          description: "Your free exam is ready!",
        });
        
        return data;
      } else {
        // For paid exams, create a checkout session
        const data = await callEdge<BuyExamResponse>("stripe-checkout", {
          method: "POST",
          body: { jobRoleId }
        });
        
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
        return data;
      }
    },
    onError: (error) => {
      console.error("Error processing exam request:", error);
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive"
      });
    }
  });
}
