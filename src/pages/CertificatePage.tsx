import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { ExamResult, Certification } from '@/types';
import { getExamResultById, getJobRoleById } from '@/services/dataService';
import { useToast } from '@/hooks/use-toast';

const CertificatePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [jobRole, setJobRole] = useState<Certification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Get user's name from user metadata or email
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  
  useEffect(() => {
    const fetchCertificateDetails = async () => {
      if (!id) return;
      
      try {
        const examResult = await getExamResultById(id);
        if (!examResult) {
          toast({
            title: "Certificate Not Found",
            description: "The requested certificate could not be found.",
            variant: "destructive"
          });
          navigate('/dashboard');
          return;
        }
        
        if (!examResult.passed) {
          toast({
            title: "No Certificate Available",
            description: "Certificates are only available for passed exams.",
            variant: "destructive"
          });
          navigate('/dashboard');
          return;
        }
        
        setResult(examResult);
        
        // Get certification details
        const role = await getJobRoleById(examResult.certificationId);
        setJobRole(role || null);
        
      } catch (error) {
        console.error('Failed to fetch certificate details:', error);
        toast({
          title: "Error",
          description: "Failed to load the certificate.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCertificateDetails();
  }, [id, navigate, toast]);
  
  // Check if the user owns this certificate
  useEffect(() => {
    if (result && user && result.userId !== user.id) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view this certificate.",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  }, [result, user, navigate, toast]);
  
  const handleDownload = () => {
    // In a real app, we'd generate a PDF certificate here
    // For now, we'll just simulate a download delay
    toast({
      title: "Certificate Download",
      description: "Your certificate is being prepared for download.",
    });
    
    setTimeout(() => {
      toast({
        title: "Download Complete",
        description: "Your certificate has been downloaded.",
      });
    }, 2000);
  };
  
  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold mb-2">Loading certificate...</h2>
        <p className="text-muted-foreground">
          Please wait while we prepare your certificate.
        </p>
      </div>
    );
  }
  
  if (!result || !jobRole || !user) {
    return null; // Should navigate away from this page in useEffect
  }
  
  const formattedDate = new Date(result.completedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Generate a certificate ID
  const certificateId = `CERT-${result.id.substring(0, 8).toUpperCase()}`;
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
        >
          &larr; Back to Dashboard
        </Button>
        <Button onClick={handleDownload}>
          Download Certificate
        </Button>
      </div>
      
      <div className="certificate bg-white border-2 border-gray-200 rounded-lg p-8 shadow-lg mb-8">
        <div className="relative">
          {/* Certificate header */}
          <div className="text-center mb-8">
            <div className="font-bold text-2xl text-brand-600 mb-2">Career.AI</div>
            <div className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Certificate of Achievement</div>
            <div className="h-1 w-32 bg-gradient-to-r from-brand-500 to-teal-500 mx-auto"></div>
          </div>
          
          {/* Certificate body */}
          <div className="text-center mb-8">
            <p className="text-lg text-gray-600 mb-6">This certifies that</p>
            <p className="text-3xl font-bold text-gray-800 mb-6">{userName}</p>
            <p className="text-lg text-gray-600 mb-6">has successfully completed the</p>
            <p className="text-2xl font-bold text-gray-800 mb-2">{jobRole.title}</p>
            <p className="text-xl text-gray-700 mb-6">Certification Exam</p>
            <p className="text-lg text-gray-600 mb-2">with a score of</p>
            <p className="text-2xl font-bold text-brand-600 mb-6">{result.score.toFixed(1)}%</p>
            <p className="text-lg text-gray-600 mb-6">
              {result.ranking && (
                <span className="font-semibold capitalize">{result.ranking} Tier</span>
              )}
            </p>
            
            <div className="flex justify-between items-center max-w-md mx-auto mt-12">
              <div className="text-center">
                <div className="h-px w-40 bg-gray-400 mb-2"></div>
                <p className="font-semibold">Career.AI</p>
              </div>
              <div className="text-center">
                <div className="h-px w-40 bg-gray-400 mb-2"></div>
                <p>{formattedDate}</p>
              </div>
            </div>
          </div>
          
          {/* Certificate footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">Certificate ID: {certificateId}</p>
            <p className="text-sm text-gray-500 mt-1">Verify at career.ai/verify/{certificateId}</p>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-8 right-8">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-500/20">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.287 15.9606C19.3467 16.285 19.5043 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4243 16.365 19.2667 16.0406 19.207C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.287C7.71502 19.3467 7.41568 19.5043 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.57568 16.6643 4.73326 16.365 4.79303 16.0406C4.85281 15.7162 4.81309 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73309 8.69838 4.77281 8.36381 4.71303 8.03941C4.65326 7.71502 4.49568 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.57568 7.63502 4.73326 7.95941 4.79303C8.28381 4.85281 8.61838 4.81309 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73309 15.6362 4.77281 15.9606 4.71303C16.285 4.65326 16.5843 4.49568 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4243 7.33568 19.2667 7.63502 19.207 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <div className="absolute bottom-8 left-8">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-teal-500/20">
              <path d="M21 16V8.00002C20.9996 7.6493 20.9071 7.30483 20.7315 7.00119C20.556 6.69754 20.3037 6.44539 20 6.27002L13 2.27002C12.696 2.09449 12.3511 2.00208 12 2.00208C11.6489 2.00208 11.304 2.09449 11 2.27002L4 6.27002C3.69626 6.44539 3.44398 6.69754 3.26846 7.00119C3.09294 7.30483 3.00036 7.6493 3 8.00002V16C3.00036 16.3508 3.09294 16.6952 3.26846 16.9989C3.44398 17.3025 3.69626 17.5547 4 17.73L11 21.73C11.304 21.9056 11.6489 21.998 12 21.998C12.3511 21.998 12.696 21.9056 13 21.73L20 17.73C20.3037 17.5547 20.556 17.3025 20.7315 16.9989C20.9071 16.6952 20.9996 16.3508 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.27002 6.96002L12 12.01L20.73 6.96002" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
      
      <Card className="mb-8 shadow-md">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Certificate Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Certificate ID</p>
                <p className="font-medium">{certificateId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Issue Date</p>
                <p className="font-medium">{formattedDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Certification</p>
                <p className="font-medium">{jobRole.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recipient</p>
                <p className="font-medium">{userName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score</p>
                <p className="font-medium">{result.score.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ranking</p>
                <p className="font-medium capitalize">{result.ranking} Tier</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      <div className="flex flex-col md:flex-row gap-4">
        <Button variant="default" onClick={handleDownload} className="flex-1">
          Download as PDF
        </Button>
        <Button variant="outline" onClick={() => navigator.clipboard.writeText(`career.ai/verify/${certificateId}`)} className="flex-1">
          Copy Verification Link
        </Button>
      </div>
    </div>
  );
};

export default CertificatePage;
