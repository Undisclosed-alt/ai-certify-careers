
import { supabase } from "./config.ts";
import { LogMetadata, StripeEventMetadata } from "./types.ts";

/**
 * 📊 Logger Service
 * Utilities for logging operations and errors
 */

/**
 * Log an info message with optional metadata
 * @param {string} message The message to log
 * @param {Object} metadata Additional metadata
 */
export function logInfo(message: string, metadata: LogMetadata = {}): void {
  console.log(`ℹ️ INFO: ${message}`, metadata);
}

/**
 * Log an error message with optional error object and metadata
 * @param {string} message The error message
 * @param {unknown} error The error object
 * @param {Object} metadata Additional metadata
 * @returns {Object} Formatted error details
 */
export function logError(message: string, error?: unknown, metadata: LogMetadata = {}): Record<string, any> {
  const errorMessage = error instanceof Error ? error.message : String(error || "Unknown error");
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`❌ ERROR: ${message}: ${errorMessage}`);
  if (errorStack) {
    console.error("Stack trace:", errorStack);
  }
  
  if (Object.keys(metadata).length > 0) {
    console.error("Context:", metadata);
  }
  
  return {
    message: message,
    error: errorMessage,
    stack: errorStack,
    metadata,
    timestamp: new Date().toISOString()
  };
}

/**
 * Log a Stripe event for monitoring
 * @param {Object} event The Stripe event
 * @returns {Object} Event metadata
 */
export function logStripeEvent(event: any): StripeEventMetadata {
  const metadata: StripeEventMetadata = {
    eventId: event.id,
    eventType: event.type,
    objectId: event.data.object.id,
    objectType: event.data.object.object,
  };
  
  console.log(`💳 STRIPE EVENT: ${event.type}`, metadata);
  return metadata;
}

/**
 * Log an AI prompt and its response
 * @param {Object} params The prompt log data
 * @returns {Promise} The inserted log record
 */
export async function logPrompt({
  type,
  prompt,
  response,
  metadata = {},
}: {
  type: string;
  prompt: string;
  response: any;
  metadata?: Record<string, any>;
}) {
  const { data, error } = await supabase
    .from("prompt_logs")
    .insert({
      type,
      prompt,
      response,
      metadata,
      created_at: new Date().toISOString(),
    });

  if (error) {
    logError("Failed to log prompt", error, { type });
    throw new Error(`Failed to log prompt: ${error.message}`);
  }

  return data;
}
