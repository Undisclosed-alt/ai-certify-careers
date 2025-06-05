
/* -------------------------------------------------------------------------- */
/*  src/hooks/useBuyCertification.ts                                          */
/* -------------------------------------------------------------------------- */

import { useMutation } from "@tanstack/react-query";
import { callEdge } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

/* ── Types returned by edge functions ------------------------------------- */
interface AttemptCreateResponse {
  attempt: { id: string; exam_id: string };
  exam: unknown;          // replace with a concrete type if you have one
}
interface StripeCheckout {
  checkoutUrl: string;
}
/* ------------------------------------------------------------------------ */

export function useBuyCertification() {
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (certificationId: string) => {
      /* 1 ── fetch price --------------------------------------------------- */
      // TODO: Update to use certifications table when database is migrated
      const { data: certification, error: priceErr } = await supabase
        .from("job_roles")
        .select("price_cents")
        .eq("id", certificationId)
        .single();

      if (priceErr || !certification) {
        throw new Error("Could not fetch price for this exam.");
      }

      /* 2 ── current user -------------------------------------------------- */
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();
      if (authErr || !user) {
        throw new Error("User not authenticated.");
      }

      /* 3 ── FREE exam flow ----------------------------------------------- */
      if (Number(certification.price_cents) === 0) {
        const data = await callEdge<AttemptCreateResponse>("attempt-create", {
          method: "POST",
          body: { certificationId: certificationId, userId: user.id }, // TODO: Rename certificationId param in future
        });

        /* ⚠️  Route via exam-start, NOT directly to the exam page */
        navigate(
          `/exam/start?attempt_id=${data.attempt.id}&role=${certificationId}`,
        );

        toast({
          title: "Success",
          description: "Your free exam is ready!",
        });
        return;
      }

      /* 4 ── PAID exam flow ----------------------------------------------- */
      const { checkoutUrl } = await callEdge<StripeCheckout>(
        "stripe-checkout",
        {
          method: "POST",
          body: { certificationId: certificationId, userId: user.id }, // TODO: Rename certificationId param in future
        },
      );

      window.location.href = checkoutUrl;
    },

    /* 5 ── generic error handler ----------------------------------------- */
    onError: (err) => {
      console.error("Certification purchase error:", err);
      toast({
        title: "Error",
        description: "Could not start the exam. Please try again.",
        variant: "destructive",
      });
    },
  });
}
