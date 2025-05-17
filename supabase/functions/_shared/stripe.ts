
import { Stripe } from "https://esm.sh/stripe@12.2.0";
import { logError, logInfo, logStripeEvent } from "./logger.ts";

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
    const error = new Error("No Stripe signature found in request headers");
    logError("Webhook signature verification failed", error);
    throw error;
  }
  
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    const error = new Error("STRIPE_WEBHOOK_SECRET is not configured");
    logError("Webhook configuration error", error);
    throw error;
  }
  
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
  });
  
  try {
    // We need to get the raw body as text for signature verification
    const bodyText = req.clone().text();
    // Verify the webhook signature
    const event = stripe.webhooks.constructEventAsync(
      bodyText,
      signature,
      webhookSecret
    );
    
    // Log the event
    logInfo("Verified Stripe webhook signature", { eventType: event.type });
    
    return event;
  } catch (err) {
    logError("Stripe webhook signature verification failed", err);
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
}

/**
 * Get a configured Stripe client instance
 * @returns {Stripe} The Stripe client
 */
export function getStripeClient(): Stripe {
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!secretKey) {
    const error = new Error("STRIPE_SECRET_KEY is not configured");
    logError("Stripe client configuration error", error);
    throw error;
  }
  
  logInfo("Created Stripe client");
  
  return new Stripe(secretKey, {
    apiVersion: "2023-10-16",
  });
}
