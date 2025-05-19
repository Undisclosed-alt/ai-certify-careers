
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { ExamResult } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useExamResults } from '@/hooks/useExamResults';
import { useSubscription } from '@/hooks/useSubscription';

const DashboardPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: results, isLoading: resultsLoading } = useExamResults();
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  
  const handleShareCertificate = () => {
    // Implementation would share the certificate via social media or email
    setIsShareMenuOpen(false);
    toast({
      title: "Share coming soon",
      description: "Sharing certificates will be available in a future update.",
    });
  };
  
  const handleDownloadCertificate = () => {
    // Implementation would generate and download a PDF certificate
    toast({
      title: "Download initiated",
      description: "Your certificate is being prepared for download.",
    });
  }
  
  // Get user's name from user metadata or email
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  
  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {userName}!</p>
        </div>
        <Link to="/jobs">
          <Button>Take New Certification</Button>
        </Link>
      </div>
      
      {subscription && (
        <Card className="mb-8 bg-gradient-to-r from-brand-50 to-blue-50 border-brand-100">
          <CardHeader>
            <CardTitle className="text-lg">Active Subscription</CardTitle>
            <CardDescription>
              {subscription.status === 'active' ? 'Your subscription is active.' : 'Your subscription needs attention.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>Plan: Professional ({subscription.plan_id})</p>
              <p>Renews: {new Date(subscription.current_period_end).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <h2 className="text-2xl font-semibold mb-4">Your Certifications</h2>
      {resultsLoading ? (
        <p>Loading your certifications...</p>
      ) : results && results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((result: ExamResult) => (
            <Card key={result.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{result.jobRoleId} Certification</CardTitle>
                    <CardDescription>
                      Completed on {new Date(result.completedAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={result.passed ? "success" : "destructive"}>
                    {result.passed ? "Passed" : "Failed"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Score</span>
                    <span className="text-sm font-medium">{result.score.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        result.passed 
                          ? "bg-gradient-to-r from-green-400 to-blue-500" 
                          : "bg-red-400"
                      }`} 
                      style={{ width: `${result.score}%` }}
                    ></div>
                  </div>
                </div>
                
                {result.ranking && (
                  <Badge variant="outline" className="capitalize">
                    {result.ranking} Tier
                  </Badge>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t bg-muted/50 px-6 py-3">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/results/${result.id}`}>
                    View Details
                  </Link>
                </Button>
                {result.passed && (
                  <Button variant="secondary" size="sm" asChild>
                    <Link to={`/certificate/${result.id}`}>
                      View Certificate
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No certifications yet</CardTitle>
            <CardDescription>
              Take your first certification exam to get started.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link to="/jobs">
              <Button>Browse Certifications</Button>
            </Link>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
