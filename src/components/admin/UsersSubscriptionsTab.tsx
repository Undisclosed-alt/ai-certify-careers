
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UserSubscription {
  id: string;
  user_id: string;
  email: string;
  plan_id: string;
  status: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  current_period_end: string;
  job_role_title?: string;
}

const UsersSubscriptionsTab = () => {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        // This query requires SECURITY DEFINER function in Supabase to access auth.users
        const { data, error } = await supabase.rpc('get_subscriptions_with_users');

        if (error) throw error;
        
        // Transform the data to match our expected format
        const formattedData: UserSubscription[] = data || [];
        
        setSubscriptions(formattedData);
      } catch (error: any) {
        console.error('Error fetching subscriptions:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch subscriptions data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptions();
  }, [toast]);

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users & Subscriptions</CardTitle>
        <CardDescription>
          View all users with active or past subscriptions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Period Ends</TableHead>
                <TableHead>Job Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No subscriptions found
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">{subscription.email || 'Unknown'}</TableCell>
                    <TableCell>{subscription.plan_id}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          subscription.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : subscription.status === 'trialing'
                            ? 'bg-blue-100 text-blue-800'
                            : subscription.status === 'canceled'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {subscription.status}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(subscription.current_period_end)}</TableCell>
                    <TableCell>{subscription.job_role_title || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default UsersSubscriptionsTab;
