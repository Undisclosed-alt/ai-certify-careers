
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Certification } from "@/types";
import { useBuyCertification } from "@/hooks/useBuyCertification";

interface CertificationCardProps {
  certification: Certification;
}

export const CertificationCard: React.FC<CertificationCardProps> = ({ certification }) => {
  const navigate = useNavigate();
  const buyCertification = useBuyCertification();

  /* -----------------------------------------------------------
   *  Card click -> open detail page
   *  BUT ignore clicks that originated on the action <Button>.
   * --------------------------------------------------------- */
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button")) return; // Button was clicked -> ignore
    if (!buyCertification.isPending) navigate(`/certifications/${certification.id}`);
  };

  /* -----------------------------------------------------------
   *  Button click -> start / buy exam
   * --------------------------------------------------------- */
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation(); // prevent card onClick
    buyCertification.mutate(certification.id);
  };

  const isFree = certification.price_cents === 0;

  return (
    <Card
      className="overflow-hidden transition-all hover:shadow-lg cursor-pointer"
      onClick={handleCardClick}
    >
      {/* thumbnail */}
      <div className="aspect-video w-full overflow-hidden">
        <img
          src={certification.imageUrl}
          alt={certification.title}
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
      </div>

      {/* header */}
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">{certification.title}</h3>
          <span className="text-sm bg-brand-100 text-brand-700 py-1 px-2 rounded-full">
            {certification.level}
          </span>
        </div>
      </CardHeader>

      {/* description + price */}
      <CardContent>
        <p className="text-muted-foreground mb-4">{certification.description}</p>
        {isFree ? (
          <span className="font-semibold text-lg text-green-600">Free</span>
        ) : (
          <span className="font-semibold text-lg">
            ${(certification.price_cents / 100).toFixed(2)}
          </span>
        )}
      </CardContent>

      {/* action button */}
      <CardFooter>
        <Button
          className="w-full"
          disabled={buyCertification.isPending}
          onClick={handleButtonClick}
        >
          {buyCertification.isPending
            ? "Processing…"
            : isFree
            ? "Start Exam"
            : "Take Exam"}
        </Button>
      </CardFooter>
    </Card>
  );
};
