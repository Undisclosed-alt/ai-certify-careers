
import { Stripe } from "https://esm.sh/stripe@12.2.0";
import { supabase } from "./config.ts";

/**
 * 💰 Payment Service
 * Utilities for handling payment-related operations
 */

/**
 * Record a payment in the database
 * @param {Object} params Payment information
 * @returns {Promise} The inserted payment record
 */
export async function recordPayment({
  userId,
  stripePaymentIntentId,
  amount,
  status,
}: {
  userId: string;
  stripePaymentIntentId: string;
  amount: number;
  status: string;
}) {
  const { data, error } = await supabase
    .from("payments")
    .insert({
      user_id: userId,
      stripe_payment_intent_id: stripePaymentIntentId,
      amount: amount,
      status: status,
      created_at: new Date().toISOString(),
    })
    .onConflict("stripe_payment_intent_id")
    .ignore();

  if (error) {
    console.error("Error recording payment:", error);
    throw new Error(`Failed to record payment: ${error.message}`);
  }

  return data;
}

/**
 * Insert or update subscription information from a Stripe subscription
 * @param {Object} subscription Stripe subscription object
 * @returns {Promise} The upserted subscription record
 */
export async function upsertSubscriptionFromStripe(subscription: any) {
  if (!subscription || !subscription.customer) {
    throw new Error("Invalid subscription data");
  }
  
  // Handle both string and object customer types
  const customerId = typeof subscription.customer === "string" 
    ? subscription.customer 
    : subscription.customer.id;

  // Try to get the user_id from customer metadata
  let userId: string;
  
  if (typeof subscription.customer === "string") {
    // Need to fetch customer to get metadata
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });
    const customer = await stripe.customers.retrieve(subscription.customer);
    if (typeof customer === "string" || customer.deleted) {
      throw new Error("Customer not found or deleted");
    }
    userId = customer.metadata.user_id;
  } else {
    // Customer object is already available
    userId = subscription.customer.metadata.user_id;
  }

  if (!userId) {
    throw new Error("User ID not found in customer metadata");
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      plan_id: subscription.items.data[0].price.id
    }, {
      onConflict: "stripe_subscription_id"
    });

  if (error) {
    console.error("Error upserting subscription:", error);
    throw new Error(`Failed to upsert subscription: ${error.message}`);
  }

  return data;
}
