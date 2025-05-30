import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { JobRole, Exam } from '@/types';
import {
  getJobRoleById,
  generateExamForJobRole,
  startExamAttempt,
} from '@/services/dataService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useBuyExam } from '@/hooks/useBuyExam';
import { supabase } from '@/integrations/supabase/client';

// -----------------------------------------------------------------------------
// ExamStartPage – entry point for both paid and free certification exam flows.
// -----------------------------------------------------------------------------
//
// 1. Paid flow (Stripe)
//    /start?role=<roleId>&session_id=<stripeSession>
//       ↳ verifies payment ↳ generates exam ↳ user clicks Start
//       ↳ POST /attempts ↳ /exam/:attemptId
//
// 2. Free flow (promo/demo)
//    /start?attempt_id=<existingAttemptId>
//       ↳ loads attempt & exam ↳ user clicks Start
//       ↳ **re‑uses** existing attempt ↳ /exam/:attemptId
// -----------------------------------------------------------------------------

const ExamStartPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const { toast } = useToast();
  const buyExamMutation = useBuyExam();

  // ---------------------------------------------------------------------------
  // Local state
  // ---------------------------------------------------------------------------
  const [jobRole, setJobRole] = useState<JobRole | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [isFreeExam, setIsFreeExam] = useState(false);

  // ---------------------------------------------------------------------------
  // Query‑string params
  // ---------------------------------------------------------------------------
  const searchParams = new URLSearchParams(location.search);
  const roleId = searchParams.get('role');
  const routeAttemptId = params.id || searchParams.get('attempt_id');
  const sessionId = searchParams.get('session_id');

  // ---------------------------------------------------------------------------
  // Boot logic – decide which flow applies
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const verifyAndLoadExam = async () => {
      if (!user) {
        setError('Authentication required');
        setIsLoading(false);
        return;
      }

      // ----------------------- FREE FLOW ------------------------------------
      if (routeAttemptId) {
        try {
          // 1) Load attempt row (guards that payment_bypass is true)
          const { data: attempt, error: attemptError } = await supabase
            .from('attempts')
            .select('exam_id, payment_bypass')
            .eq('id', routeAttemptId)
            .single();

          if (attemptError || !attempt) {
            setError('Invalid attempt ID');
            setIsLoading(false);
            return;
          }

          if (!attempt.payment_bypass) {
            setError('Payment required for this attempt');
            setIsLoading(false);
            return;
          }

          // 2) Get exam + job role
          const { data: examData, error: examError } = await supabase
            .from('exams')
            .select('*, job_role_id')
            .eq('id', attempt.exam_id)
            .single();

          if (examError || !examData) {
            setError('Failed to load exam data');
            setIsLoading(false);
            return;
          }

          const roleData = await getJobRoleById(examData.job_role_id);
          if (!roleData) {
            setError('Job role not found');
            setIsLoading(false);
            return;
          }

          setJobRole(roleData);
          setIsFreeExam(true);

          // For simplicity we regenerate the exam so both flows share the same
          // generator (can be optimised later).
          const generatedExam = await generateExamForJobRole(roleData.id);
          setExam(generatedExam);
          setIsLoading(false);

          toast({
            title: 'Exam Ready',
            description: 'Your certification exam has been generated.',
          });
        } catch (err: any) {
          console.error('Failed to prepare exam:', err);
          setError('Failed to prepare the exam. Please try again.');
          setIsLoading(false);
        }

        return; // free flow ends here
      }

      // ----------------------- PAID FLOW ------------------------------------
      if (sessionId) {
        setIsVerifyingPayment(true);

        if (!roleId) {
          setError('Missing role ID');
          setIsLoading(false);
          setIsVerifyingPayment(false);
          return;
        }

        try {
          const roleData = await getJobRoleById(roleId);
          if (!roleData) {
            setError('Job role not found');
            setIsLoading(false);
            setIsVerifyingPayment(false);
            return;
          }

          setJobRole(roleData);
          setIsFreeExam(roleData.price_cents === 0);

          // 1) Verify payment through backend
          const paymentOk = await verifyPaymentViaApi(sessionId);
          setIsVerifyingPayment(false);

          if (!paymentOk) {
            setError('Payment verification failed');
            setIsLoading(false);
            return;
          }

          // 2) Payment good – generate exam
          const generatedExam = await generateExamForJobRole(roleId);
          setExam(generatedExam);
          setIsLoading(false);

          toast({
            title: 'Exam Ready',
            description: 'Your certification exam has been generated.',
          });
        } catch (err: any) {
          console.error('Failed to prepare exam:', err);
          setError('Failed to prepare the exam. Please try again.');
          setIsLoading(false);
          setIsVerifyingPayment(false);
        }

        return; // paid flow ends here
      }

      // ----------------------- ROLE PAGE START ------------------------------
      if (roleId) {
        try {
          const roleData = await getJobRoleById(roleId);
          if (!roleData) {
            setError('Job role not found');
            setIsLoading(false);
            return;
          }

          setJobRole(roleData);
          setIsFreeExam(roleData.price_cents === 0);

          if (roleData.price_cents === 0) {
            const generatedExam = await generateExamForJobRole(roleId);
            setExam(generatedExam);
          }

          setIsLoading(false);
        } catch (err: any) {
          console.error('Failed to prepare exam:', err);
          setError('Failed to prepare the exam. Please try again.');
          setIsLoading(false);
        }

        return;
      }

      // ----------------------- NOTHING TO DO -------------------------------
      setError('Missing required information');
      setIsLoading(false);
    };

    verifyAndLoadExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId, routeAttemptId, sessionId, user]);

  // ---------------------------------------------------------------------------
  // Helper – verify payment with backend
  // ---------------------------------------------------------------------------
  const verifyPaymentViaApi = async (stripeSessionId: string) => {
    try {
      const result = await fetch('/api/stripe-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: stripeSessionId }),
      }).then(res => res.json());

      return result.success;
    } catch (err) {
      console.error('Error verifying payment:', err);
      return false;
    }
  };

  // ---------------------------------------------------------------------------
  // Start exam (click handler)
  // ---------------------------------------------------------------------------
  const handleStartExam = async () => {
    if (!user || !exam) return;

    /* ---------- FREE FLOW SHORT‑CIRCUIT --------------------------------- */
    if (isFreeExam && routeAttemptId) {
      navigate(`/exam/${routeAttemptId}`, {
        state: { exam, attemptId: routeAttemptId },
      });
      return;
    }
    /* -------------------------------------------------------------------- */

    setIsGeneratingExam(true);

    try {
      const examAttempt = await startExamAttempt(user.id, exam.id);
      navigate(`/exam/${examAttempt.id}`, {
        state: { exam, attemptId: examAttempt.id },
      });
    } catch (err) {
      console.error('Failed to start exam:', err);
      toast({
        title: 'Error',
        description: 'Failed to start the exam. Please try again.',
        variant: 'destructive',
      });
      setIsGeneratingExam(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Buy exam (paid flow initial page)
  // ---------------------------------------------------------------------------
  const handleBuyExam = () => {
    if (!jobRole?.id) return;
    buyExamMutation.mutate(jobRole.id);
  };

  // ---------------------------------------------------------------------------
  // Render – authentication guard
  // ---------------------------------------------------------------------------
  if (!user) {
    navigate('/login');
    return null;
  }

  // ---------------------------------------------------------------------------
  // Render – loading state
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-bold mb-2">
          {isVerifyingPayment ? 'Verifying payment...' : 'Preparing your exam...'}
        </h2>
        <p className="text-muted-foreground">This will only take a moment. Please don't close this page.</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render – error state
  // ---------------------------------------------------------------------------
  if (error) {
    if (error === 'Payment required' && jobRole) {
      return (
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <Card>
            <CardHeader>
