
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';

interface RequireAdminProps {
  children: ReactNode;
}

const RequireAdmin = ({ children }: RequireAdminProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsCheckingRole(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        setIsAdmin(data.role === 'admin');
      } catch (error: any) {
        console.error('Error checking admin status:', error);
        toast({
          title: 'Error',
          description: 'Could not verify admin privileges',
          variant: 'destructive',
        });
        setIsAdmin(false);
      } finally {
        setIsCheckingRole(false);
      }
    };

    if (user) {
      checkAdminRole();
    } else {
      setIsCheckingRole(false);
    }
  }, [user, toast]);

  if (isLoading || isCheckingRole) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If user is not an admin, redirect to home
  if (!isAdmin) {
    toast({
      title: 'Access Denied',
      description: 'You do not have administrator privileges',
      variant: 'destructive',
    });
    return <Navigate to="/" replace />;
  }

  // User is an admin, render children
  return <>{children}</>;
};

export default RequireAdmin;
