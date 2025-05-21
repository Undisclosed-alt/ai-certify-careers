
import { supabase } from "@/integrations/supabase/client";

/**
 * Call Supabase Edge Function with authentication
 * @param fnName Function name
 * @param options Request options
 * @returns Response data
 */
export async function callEdge<T>(
  fnName: string, 
  options: { 
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE', 
    body?: any 
  } = {}
): Promise<T> {
  const { method = 'POST', body } = options;

  // Get the session for authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error("Authentication required");
  }

  // Call the edge function with authorization header
  const { data, error } = await supabase.functions.invoke(fnName, {
    method,
    body,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    console.error(`Error calling ${fnName}:`, error);
    throw new Error(error.message || `Failed to call ${fnName}`);
  }

  if (!data) {
    throw new Error(`No data returned from ${fnName}`);
  }

  return data as T;
}
