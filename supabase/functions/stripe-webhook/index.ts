import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { supabase } from "../_shared/config.ts";
import { verifyStripeSignature, getStripeClient } from "../_shared/stripe.ts";
import { recordPayment, upsertSubscriptionFromStripe } from "../_shared/payments.ts";
import { logError } from "../_shared/logger.ts";

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
    // Use our shared service to verify the Stripe webhook signature
    const event = await verifyStripeSignature(req);
    const stripe = getStripeClient();

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
            
            // Use our shared service to record the payment
            await recordPayment({
              userId: session.client_reference_id,
              stripePaymentIntentId: paymentIntent.id,
              amount: paymentIntent.amount / 100, // Convert from cents to decimal
              status: paymentIntent.status
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
              // Use our shared service to update subscription record
              await upsertSubscriptionFromStripe(subscription);
              
              // Store payment information
              await recordPayment({
                userId: userId,
                stripePaymentIntentId: invoice.payment_intent as string,
                amount: invoice.amount_paid / 100, // Convert from cents to decimal
                status: 'succeeded'
              });
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
              plan_id: subscription.items.data[0].price.id
              // updated_at is handled by the database trigger now
            }, {
              onConflict: 'stripe_subscription_id'
            });
            
            // Store failed payment
            if (invoice.payment_intent) {
              await supabase.from('payments').insert({
                user_id: customer.metadata.user_id,
                stripe_payment_intent_id: invoice.payment_intent as string,
                amount: invoice.amount_due / 100, // Convert from cents to decimal
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
            plan_id: subscription.items.data[0].price.id
            // updated_at is handled by the database trigger now
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
            plan_id: subscription.items.data[0].price.id
            // updated_at is handled by the database trigger now
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
            amount: paymentIntent.amount / 100, // Convert from cents to decimal
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
    // Use our shared error logger
    const errorDetails = logError(error, 'stripe-webhook');
    
    return new Response(
      JSON.stringify({ error: errorDetails.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
