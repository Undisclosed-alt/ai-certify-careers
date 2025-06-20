/* -------------------------------------------------------------------------- */
/*  src/pages/exam/ExamStartPage.tsx                                          */
/* -------------------------------------------------------------------------- */

import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Certification, Exam } from "@/types";
import {
  getJobRoleById,
  generateExamForJobRole,
  startExamAttempt,
} from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBuyCertification } from "@/hooks/useBuyCertification";
import { supabase } from "@/integrations/supabase/client";
import { useStartAttempt } from "@/hooks/useStartAttempt";

const ExamStartPage = () => {
  /* ── context & router -------------------------------------------------- */
  const { user } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const params    = useParams();
  const { toast } = useToast();

  /* ── state ------------------------------------------------------------- */
  const [jobRole, setJobRole]             = useState<Certification | null>(null);
  const [exam, setExam]                   = useState<Exam | null>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isGeneratingExam, setIsGeneratingExam]     = useState(false);
  const [isFreeExam, setIsFreeExam]       = useState(false);

  /* ── mutations --------------------------------------------------------- */
  const buyExamMutation = useBuyCertification();
  const {
    mutate: startAttempt,
    isLoading: isStartingAttempt,
  } = useStartAttempt();

  /* ── params ------------------------------------------------------------ */
  const qs            = new URLSearchParams(location.search);
  const roleId        = qs.get("role");
  const routeAttemptId =
    params.id || qs.get("attempt_id");          // free-flow attempt id
  const sessionId     = qs.get("session_id");   // Stripe checkout flow

  /* ── effect: prepare exam --------------------------------------------- */
  useEffect(() => {
    const prepare = async () => {
      if (!user) {
        setError("Authentication required");
        setIsLoading(false);
        return;
      }

      /* ---------- FREE flow (attempt_id) -------------------------------- */
      if (routeAttemptId) {
        try {
          const { data: attempt, error: aErr } = await supabase
            .from("attempts")
            .select("exam_id, payment_bypass")
            .eq("id", routeAttemptId)
            .single();
          if (aErr || !attempt) throw new Error("Invalid attempt ID");
          if (!attempt.payment_bypass)
            throw new Error("Payment required for this attempt");

          const { data: examRow, error: eErr } = await supabase
            .from("exams")
            .select("*, job_role_id")
            .eq("id", attempt.exam_id)
            .single();
          if (eErr || !examRow) throw new Error("Failed to load exam data");

          const role = await getJobRoleById(examRow.job_role_id);
          if (!role) throw new Error("Certification role not found");

          setJobRole(role);
          setIsFreeExam(role.price_cents === 0);

          const generated = await generateExamForJobRole(role.id);
          setExam(generated);

          toast({
            title: "Exam Ready",
            description: "Your certification exam has been generated.",
          });
          setIsLoading(false);
        } catch (err: any) {
          console.error(err);
          setError(err.message ?? "Failed to prepare the exam.");
          setIsLoading(false);
        }
        return;
      }

      /* ---------- Paid flow (session_id) -------------------------------- */
      if (sessionId) {
        setIsVerifyingPayment(true);
        if (!roleId) {
          setError("Missing role ID");
          setIsLoading(false);
          setIsVerifyingPayment(false);
          return;
        }

        try {
          const role = await getJobRoleById(roleId);
          if (!role) throw new Error("Certification role not found");

          setJobRole(role);
          setIsFreeExam(role.price_cents === 0);

          const ok = await verifyPaymentViaApi(sessionId);
          setIsVerifyingPayment(false);
          if (!ok) throw new Error("Payment verification failed");

          const generated = await generateExamForJobRole(role.id);
          setExam(generated);
          toast({
            title: "Exam Ready",
            description: "Your certification exam has been generated.",
          });
          setIsLoading(false);
        } catch (err: any) {
          console.error(err);
          setError(err.message ?? "Failed to prepare the exam.");
          setIsLoading(false);
          setIsVerifyingPayment(false);
        }
        return;
      }

      /* ---------- Landing flow (role only) ------------------------------ */
      if (roleId) {
        try {
          const role = await getJobRoleById(roleId);
          if (!role) throw new Error("Certification role not found");

          setJobRole(role);
          setIsFreeExam(role.price_cents === 0);

          if (role.price_cents === 0) {
            const generated = await generateExamForJobRole(role.id);
            setExam(generated);
          }
          setIsLoading(false);
        } catch (err: any) {
          console.error(err);
          setError(err.message ?? "Failed to prepare the exam.");
          setIsLoading(false);
        }
        return;
      }

      /* ---------- nothing supplied -------------------------------------- */
      setError("Missing required information");
      setIsLoading(false);
    };

    prepare();
  }, [roleId, routeAttemptId, sessionId, user, toast]);

  /* ── helpers ----------------------------------------------------------- */
  const verifyPaymentViaApi = async (sid: string) => {
    try {
      const res = await fetch("/api/stripe-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid }),
      }).then((r) => r.json());
      return res.success;
    } catch (err) {
      console.error("Stripe verify error:", err);
      return false;
    }
  };

  /* ── handlers ---------------------------------------------------------- */
  const handleStartExam = async () => {
    /* free-exam flow → edge function */
    if (routeAttemptId) {
      startAttempt(routeAttemptId);
      return;
    }

    /* paid / role-only flows (legacy service) */
    if (!user || !exam) return;
    try {
      setIsGeneratingExam(true);
      const attempt = await startExamAttempt(user.id, exam.id);
      navigate(`/exam/${attempt.id}`, {
        state: { exam, attemptId: attempt.id },
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to start the exam. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingExam(false);
    }
  };

  const handleBuyExam = () => {
    if (jobRole?.id) buyExamMutation.mutate(jobRole.id);
  };

  /* ── redirects / load & error UI (unchanged) --------------------------- */
  if (!user) {
    navigate("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-bold mb-2">
          {isVerifyingPayment ? "Verifying payment…" : "Preparing your exam…"}
        </h2>
        <p className="text-muted-foreground">
          This will only take a moment. Please don&apos;t close this page.
        </p>
      </div>
    );
  }

  if (error) {
    if (error === "Payment required" && jobRole) {
      return (
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {jobRole.title} Certification Exam
              </CardTitle>
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
                  After completing your payment, you&apos;ll be redirected back
                  to start the exam.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleBuyExam}
                className="w-full"
                disabled={buyExamMutation.isPending}
              >
                {buyExamMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing…
                  </>
                ) : (
                  "Pay & Start Exam"
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
          <Button onClick={() => navigate("/certifications")}>Back to Certifications</Button>
        </div>
      </div>
    );
  }

  /* ── NORMAL RENDER (original JSX restored) ----------------------------- */
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {jobRole?.title} Certification Exam
          </CardTitle>
          <CardDescription>
            Your exam is ready to begin when you are.
          </CardDescription>
        </CardHeader>

        {/* ------- THIS IS THE BLOCK THAT DISAPPEARED: RESTORED ------------- */}
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
                    {/* clock icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-primary mr-2 mt-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4l3 3" />
                    </svg>
                    <span>Time Limit: {exam?.timeLimit} minutes</span>
                  </li>
                  <li className="flex items-start">
                    {/* calendar icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-primary mr-2 mt-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        width="18"
                        height="18"
                        x="3"
                        y="4"
                        rx="2"
                        ry="2"
                      />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    <span>Number of Questions: {exam?.questions.length}</span>
                  </li>
                  <li className="flex items-start">
                    {/* trophy icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-primary mr-2 mt-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="4 7 4 4 20 4 20 7" />
                      <line x1="9" y1="20" x2="15" y2="20" />
                      <line x1="12" y1="4" x2="12" y2="20" />
                    </svg>
                    <span>Passing Score: {exam?.passingScore}%</span>
                  </li>
                  {isFreeExam && (
                    <li className="flex items-start">
                      {/* check icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12A10 10 0 1 1 16.07 2.93" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span className="font-semibold text-green-600">
                        Free Exam
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Exam Instructions</h3>
                <ul className="space-y-2">
                  {[
                    "Once started, the timer cannot be paused",
                    "Answer all questions to the best of your ability",
                    "Results will be processed immediately after completion",
                  ].map((txt) => (
                    <li key={txt} className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-primary mr-2 mt-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
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
                Make sure you have a stable internet connection and will not be
                disturbed for the next {exam?.timeLimit} minutes. Click the
                button below when you&apos;re ready to start.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
        {/* ----------------------------------------------------------------- */}
        <CardFooter>
          <Button
            onClick={handleStartExam}
            className="w-full"
            disabled={isGeneratingExam || isStartingAttempt}
          >
            {isGeneratingExam || isStartingAttempt ? (
              <>
                <div className="mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Preparing Exam…
              </>
            ) : (
              "Start Exam Now"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ExamStartPage;
