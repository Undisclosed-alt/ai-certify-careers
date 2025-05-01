import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { ExamResult, JobRole } from '@/types';
import { getExamResultById, getJobRoleById } from '@/services/dataService';
import { useToast } from '@/hooks/use-toast';

const ResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [jobRole, setJobRole] = useState<JobRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchResultDetails = async () => {
      if (!id && !location.state?.result) {
        // No ID in URL and no result in location state
        navigate('/dashboard');
        return;
      }
      
      try {
        // If we have result in state, use that
        let examResult = location.state?.result;
        
        // Otherwise fetch it by ID
        if (!examResult && id) {
          examResult = await getExamResultById(id);
          if (!examResult) {
            toast({
              title: "Error",
              description: "Result not found. Please go back and try again.",
              variant: "destructive"
            });
            navigate('/dashboard');
            return;
          }
        }
        
        setResult(examResult);
        
        // Get job role details
        const role = await getJobRoleById(examResult.jobRoleId);
        setJobRole(role || null);
        
      } catch (error) {
        console.error('Failed to fetch result details:', error);
        toast({
          title: "Error",
          description: "Failed to load your exam results.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResultDetails();
  }, [id, location.state, navigate, toast]);
  
  // Check if the user owns this result
  useEffect(() => {
    if (result && user && result.userId !== user.id) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view this result.",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  }, [result, user, navigate, toast]);
  
  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold mb-2">Loading results...</h2>
        <p className="text-muted-foreground">
          Please wait while we fetch your certification results.
        </p>
      </div>
    );
  }
  
  if (!result || !user) {
    return null; // Should navigate away from this page in useEffect
  }
  
  const getScoreColorClass = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-lime-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };
  
  const getRankingBadgeClass = (ranking: string | null) => {
    if (ranking === 'top') return 'bg-green-100 text-green-800';
    if (ranking === 'mid') return 'bg-amber-100 text-amber-800';
    if (ranking === 'low') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-lime-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Button 
        variant="outline" 
        onClick={() => navigate('/dashboard')}
        className="mb-6"
      >
        &larr; Back to Dashboard
      </Button>
      
      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">{jobRole?.title} Assessment Results</CardTitle>
              <CardDescription>
                Completed on {new Date(result.completedAt).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className={`py-2 px-4 rounded-lg text-lg font-bold ${result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {result.passed ? 'PASSED' : 'FAILED'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Your Score</span>
              <span className={`text-xl font-bold ${getScoreColorClass(result.score)}`}>
                {result.score.toFixed(1)}%
              </span>
            </div>
            <Progress value={result.score} className={`h-3 ${getProgressColor(result.score)}`} />
            <div className="flex justify-between text-xs mt-1">
              <span>0%</span>
              <span className="font-medium">Passing: 70%</span>
              <span>100%</span>
            </div>
          </div>
          
          {result.ranking && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Your Performance Ranking</h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className={`py-2 px-4 rounded-lg font-semibold inline-block ${getRankingBadgeClass(result.ranking)}`}>
                  {result.ranking.toUpperCase()} TIER
                </div>
                <p className="text-muted-foreground">
                  {result.ranking === 'top' && 'You performed among the top candidates for this role.'}
                  {result.ranking === 'mid' && 'You demonstrated good competency for this role.'}
                  {result.ranking === 'low' && 'You met the basic requirements for this role.'}
                </p>
              </div>
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-semibold mb-2">AI Assessment Feedback</h3>
            <Card className="bg-muted/40">
              <CardContent className="pt-6">
                <p className="italic">{result.feedback}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between">
          {result.passed ? (
            <Link to={`/certificate/${result.id}`} className="w-full sm:w-auto">
              <Button className="w-full">View Certificate</Button>
            </Link>
          ) : (
            <div className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(`/jobs/${result.jobRoleId}`)}
              >
                Retake Certification
              </Button>
            </div>
          )}
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full">
              Return to Dashboard
            </Button>
          </Link>
        </CardFooter>
      </Card>
      
      {jobRole && (
        <Card>
          <CardHeader>
            <CardTitle>About {jobRole.title} Certification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{jobRole.description}</p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="font-semibold mb-2">Next Steps</h3>
                {result.passed ? (
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span>Share your certification on LinkedIn and other platforms</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span>Add this certification to your resume</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span>Explore other certification opportunities</span>
                    </li>
                  </ul>
                ) : (
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      <span>Review the feedback and identify areas for improvement</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      <span>Study and practice more in the weaker areas</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      <span>Retake the certification when you're ready</span>
                    </li>
                  </ul>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Additional Resources</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z"></path><path d="m2 10 10 5 10-5"></path></svg>
                    <span>Get personalized learning recommendations</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z"></path><path d="m2 10 10 5 10-5"></path></svg>
                    <span>Browse our career advancement guides</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z"></path><path d="m2 10 10 5 10-5"></path></svg>
                    <span>Explore other certification paths</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link to="/jobs" className="w-full">
              <Button variant="outline" className="w-full">
                Explore More Certifications
              </Button>
            </Link>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default ResultsPage;
