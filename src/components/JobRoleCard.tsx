
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { JobRole } from '@/types';
import { useBuyExam } from '@/hooks/useBuyExam';

interface JobRoleCardProps {
  jobRole: JobRole;
}

export const JobRoleCard = ({ jobRole }: JobRoleCardProps) => {
  const navigate = useNavigate();
  const buyExam = useBuyExam();
  
  const handleCardClick = () => {
    // Skip navigation if the buy exam mutation is in progress
    if (!buyExam.isPending) {
      navigate(`/jobs/${jobRole.id}`);
    }
  };

  return (
    <Card 
      className="overflow-hidden transition-all hover:shadow-lg cursor-pointer" 
      onClick={handleCardClick}
    >
      <div className="aspect-video w-full overflow-hidden">
        <img 
          src={jobRole.imageUrl} 
          alt={jobRole.title} 
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
      </div>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">{jobRole.title}</h3>
          <span className="text-sm bg-brand-100 text-brand-700 py-1 px-2 rounded-full">
            {jobRole.level}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{jobRole.description}</p>
        <div className="flex items-center justify-between">
          {jobRole.price_cents === 0 ? (
            <span className="font-semibold text-lg text-green-600">Free</span>
          ) : (
            <span className="font-semibold text-lg">${(jobRole.price_cents / 100).toFixed(2)}</span>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full"
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click event
            buyExam.mutate(jobRole.id);
          }}
          disabled={buyExam.isPending}
        >
          {buyExam.isPending ? (
            <span className="flex items-center">
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"></span>
              Processing...
            </span>
          ) : (
            jobRole.price_cents === 0 ? 'Start Exam' : 'View Details'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
