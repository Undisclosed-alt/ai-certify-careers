import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Certification } from "@/types";
import { getCertificationById } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";
import { useBuyCertification } from "@/hooks/useBuyCertification";
import { useAuth } from "@/contexts/AuthContext";

const CertificationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [certification, setCertification] = useState<Certification | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const buyCertification = useBuyCertification();

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      try {
        const cert = await getCertificationById(id);
        setCertification(cert ?? null);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load certification details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [id, toast]);

  const handleClick = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to start the exam.",
      });
      navigate("/login", { state: { from: `/certifications/${id}` } });
      return;
    }
    if (certification) buyCertification.mutate(certification.id);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!certification) {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive">
          <AlertTitle>Certification not found</AlertTitle>
          <AlertDescription>
            The certification you're looking for doesn't exist.
          </AlertDescription>
        </Alert>
        <Button className="mt-6" onClick={() => navigate("/certifications")}>
          Back to certifications
        </Button>
      </div>
    );
  }

  const isFree = certification.price_cents === 0;

  return (
    <div className="container mx-auto py-12 max-w-4xl">
      <Button variant="outline" className="mb-6" onClick={() => navigate("/certifications")}>
        &larr; Back
      </Button>

      <h1 className="text-3xl font-bold mb-2">{certification.title}</h1>
      <p className="text-muted-foreground mb-6">{certification.description}</p>

      <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-center mb-8">
        <p className="text-xl font-semibold">
          {isFree ? "Free" : `$${(certification.price_cents / 100).toFixed(2)}`}
        </p>
        <Button size="lg" onClick={handleClick} disabled={buyCertification.isPending}>
          {buyCertification.isPending ? "Processing…" : isFree ? "Start Exam" : "Take Exam"}
        </Button>
      </div>
    </div>
  );
};

export default CertificationDetailPage;
