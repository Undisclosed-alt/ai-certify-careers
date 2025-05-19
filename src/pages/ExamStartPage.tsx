import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { JobRole, Exam } from '@/types';
import { getJobRoleById, generateExamForJobRole, startExamAttempt } from '@/services/dataService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const ExamStartPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [jobRole, setJobRole] = useState<JobRole | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(true);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const { toast } = useToast();
  
  // Get the job role ID and session ID from the URL
  const searchParams = new URLSearchParams(location.search);
  const roleId = searchParams.get('role');
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    const verifyAndLoadExam = async () => {
      if (!roleId || !sessionId || !user) {
        setError('Missing required information');
        setIsLoading(false);
        setIsVerifyingPayment(false);
        return;
      }
      
      try {
        // Verify payment
        // This will be replaced by our hooks in the future
        const isPaymentValid = await verifyPaymentViaApi(sessionId);
        setIsVerifyingPayment(false);
        
        if (!isPaymentValid) {
          setError('Payment verification failed');
          setIsLoading(false);
          return;
        }
        
        // Load job role
        const role = await getJobRoleById(roleId);
        if (!role) {
          setError('Job role not found');
          setIsLoading(false);
          return;
        }
        
        setJobRole(role);
        
        // Generate exam
        const generatedExam = await generateExamForJobRole(roleId);
        setExam(generatedExam);
        setIsLoading(false);
        
        toast({
          title: "Exam Ready",
          description: "Your certification exam has been generated.",
        });
      } catch (error: any) {
        console.error('Failed to prepare exam:', error);
        setError('Failed to prepare the exam. Please try again.');
        setIsLoading(false);
        setIsVerifyingPayment(false);
      }
    };
    
    verifyAndLoadExam();
  }, [roleId, sessionId, user, toast]);
  
  // Simple method to verify payment - will be replaced by API call
  const verifyPaymentViaApi = async (sessionId: string) => {
    // This is a placeholder for the future API call
    // Currently using the existing function to maintain functionality
    try {
      const result = await fetch('/api/stripe-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).then(res => res.json());
      
      return result.success;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  };
  
  const handleStartExam = async () => {
    if (!user || !exam) return;
    
    setIsGeneratingExam(true);
    
    try {
      // This will be replaced by our hooks in the future
      const examAttempt = await startExamAttempt(user.id, exam.id);
      navigate(`/exam/${examAttempt.id}`, { state: { exam, attemptId: examAttempt.id } });
    } catch (error) {
      console.error('Failed to start exam:', error);
      toast({
        title: "Error",
        description: "Failed to start the exam. Please try again.",
        variant: "destructive"
      });
      setIsGeneratingExam(false);
    }
  };
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold mb-2">
          {isVerifyingPayment ? 'Verifying payment...' : 'Preparing your exam...'}
        </h2>
        <p className="text-muted-foreground">
          This will only take a moment. Please don't close this page.
        </p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-6 flex justify-center">
          <Button onClick={() => navigate('/jobs')}>
            Back to Job Roles
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{jobRole?.title} Certification Exam</CardTitle>
          <CardDescription>Your exam is ready to begin when you are.</CardDescription>
        </CardHeader>
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path></svg>
                    <span>Time Limit: {exam?.timeLimit} minutes</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>
                    <span>Number of Questions: {exam?.questions.length}</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>
                    <span>Passing Score: {exam?.passingScore}%</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Exam Instructions</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
                    <span>Once started, the timer cannot be paused</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
                    <span>Answer all questions to the best of your ability</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
                    <span>Results will be processed immediately after completion</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <Alert>
              <AlertTitle>Ready to begin?</AlertTitle>
              <AlertDescription>
                Make sure you have a stable internet connection and will not be disturbed for the next {exam?.timeLimit} minutes. Click the button below when you're ready to start.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleStartExam} 
            className="w-full"
            disabled={isGeneratingExam}
          >
            {isGeneratingExam ? (
              <>
                <div className="mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Preparing Exam...
              </>
            ) : 'Start Exam Now'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ExamStartPage;
