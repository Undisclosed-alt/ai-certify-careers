
import { supabase } from "./config.ts";
import { SubscriptionType } from "./types.ts";
import { logError, logInfo } from "./logger.ts";

/**
 * 🔄 Subscription Service
 * Utilities for handling subscription-related operations
 */

/**
 * Upsert a subscription record in the database
 * @param {Object} subscription The subscription data
 * @returns {Promise} The upserted subscription record
 */
export async function upsertSubscription({
  userId,
  stripeSubscriptionId,
  stripeCustomerId,
  status,
  planId,
  currentPeriodEnd,
}: {
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: string;
  planId: string;
  currentPeriodEnd: string;
}): Promise<SubscriptionType> {
  const subscriptionData = {
    user_id: userId,
    stripe_subscription_id: stripeSubscriptionId,
    stripe_customer_id: stripeCustomerId,
    status,
    plan_id: planId,
    current_period_end: currentPeriodEnd,
  };

  logInfo("Upserting subscription", { 
    stripeSubscriptionId, 
    userId, 
    status 
  });

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(subscriptionData, {
      onConflict: "stripe_subscription_id"
    })
    .select()
    .single();

  if (error) {
    logError("Failed to upsert subscription", error, { stripeSubscriptionId });
    throw new Error(`Failed to upsert subscription: ${error.message}`);
  }

  return data as SubscriptionType;
}

/**
 * Delete a subscription from the database
 * @param {string} stripeSubscriptionId The Stripe subscription ID
 * @returns {Promise} The operation result
 */
export async function deleteSubscription(stripeSubscriptionId: string): Promise<void> {
  logInfo("Deleting subscription", { stripeSubscriptionId });

  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("stripe_subscription_id", stripeSubscriptionId);

  if (error) {
    logError("Failed to delete subscription", error, { stripeSubscriptionId });
    throw new Error(`Failed to delete subscription: ${error.message}`);
  }
}

/**
 * Get an active subscription for a user
 * @param {string} userId The user ID
 * @returns {Promise} The user's active subscription or null
 */
export async function getUserSubscription(userId: string): Promise<SubscriptionType | null> {
  logInfo("Getting user subscription", { userId });

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    logError("Failed to get user subscription", error, { userId });
    throw new Error(`Failed to get user subscription: ${error.message}`);
  }

  return data as SubscriptionType | null;
}
