
import { supabase } from "./config.ts";

/**
 * 📊 Logger Service
 * Utilities for logging operations and errors
 */

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
    console.error("Error logging prompt:", error);
    throw new Error(`Failed to log prompt: ${error.message}`);
  }

  return data;
}

/**
 * Format and log an error for debugging
 * @param {unknown} error The error to log
 * @param {string} context Additional context for the error
 */
export function logError(error: unknown, context = "") {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`❌ Error ${context ? `in ${context}` : ""}: ${errorMessage}`);
  if (errorStack) {
    console.error("Stack trace:", errorStack);
  }
  
  return {
    message: errorMessage,
    stack: errorStack,
    context,
    timestamp: new Date().toISOString()
  };
}
