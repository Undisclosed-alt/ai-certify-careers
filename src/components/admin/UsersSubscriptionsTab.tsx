import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Fix for the type issue - make sure never[] accepts strings
type SubscriptionWithUser = {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  status: string;
  plan_id: string;
  current_period_end: string;
  email?: string;
  full_name?: string;
};

const UsersSubscriptionsTab = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      // Call our edge function to get subscriptions with user data
      const { data, error } = await supabase.functions.invoke('get-subscriptions-with-users');

      if (error) throw error;

      // Fix the type issue by properly typing the data
      setSubscriptions(data as SubscriptionWithUser[]);
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch subscriptions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>User Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading subscriptions...</div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-4">No subscriptions found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>{sub.full_name || sub.email || sub.user_id}</TableCell>
                    <TableCell>{sub.status}</TableCell>
                    <TableCell>{sub.plan_id}</TableCell>
                    <TableCell>{new Date(sub.current_period_end).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersSubscriptionsTab;
