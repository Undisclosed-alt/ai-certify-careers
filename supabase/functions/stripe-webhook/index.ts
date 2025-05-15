
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
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      console.error(`⚠️ Webhook signature verification failed:`, err.message);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Webhook received: ${event.type}`);
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`Processing checkout.session.completed for ${session.id}`);
        
        // If it's an exam purchase
        if (session.metadata?.jobRoleId) {
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
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ success: true, attemptId: attempt.id }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // If it's a subscription checkout (not an exam purchase)
        else if (session.mode === 'subscription') {
          // Store payment information from the checkout session
          if (session.payment_intent) {
            const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
            
            await supabase.from('payments').insert({
              user_id: session.client_reference_id,
              stripe_payment_intent_id: paymentIntent.id,
              amount: paymentIntent.amount,
              status: paymentIntent.status,
              created_at: new Date(paymentIntent.created * 1000).toISOString()
            });
          }
        }
        
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log(`Processing invoice.payment_succeeded for ${invoice.id}`);
        
        if (invoice.subscription && invoice.customer) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const customer = await stripe.customers.retrieve(invoice.customer as string);
          
          if (typeof customer !== 'string' && !customer.deleted) {
            const userId = customer.metadata.user_id;
            
            if (userId) {
              // Update subscription record
              const { error } = await supabase.from('subscriptions').upsert({
                user_id: userId,
                stripe_subscription_id: subscription.id,
                stripe_customer_id: customer.id,
                status: subscription.status,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                plan_id: subscription.items.data[0].price.id,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'stripe_subscription_id'
              });
              
              if (error) {
                console.error('Error updating subscription:', error);
              }
              
              // Store payment information
              await supabase.from('payments').insert({
                user_id: userId,
                stripe_payment_intent_id: invoice.payment_intent as string,
                amount: invoice.amount_paid,
                status: 'succeeded',
                created_at: new Date(invoice.created * 1000).toISOString()
              }).onConflict('stripe_payment_intent_id').ignore();
            }
          }
        }
        
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`Processing invoice.payment_failed for ${invoice.id}`);
        
        if (invoice.subscription && invoice.customer) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const customer = await stripe.customers.retrieve(invoice.customer as string);
          
          if (typeof customer !== 'string' && !customer.deleted && customer.metadata.user_id) {
            // Update subscription status
            await supabase.from('subscriptions').upsert({
              user_id: customer.metadata.user_id,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: customer.id,
              status: 'incomplete',
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              plan_id: subscription.items.data[0].price.id,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'stripe_subscription_id'
            });
            
            // Store failed payment
            if (invoice.payment_intent) {
              await supabase.from('payments').insert({
                user_id: customer.metadata.user_id,
                stripe_payment_intent_id: invoice.payment_intent as string,
                amount: invoice.amount_due,
                status: 'failed',
                created_at: new Date(invoice.created * 1000).toISOString()
              }).onConflict('stripe_payment_intent_id').ignore();
            }
          }
        }
        
        break;
      }
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log(`Processing subscription ${event.type} for ${subscription.id}`);
        
        // Get customer details
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if (typeof customer !== 'string' && !customer.deleted && customer.metadata.user_id) {
          await supabase.from('subscriptions').upsert({
            user_id: customer.metadata.user_id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customer.id,
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            plan_id: subscription.items.data[0].price.id,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'stripe_subscription_id'
          });
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log(`Processing subscription deletion for ${subscription.id}`);
        
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if (typeof customer !== 'string' && !customer.deleted && customer.metadata.user_id) {
          await supabase.from('subscriptions').upsert({
            user_id: customer.metadata.user_id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customer.id,
            status: 'canceled',
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            plan_id: subscription.items.data[0].price.id,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'stripe_subscription_id'
          });
        }
        
        break;
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log(`Processing payment_intent.succeeded for ${paymentIntent.id}`);
        
        // Only store if this payment is not already associated with an invoice
        // to avoid duplicating data from invoice.payment_succeeded
        if (paymentIntent.metadata.user_id) {
          await supabase.from('payments').insert({
            user_id: paymentIntent.metadata.user_id,
            stripe_payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount,
            status: paymentIntent.status,
            created_at: new Date(paymentIntent.created * 1000).toISOString()
          }).onConflict('stripe_payment_intent_id').ignore();
        }
        
        break;
      }
      
      case 'charge.refunded': {
        const charge = event.data.object;
        console.log(`Processing charge.refunded for ${charge.id}`);
        
        if (charge.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(charge.payment_intent as string);
          
          if (paymentIntent.metadata.user_id) {
            // Update payment status to refunded
            await supabase.from('payments')
              .update({ status: 'refunded' })
              .eq('stripe_payment_intent_id', charge.payment_intent);
          }
        }
        
        break;
      }
      
      default:
        console.log(`🔔 Unhandled event type: ${event.type}`);
    }

    // Return a successful response for all events
    return new Response(
      JSON.stringify({ received: true, type: event.type }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
