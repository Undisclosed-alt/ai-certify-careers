
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface AdminUserOperationParams {
  userId: string;
  makeAdmin: boolean;
}

export function useAdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get all users with admin status
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Since we can't directly query auth.users, we need to use RPC or Edge Function
      // This is a simplified approach using only the profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name');
        
      if (error) throw error;
      return data;
    },
  });
  
  // Update user admin status
  const { mutate: updateAdminStatus } = useMutation({
    mutationFn: async ({ userId, makeAdmin }: AdminUserOperationParams) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role: makeAdmin ? 'admin' : 'user' })
        .eq('id', userId);
        
      if (error) throw error;
      return { userId, role: makeAdmin ? 'admin' : 'user' };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'User Updated',
        description: `User ${data.userId} ${data.role === 'admin' ? 'is now an admin' : 'is no longer an admin'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    },
  });
  
  return {
    users,
    isLoading,
    error,
    updateAdminStatus,
  };
}

export default useAdminUsers;
