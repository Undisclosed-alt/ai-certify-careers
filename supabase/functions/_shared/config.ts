
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Public project URL – safe to hard-code
export const SUPABASE_URL =
  "https://uxfcxlnzkdqgloevknd.supabase.co";

// Service-role key comes from Secrets
const SERVICE_ROLE_KEY = Deno.env.get(
  "SUPABASE_SERVICE_ROLE_KEY",
)!;

export const supabase = createClient(
  SUPABASE_URL,
  SERVICE_ROLE_KEY,
);
