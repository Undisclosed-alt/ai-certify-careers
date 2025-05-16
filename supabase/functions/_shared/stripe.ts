
import { Stripe } from "https://esm.sh/stripe@12.2.0";

/**
 * 💳 Stripe Service
 * Utilities for handling Stripe-related operations
 */

/**
 * Verify a Stripe webhook signature and parse the event
 * @param {Request} req The HTTP request with Stripe signature
 * @returns {Object} The parsed Stripe event
 */
export function verifyStripeSignature(req: Request): Stripe.Event {
  const signature = req.headers.get("stripe-signature");
  
  if (!signature) {
    throw new Error("No Stripe signature found in request headers");
  }
  
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
  });
  
  try {
    // We need to get the raw body as text for signature verification
    const bodyText = req.clone().text();
    // Verify the webhook signature
    return stripe.webhooks.constructEventAsync(
      await bodyText,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("⚠️ Stripe webhook signature verification failed:", err);
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
}

// Export the Stripe client for direct use when needed
export function getStripeClient() {
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  
  return new Stripe(secretKey, {
    apiVersion: "2023-10-16",
  });
}
