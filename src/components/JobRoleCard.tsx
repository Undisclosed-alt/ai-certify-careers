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

export const JobRoleCard = ({ jobRole }: JobRoleCardProps) => {
  const navigate = useNavigate();
  const buyExam = useBuyExam();

  /** If user clicks on the empty card area, open the details page.
   *  Skip when a Buy/Start mutation is in progress. */
  const handleCardClick = () => {
    if (!buyExam.isPending) {
      navigate(`/jobs/${jobRole.id}`);
    }
  };

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
        <div className="flex items-center justify-between">
          {jobRole.price_cents === 0 ? (
            <span className="font-semibold text-lg text-green-600">Free</span>
          ) : (
            <span className="font-semibold text-lg">
              ${(jobRole.price_cents / 100).toFixed(2)}
            </span>
          )}
        </div>
      </CardContent>

      {/* action button */}
      <CardFooter>
        <Button
          className="w-full"
          disabled={buyExam.isPending}
          onClick={(e) => {
            // stop the card's click & any default link behaviour
            e.stopPropagation();
            e.preventDefault();
            buyExam.mutate(jobRole.id);
          }}
        >
          {buyExam.isPending ? (
            <span className="flex items-center">
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
              Processing…
            </span>
          ) : jobRole.price_cents === 0 ? (
            "Start Exam"
          ) : (
            "Buy & Start"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
