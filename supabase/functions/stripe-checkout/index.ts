import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Stripe } from "https://esm.sh/stripe@12.2.0";
import { supabase } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS pre-flight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobRoleId, userId, successUrl, cancelUrl } = await req.json();

    // Fetch job role
    const { data: jobRole, error: jobRoleError } = await supabase
      .from("job_roles")
      .select("*")
      .eq("id", jobRoleId)
      .single();

    if (jobRoleError || !jobRole) {
      return new Response(
        JSON.stringify({ error: "Job role not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Stripe client
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${jobRole.title} Certification Exam`,
              description: jobRole.description,
            },
            unit_amount: jobRole.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&job_role_id=${jobRoleId}`,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: { userId, jobRoleId },
    });

    /* -----------------  ⬇︎  changed key here  ⬇︎ ----------------- */
    return new Response(
      JSON.stringify({
        sessionId: session.id,
        checkoutUrl: session.url,     // renamed from `url` → `checkoutUrl`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
