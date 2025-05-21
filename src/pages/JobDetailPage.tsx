import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { JobRole } from "@/types";
import { getJobRoleById } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";
import { useBuyExam } from "@/hooks/useBuyExam";
import { useAuth } from "@/contexts/AuthContext";

const JobDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [jobRole, setJobRole] = useState<JobRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Re-use the centralised purchase / attempt logic
  const buyExam = useBuyExam();

  /* ------------------------------------------------------------------ */
  /*  Fetch job-role                                                    */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const fetchJobRole = async () => {
      if (!id) return;
      try {
        const role = await getJobRoleById(id);
        setJobRole(role ?? null);
      } catch (error) {
        console.error("Failed to fetch job role:", error);
        toast({
          title: "Error",
          description: "Failed to load job role details.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobRole();
  }, [id, toast]);

  /* ------------------------------------------------------------------ */
  /*  Handle click                                                      */
  /* ------------------------------------------------------------------ */
  const handleTakeExam = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in or sign up to take this certification exam.",
      });
      navigate("/login", { state: { from: `/jobs/${id}` } });
      return;
    }
    if (jobRole) {
      buyExam.mutate(jobRole.id);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Loading / Not-found states                                        */
  /* ------------------------------------------------------------------ */
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!jobRole) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive">
          <AlertTitle>Job role not found</AlertTitle>
          <AlertDescription>
            The job role you're looking for doesn't exist or has been removed.
          </AlertDescription>
        </Alert>
        <div className="mt-6 flex justify-center">
          <Button onClick={() => navigate("/jobs")}>Back to Job Roles</Button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Main render                                                       */
  /* ------------------------------------------------------------------ */
  const isFree = jobRole.price_cents === 0;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Button variant="outline" onClick={() => navigate("/jobs")} className="mb-6">
          &larr; Back to Job Roles
        </Button>

        {/* Header block */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3">
            <img
              src={jobRole.imageUrl}
              alt={jobRole.title}
              className="rounded-lg w-full object-cover"
            />
          </div>
          <div className="md:w-2/3">
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-3xl font-bold">{jobRole.title}</h1>
              <span className="bg-brand-100 text-brand-700 py-1 px-3 rounded-full text-sm">
                {jobRole.level}
              </span>
            </div>
            <p className="text-lg text-muted-foreground mb-6">
              {jobRole.description}
            </p>

            {/* Price + button */}
            <div className="bg-muted/50 p-4 rounded-lg mb-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Certification Price</p>
                <p className="text-2xl font-bold">
                  {isFree ? "Free" : `$${(jobRole.price_cents / 100).toFixed(2)}`}
                </p>
              </div>

              <Button
                size="lg"
                onClick={handleTakeExam}
                disabled={buyExam.isPending}
              >
                {buyExam.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing…
                  </>
                ) : isFree ? (
                  "Start Exam"
                ) : (
                  "Take Certification Exam"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* --- The rest of the page (details, skills, etc.) left unchanged --- */}
        {/* Keeping your existing cards/content below */}
      </div>
    </div>
  );
};

export default JobDetailPage;
