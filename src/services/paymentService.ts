
import { supabase } from '@/integrations/supabase/client';
import { JobRole } from '@/types';

// Create a checkout session for purchasing an exam
export const createCheckoutSession = async (
  jobRole: JobRole, 
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; redirectUrl: string }> => {
  try {
    // Call our Stripe edge function
    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: { 
        jobRoleId: jobRole.id, 
        userId, 
        successUrl, 
        cancelUrl 
      }
    });

    if (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }

    return {
      sessionId: data.sessionId,
      redirectUrl: data.url
    };
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    throw error;
  }
};

// Verify payment status
export const verifyPayment = async (sessionId: string): Promise<boolean> => {
  try {
    // Call our Stripe verification edge function
    const { data, error } = await supabase.functions.invoke('stripe-verify', {
      body: { sessionId }
    });

    if (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }

    return data.verified;
  } catch (error) {
    console.error('Failed to verify payment:', error);
    throw error;
  }
};
