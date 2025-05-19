
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { JobRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useExamResults } from '@/hooks/useExamResults';
import { useSubscription } from '@/hooks/useSubscription';

const DashboardPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("certifications");
  
  // Use our custom hooks
  const examResultsQuery = useExamResults();
  const subscriptionQuery = useSubscription();
  
  const isLoading = examResultsQuery.isLoading || subscriptionQuery.isLoading;
  const results = examResultsQuery.data?.results || [];
  const subscription = subscriptionQuery.data?.subscription;
  
  if (examResultsQuery.error) {
    toast({
      title: "Error",
      description: "Failed to load your exam results.",
      variant: "destructive"
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

      <Tabs defaultValue="certifications" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="settings">Account Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="certifications" className="mt-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Your Certifications</h2>
            <p className="text-muted-foreground">View and download your earned certifications.</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="grid gap-6">
              {results.map((result) => (
                <Card key={result.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{result.jobRoleId} Certification</CardTitle>
                        <CardDescription>
                          Completed on {new Date(result.completedAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className={`py-1 px-3 rounded-full text-sm font-medium ${
                        result.passed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.passed ? 'PASSED' : 'FAILED'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Score:</span>
                        <span className="font-semibold">{result.score.toFixed(1)}%</span>
                      </div>
                      {result.ranking && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Ranking:</span>
                          <span className="font-semibold capitalize">{result.ranking} Tier</span>
                        </div>
                      )}
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold mb-2">Feedback:</h4>
                        <p className="text-sm text-muted-foreground">{result.feedback}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="w-full flex flex-col sm:flex-row gap-2">
                      {result.passed && (
                        <Link to={`/certificate/${result.id}`} className="w-full sm:w-auto">
                          <Button variant="default" className="w-full">
                            View Certificate
                          </Button>
                        </Link>
                      )}
                      <Link to={`/results/${result.id}`} className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full">
                          View Detailed Results
                        </Button>
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full w-12 h-12 flex items-center justify-center bg-muted mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-certificate"><path d="M12 13V7"/><path d="M15 10h-6"/><circle cx="12" cy="12" r="10"/></svg>
                </div>
                <h3 className="text-lg font-medium mb-2">No Certifications Yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-sm">
                  You haven't taken any certification exams yet. Start your professional journey today!
                </p>
                <Link to="/jobs">
                  <Button>Browse Certifications</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Manage your account details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Name</h3>
                <p className="p-2 border rounded bg-muted/50">{user?.user_metadata?.full_name || 'Not provided'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1">Email</h3>
                <p className="p-2 border rounded bg-muted/50">{user?.email}</p>
              </div>
              {subscription && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Subscription</h3>
                  <p className="p-2 border rounded bg-muted/50">
                    {subscription.status === 'active' ? 'Active' : 'Inactive'} - 
                    {subscription.current_period_end ? 
                      ` Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}` : 
                      ''}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" disabled>Change Password</Button>
              <Button variant="outline" className="w-full" disabled>Edit Profile</Button>
              <p className="text-xs text-muted-foreground text-center pt-2">
                Profile editing will be available in a future update.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
