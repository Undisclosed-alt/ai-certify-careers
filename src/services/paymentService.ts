
import { JobRole } from '@/types';

// Mock Stripe checkout session creation 
// In a real app, this would call a Stripe API endpoint
export const createCheckoutSession = async (
  jobRole: JobRole, 
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; redirectUrl: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real app, this would return the Stripe session ID and redirect URL
  // For now, we'll simulate success and skip the actual payment
  return {
    sessionId: `mock-session-${Date.now()}`,
    // In a real app, this would be the Stripe checkout URL
    // For this demo, we'll just return the success URL directly
    redirectUrl: `${successUrl}?role=${jobRole.id}&session_id=mock-session-${Date.now()}`
  };
};

// Mock payment verification
export const verifyPayment = async (sessionId: string): Promise<boolean> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real app, this would check the Stripe session status
  // For this demo, we'll always return true (payment successful)
  return true;
};
