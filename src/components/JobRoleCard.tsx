import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { JobRole } from "@/types";
import { useBuyExam } from "@/hooks/useBuyExam";

interface JobRoleCardProps {
  jobRole: JobRole;
}

export const JobRoleCard: React.FC<JobRoleCardProps> = ({ jobRole }) => {
  const navigate = useNavigate();
  const buyExam = useBuyExam();

  /* -----------------------------------------------------------
   *  Card click -> open detail page
   *  BUT ignore clicks that originated on the action <Button>.
   * --------------------------------------------------------- */
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button")) return; // Button was clicked -> ignore
    if (!buyExam.isPending) navigate(`/jobs/${jobRole.id}`);
  };

  /* -----------------------------------------------------------
   *  Button click -> start / buy exam
   * --------------------------------------------------------- */
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation(); // prevent card onClick
    buyExam.mutate(jobRole.id);
  };

  const isFree = jobRole.price_cents === 0;

  return (
    <Card
      className="overflow-hidden transition-all hover:shadow-lg cursor-pointer"
      onClick={handleCardClick}
    >
      {/* thumbnail */}
      <div className="aspect-video w-full overflow-hidden">
        <img
          src={jobRole.imageUrl}
          alt={jobRole.title}
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
      </div>

      {/* header */}
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">{jobRole.title}</h3>
          <span className="text-sm bg-brand-100 text-brand-700 py-1 px-2 rounded-full">
            {jobRole.level}
          </span>
        </div>
      </CardHeader>

      {/* description + price */}
      <CardContent>
        <p className="text-muted-foreground mb-4">{jobRole.description}</p>
        {isFree ? (
          <span className="font-semibold text-lg text-green-600">Free</span>
        ) : (
          <span className="font-semibold text-lg">
            ${(jobRole.price_cents / 100).toFixed(2)}
          </span>
        )}
      </CardContent>

      {/* action button */}
      <CardFooter>
        <Button
          className="w-full"
          disabled={buyExam.isPending}
          onClick={handleButtonClick}
        >
          {buyExam.isPending
            ? "Processing…"
            : isFree
            ? "Start Exam"
            : "Take Exam"}
        </Button>
      </CardFooter>
    </Card>
  );
};
