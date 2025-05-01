
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { JobRole } from '@/types';
import { getJobRoleById } from '@/services/dataService';
import { useAuth } from '@/contexts/AuthContext';
import { createCheckoutSession } from '@/services/paymentService';
import { useToast } from '@/hooks/use-toast';

const JobDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [jobRole, setJobRole] = useState<JobRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchJobRole = async () => {
      if (!id) return;
      try {
        const role = await getJobRoleById(id);
        if (role) {
          setJobRole(role);
        }
      } catch (error) {
        console.error('Failed to fetch job role:', error);
        toast({
          title: "Error",
          description: "Failed to load job role details.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobRole();
  }, [id, toast]);

  const handleTakeExam = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in or sign up to take this certification exam.",
        variant: "default"
      });
      navigate('/login', { state: { from: `/jobs/${id}` } });
      return;
    }

    if (!jobRole) return;

    setIsProcessingPayment(true);
    try {
      // Create a checkout session and get redirect URL
      const { redirectUrl } = await createCheckoutSession(
        jobRole,
        user.id,
        `${window.location.origin}/exam/start`, // Success URL
        `${window.location.origin}/jobs/${id}` // Cancel URL
      );
      
      // Redirect to checkout
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('Payment process failed:', error);
      toast({
        title: "Payment Process Failed",
        description: "There was an error initiating the payment process. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
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
          <Button onClick={() => navigate('/jobs')}>
            Back to Job Roles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/jobs')}
            className="mb-6"
          >
            &larr; Back to Job Roles
          </Button>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3">
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={jobRole.imageUrl} 
                  alt={jobRole.title} 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            <div className="md:w-2/3">
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-3xl font-bold">{jobRole.title}</h1>
                <span className="bg-brand-100 text-brand-700 py-1 px-3 rounded-full text-sm">
                  {jobRole.level}
                </span>
              </div>
              <p className="text-lg text-muted-foreground mb-6">{jobRole.description}</p>
              <div className="bg-muted/50 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Certification Price</p>
                    <p className="text-2xl font-bold">${jobRole.price.toFixed(2)}</p>
                  </div>
                  <Button 
                    size="lg" 
                    onClick={handleTakeExam}
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? (
                      <>
                        <div className="mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : 'Take Certification Exam'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Certification Details</h2>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Online AI-powered assessment</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>60-minute time limit</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Combination of multiple-choice and open-ended questions</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Instant results and detailed feedback</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Downloadable certificate upon passing</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Skills Assessed</h2>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {jobRole.title.includes('Frontend') && (
                  <>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m16 12-4 4-4-4m4-4v8"></path></svg>
                      <span>HTML, CSS, and JavaScript fundamentals</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m16 12-4 4-4-4m4-4v8"></path></svg>
                      <span>Responsive design principles</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m16 12-4 4-4-4m4-4v8"></path></svg>
                      <span>CSS frameworks and preprocessors</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m16 12-4 4-4-4m4-4v8"></path></svg>
                      <span>Basic JavaScript frameworks (React, Vue, Angular)</span>
                    </li>
                  </>
                )}
                {jobRole.title.includes('Full Stack') && (
                  <>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m16 12-4 4-4-4m4-4v8"></path></svg>
                      <span>Frontend development (HTML, CSS, JavaScript)</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m16 12-4 4-4-4m4-4v8"></path></svg>
                      <span>Backend development (Node.js, Python, etc.)</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m16 12-4 4-4-4m4-4v8"></path></svg>
                      <span>Database design and management</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m16 12-4 4-4-4m4-4v8"></path></svg>
                      <span>API development and integration</span>
                    </li>
                  </>
                )}
                {jobRole.title.includes('DevOps') && (
                  <>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m16 12-4 4-4-4m4-4v8"></path></svg>
                      <span>CI/CD pipelines and workflow automation</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m16 12-4 4-4-4m4-4v8"></path></svg>
                      <span>Container orchestration (Docker, Kubernetes)</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m16 12-4 4-4-4m4-4v8"></path></svg>
                      <span>Infrastructure as Code (IaC)</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m16 12-4 4-4-4m4-4v8"></path></svg>
                      <span>Cloud platforms (AWS, Azure, GCP)</span>
                    </li>
                  </>
                )}
                {jobRole.title.includes('Data Scientist') && (
                  <>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m16 12-4 4-4-4m4-4v8"></path></svg>
                      <span>Statistical analysis and modeling</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m16 12-4 4-4-4m4-4v8"></path></svg>
                      <span>Machine learning algorithms</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m16 12-4 4-4-4m4-4v8"></path></svg>
                      <span>Data preprocessing and feature engineering</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m16 12-4 4-4-4m4-4v8"></path></svg>
                      <span>Programming in Python or R</span>
                    </li>
                  </>
                )}
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m16 12-4 4-4-4m4-4v8"></path></svg>
                  <span>Problem-solving and critical thinking</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-500 mr-2 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m16 12-4 4-4-4m4-4v8"></path></svg>
                  <span>Industry best practices</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Why Get Certified?</h2>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Getting certified for the {jobRole.title} role offers numerous benefits:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Career Advancement</h3>
                  <p className="text-muted-foreground">
                    Demonstrate your skills to potential employers and stand out from other candidates in the job market.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Skill Validation</h3>
                  <p className="text-muted-foreground">
                    Get objective validation of your knowledge and expertise from our advanced AI evaluation system.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Professional Development</h3>
                  <p className="text-muted-foreground">
                    Identify your strengths and areas for improvement with detailed feedback to guide your learning journey.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Industry Recognition</h3>
                  <p className="text-muted-foreground">
                    Our certifications are designed to align with industry standards and employer expectations.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleTakeExam} 
                className="w-full"
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : 'Take Certification Exam Now'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;
