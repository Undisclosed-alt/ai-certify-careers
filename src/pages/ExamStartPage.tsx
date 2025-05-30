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

/**
 * ExamStartPage
 * --------------------------------------------------
 * Handles three entry paths:
 * 1. Free attempt (query or param `attempt_id`) – no payment, attempt already exists.
 * 2. Paid flow returning from Stripe (`session_id`) – verify payment then create attempt.
 * 3. Browsing a job role directly (`role`) – show price/pay, or generate free exam.
 */
const ExamStartPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [jobRole, setJobRole] = useState<JobRole | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [isFreeExam, setIsFreeExam] = useState(false);
  const { toast } = useToast();
  const buyExamMutation = useBuyExam();

  // ---- URL params ---------------------------------------------------------
  const searchParams = new URLSearchParams(location.search);
  const roleId = searchParams.get('role');
  const routeAttemptId = params.id || searchParams.get('attempt_id');
  const sessionId = searchParams.get('session_id');

  // ---- Boot‑up ------------------------------------------------------------
  useEffect(() => {
    const verifyAndLoadExam = async () => {
      if (!user) {
        setError('Authentication required');
        setIsLoading(false);
        return;
      }

      // ── 1. FREE FLOW (attempt already exists) ────────────────────────────
      if (routeAttemptId) {
        try {
          // Fetch attempt to ensure it is free / valid
          const { data: attempt, error: attemptError } = await supabase
            .from('attempts')
            .select('exam_id, payment_bypass')
            .eq('id', routeAttemptId)
            .single();

          if (attemptError || !attempt) throw new Error('Invalid attempt ID');
          if (!attempt.payment_bypass) throw new Error('Payment required');

          // Fetch exam and role
          const { data: examData, error: examErr } = await supabase
            .from('exams')
            .select('*, job_role_id')
            .eq('id', attempt.exam_id)
            .single();
          if (examErr || !examData) throw new Error('Failed to load exam');

          const roleData = await getJobRoleById(examData.job_role_id);
          if (!roleData) throw new Error('Job role not found');

          setJobRole(roleData);
          setIsFreeExam(true);

          // The exam already exists, but generateExamForJobRole returns full
          // question data we need in the UI (could be cached server‑side).
          const generatedExam = await generateExamForJobRole(roleData.id);
          setExam(generatedExam);

          toast({ title: 'Exam Ready', description: 'Your certification exam has been generated.' });
        } catch (err: any) {
          setError(err.message || 'Failed to prepare exam');
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // ── 2. PAID FLOW (stripe session) ───────────────────────────────────
      if (sessionId) {
        if (!roleId) {
          setError('Missing role ID');
          setIsLoading(false);
          return;
        }
        setIsVerifyingPayment(true);
        try {
          const roleData = await getJobRoleById(roleId);
          if (!roleData) throw new Error('Job role not found');
          setJobRole(roleData);
          setIsFreeExam(roleData.price_cents === 0);

          const paymentOk = await verifyPaymentViaApi(sessionId);
          if (!paymentOk) throw new Error('Payment verification failed');

          const generatedExam = await generateExamForJobRole(roleId);
          setExam(generatedExam);
          toast({ title: 'Exam Ready', description: 'Your certification exam has been generated.' });
        } catch (err: any) {
          setError(err.message || 'Failed to prepare exam');
        } finally {
          setIsVerifyingPayment(false);
          setIsLoading(false);
        }
        return;
      }

      // ── 3. ROLE PREVIEW (user navigated here) ───────────────────────────
      if (roleId) {
        try {
          const roleData = await getJobRoleById(roleId);
          if (!roleData) throw new Error('Job role not found');
          setJobRole(roleData);
          setIsFreeExam(roleData.price_cents === 0);

          if (roleData.price_cents === 0) {
            const generatedExam = await generateExamForJobRole(roleId);
            setExam(generatedExam);
          }
        } catch (err: any) {
          setError(err.message || 'Failed to prepare exam');
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // ── 4. NO IDENTIFIERS ───────────────────────────────────────────────
      setError('Missing required information');
      setIsLoading(false);
    };

    verifyAndLoadExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId, routeAttemptId, sessionId, user]);

  // ---- Helpers -----------------------------------------------------------
  const verifyPaymentViaApi = async (sessionId: string) => {
    try {
      const res = await fetch('/api/stripe-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).then((r) => r.json());
      return res.success;
    } catch (err) {
      console.error('Error verifying payment:', err);
      return false;
    }
  };

  // ---- Handlers ----------------------------------------------------------
  const handleStartExam = async () => {
    if (!user || !exam) return;

    // ── FREE‑exam reuse existing attempt ──────────────────────────────────
    if (isFreeExam && routeAttemptId) {
      navigate(`/exam/${routeAttemptId}`, {
        state: { exam, attemptId: routeAttemptId },
      });
      return;
    }

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

  const handleBuyExam = () => {
    if (!jobRole?.id) return;
    buyExamMutation.mutate(jobRole.id);
  };

  // ---- Early redirects ---------------------------------------------------
  if (!user) {
    navigate('/login');
    return null;
  }

  // ---- Loading state -----------------------------------------------------
  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-bold mb-2">
          {isVerifyingPayment ? 'Verifying payment...' : 'Preparing your exam...'}
        </h2>
        <p className="text-muted-foreground">
          This will only take a moment. Please don't close this page.
        </p>
      </div>
    );
  }

  // ---- Error states ------------------------------------------------------
  if (error) {
    if (error === 'Payment required' && jobRole) {
      return (
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{jobRole.title} Certification Exam</CardTitle>
              <CardDescription>
                Complete your purchase to access this certification exam.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-xl font-semibold">
                  Price: ${(jobRole.price_cents / 100).toFixed(2)} USD
                </p>
                <p className="text-muted-foreground">
                  After completing your payment, you'll be redirected back to start the exam.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleBuyExam} disabled={buyExamMutation.isPending}>
                {buyExamMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Pay & Start Exam'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-6 flex justify-center">
          <Button onClick={() => navigate('/jobs')}>Back to Job Roles</Button>
        </div>
      </div>
    );
  }

  // ---- Main screen -------------------------------------------------------
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{jobRole?.title} Certification Exam</CardTitle>
          <CardDescription>Your exam is ready to begin when you are.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Exam Description</h3>
              <p className="text-muted-foreground">{exam?.description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Exam Details</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4l3 3" />
                    </svg>
                    <span>Time Limit: {exam?.timeLimit} minutes</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    <span>Number of Questions: {exam?.questions.length}</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="4 7 4 4 20 4 20 7" />
                      <line x1="9" y1="20" x2="15" y2="20" />
                      <line x1="12" y1="4" x2="12" y2="20" />
                    </svg>
                    <span>Passing Score: {exam?.passingScore}%</span>
                  </li>
                  {isFreeExam && (
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span className="font-semibold text-green-600">Free Exam</span>
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Exam Instructions</h3>
                <ul className="space-y-2">
                  {['Once started, the timer cannot be paused', 'Answer all questions to the best of your ability', 'Results will be processed immediately after completion'].map((txt) => (
                    <li className="flex items-start" key={txt}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                        <circle cx="12" cy="13" r="3" />
                      </svg>
                      <span>{txt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Alert>
              <AlertTitle>Ready to begin?</AlertTitle>
              <AlertDescription>
                Make sure you have a stable internet connection and will not be disturbed for the next {exam?.timeLimit} minutes. Click the button below when you're ready to start.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleStartExam} disabled={isGeneratingExam}>
            {isGeneratingExam ? (
              <>
                <div className="mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Preparing Exam...
              </>
            ) : (
              'Start Exam Now'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ExamStartPage;
