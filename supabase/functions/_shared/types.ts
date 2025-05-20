
/**
 * 📦 Shared Types
 * Type definitions for core entities used across Edge Functions
 */

// Stripe imports for type definitions
import { Stripe } from "https://esm.sh/stripe@12.2.0";

export interface ExamType {
  id: string;
  job_role_id: string;
  time_limit_minutes: number;
  passing_score: number;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionType {
  id: string;
  exam_id: string;
  body: string;
  type: string;
  options: any[] | null;
  correct_answer: string | null;
  category: string | null;
  difficulty: number | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentType {
  id: string;
  user_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface SubscriptionType {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  plan_id: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface LogMetadata {
  [key: string]: any;
}

// Types for Stripe Events we handle
export interface StripeEventMetadata {
  eventId: string;
  eventType: string;
  objectId: string;
  objectType: string;
}
