
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Stripe } from "https://esm.sh/stripe@12.2.0";
import { supabase } from "../_shared/config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the stripe signature from the headers
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'No signature provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.text();
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: '2023-10-16',
    });
    
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, jobRoleId } = session.metadata;
      
      // Get the exam for this job role
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .select('id')
        .eq('job_role_id', jobRoleId)
        .single();

      if (examError || !exam) {
        console.error('Error finding exam:', examError);
        return new Response(
          JSON.stringify({ error: 'Exam not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Create an exam attempt
      const { data: attempt, error: attemptError } = await supabase
        .from('attempts')
        .insert({
          user_id: userId,
          exam_id: exam.id,
          started_at: new Date().toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (attemptError) {
        console.error('Error creating attempt:', attemptError);
        return new Response(
          JSON.stringify({ error: 'Failed to create exam attempt' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, attemptId: attempt.id }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return a successful response for other event types
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
