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
import { JobRole, Exam } from "@/types";
import {
  getJobRoleById,
  generateExamForJobRole,
  startExamAttempt,
} from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBuyExam } from "@/hooks/useBuyExam";
import { supabase } from "@/integrations/supabase/client";
import { useStartAttempt } from "@/hooks/useStartAttempt";

const ExamStartPage = () => {
  /* ---------------------------------------------------------------------- */
  /*  hooks / context                                                       */
  /* ---------------------------------------------------------------------- */
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { toast } = useToast();

  /* ---------------------------------------------------------------------- */
  /*  state                                                                 */
  /* ---------------------------------------------------------------------- */
  const [jobRole, setJobRole]     = useState<JobRole | null>(null);
  const [exam, setExam]           = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isGeneratingExam, setIsGeneratingExam]     = useState(false);
  const [isFreeExam, setIsFreeExam] = useState(false);

  /* ---------------------------------------------------------------------- */
  /*  mutations                                                             */
  /* ---------------------------------------------------------------------- */
  const buyExamMutation                            = useBuyExam();
  const {
    mutate: startAttempt,
    isLoading: isStartingAttempt,
  }                                               = useStartAttempt();

  /* ---------------------------------------------------------------------- */
  /*  query-string / route params                                           */
  /* ---------------------------------------------------------------------- */
  const searchParams    = new URLSearchParams(location.search);
  const roleId          = searchParams.get("role");
  const routeAttemptId  =
    params.id || searchParams.get("attempt_id"); // attempt id from route OR query
  const sessionId       = searchParams.get("session_id");

  /* ---------------------------------------------------------------------- */
  /*  effect: verify payment / load exam / etc.                             */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    const verifyAndLoadExam = async () => {
      if (!user) {
        setError("Authentication required");
        setIsLoading(false);
        return;
      }

      /* ────────────── 1. FREE EXAM PATH (attempt_id present) ──────────── */
      if (routeAttemptId) {
        try {
          /* no payment verification for bypass attempts */
          setIsVerifyingPayment(false);

          /* fetch the attempt row */
          const { data: attempt, error: attemptError } = await supabase
            .from("attempts")
            .select("exam_id, payment_bypass")
            .eq("id", routeAttemptId)
            .single();

          if (attemptError || !attempt) {
            setError("Invalid attempt ID");
            setIsLoading(false);
            return;
          }

          if (!attempt.payment_bypass) {
            setError("Payment required for this attempt");
            setIsLoading(false);
            return;
          }

          /* fetch the exam row */
          const { data: examData, error: examError } = await supabase
            .from("exams")
            .select("*, job_role_id")
            .eq("id", attempt.exam_id)
            .single();

          if (examError || !examData) {
            setError("Failed to load exam data");
            setIsLoading(false);
            return;
          }

          /* fetch job role */
          const roleData = await getJobRoleById(examData.job_role_id);
          if (!roleData) {
            setError("Job role not found");
            setIsLoading(false);
            return;
          }

          setJobRole(roleData);
          setIsFreeExam(roleData.price_cents === 0);

          /* generate exam (your original logic) */
          const generatedExam = await generateExamForJobRole(roleData.id);
          setExam(generatedExam);

          setIsLoading(false);
          toast({
            title: "Exam Ready",
            description: "Your certification exam has been generated.",
          });
        } catch (err: any) {
          console.error("Failed to prepare exam:", err);
          setError("Failed to prepare the exam. Please try again.");
          setIsLoading(false);
        }
        return;
      }

      /* ────────────── 2. PAID EXAM PATH (session_id present) ──────────── */
      if (sessionId) {
        setIsVerifyingPayment(true);
        if (!roleId) {
          setError("Missing role ID");
          setIsLoading(false);
          setIsVerifyingPayment(false);
          return;
        }
        try {
          const roleData = await getJobRoleById(roleId);
          if (!roleData) {
            setError("Job role not found");
            setIsLoading(false);
            setIsVerifyingPayment(false);
            return;
          }

          setJobRole(roleData);
          setIsFreeExam(roleData.price_cents === 0);

          /* verify payment (API) */
          const isPaymentValid = await verifyPaymentViaApi(sessionId);
          setIsVerifyingPayment(false);

          if (!isPaymentValid) {
            setError("Payment verification failed");
            setIsLoading(false);
            return;
          }

          const generatedExam = await generateExamForJobRole(roleId);
          setExam(generatedExam);
          setIsLoading(false);

          toast({
            title: "Exam Ready",
            description: "Your certification exam has been generated.",
          });
        } catch (err: any) {
          console.error("Failed to prepare exam:", err);
          setError("Failed to prepare the exam. Please try again.");
          setIsLoading(false);
          setIsVerifyingPayment(false);
        }
        return;
      }

      /* ────────────── 3. LANDING PATH (role id only) ───────────────────── */
      if (roleId) {
        try {
          const roleData = await getJobRoleById(roleId);
          if (!roleData) {
            setError("Job role not found");
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
          console.error("Failed to prepare exam:", err);
          setError("Failed to prepare the exam. Please try again.");
          setIsLoading(false);
        }
        return;
      }

      /* ────────────── 4. no identifiers ───────────────────────────────── */
      setError("Missing required information");
      setIsLoading(false);
    };

    verifyAndLoadExam();
  }, [roleId, routeAttemptId, sessionId, user, toast]);

  /* ---------------------------------------------------------------------- */
  /*  helpers                                                               */
  /* ---------------------------------------------------------------------- */
  const verifyPaymentViaApi = async (sessionId: string) => {
    try {
      const result = await fetch("/api/stripe-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      }).then((res) => res.json());
      return result.success;
    } catch (err) {
      console.error("Error verifying payment:", err);
      return false;
    }
  };

  /* ---------------------------------------------------------------------- */
  /*  handlers                                                              */
  /* ---------------------------------------------------------------------- */
  const handleStartExam = async () => {
    /* ── NEW: free-exam path handled by useStartAttempt ------------------ */
    if (routeAttemptId) {
      startAttempt(routeAttemptId);
      return;
    }

    /* ── legacy path: role-only / paid exam (uses existing service) ------ */
    if (!user || !exam) return;

    try {
      setIsGeneratingExam(true);
      const examAttempt = await startExamAttempt(user.id, exam.id);
      navigate(`/exam/${examAttempt.id}`, {
        state: { exam, attemptId: examAttempt.id },
      });
    } catch (err) {
      console.error("Failed to start exam:", err);
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
    if (!jobRole?.id) return;
    buyExamMutation.mutate(jobRole.id);
  };

  /* ---------------------------------------------------------------------- */
  /*  redirects / loading / error UI                                        */
  /* ---------------------------------------------------------------------- */
  if (!user) {
    navigate("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-bold mb-2">
          {isVerifyingPayment
            ? "Verifying payment..."
            : "Preparing your exam..."}
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
                    Processing...
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
          <Button onClick={() => navigate("/jobs")}>Back to Job Roles</Button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*  normal render                                                         */
  /* ---------------------------------------------------------------------- */
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
        <CardContent>
          {/* ------------- details & instructions (unchanged) ------------- */}
          {/* ... existing JSX kept exactly as in your original file ... */}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleStartExam}
            className="w-full"
            disabled={isGeneratingExam || isStartingAttempt}
          >
            {isGeneratingExam || isStartingAttempt ? (
              <>
                <div className="mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Preparing Exam...
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
