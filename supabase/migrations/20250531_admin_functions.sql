
-- Function to get all subscriptions with user data
-- This uses security definer to bypass RLS
CREATE OR REPLACE FUNCTION public.get_subscriptions_with_users()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  plan_id text,
  status text,
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  job_role_title text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id, 
    s.user_id, 
    p.full_name as email, -- Using full_name as email since we don't have auth.users access here
    s.plan_id, 
    s.status, 
    s.stripe_customer_id, 
    s.stripe_subscription_id, 
    s.current_period_end,
    j.title as job_role_title
  FROM public.subscriptions s
  LEFT JOIN public.profiles p ON s.user_id = p.id
  LEFT JOIN public.job_roles j ON s.plan_id = j.id::text
  ORDER BY s.created_at DESC;
END;
$$;

-- Add policy to allow only admins to execute this function
ALTER FUNCTION public.get_subscriptions_with_users() SECURITY INVOKER;

REVOKE EXECUTE ON FUNCTION public.get_subscriptions_with_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_subscriptions_with_users() TO authenticated;
