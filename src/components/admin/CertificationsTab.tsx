
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';

// Define the schema for certifications
const jobRoleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().min(1, "Description is required"),
  price_cents: z.coerce.number().int().min(0, "Price must be a non-negative number"),
  level: z.string().optional(),
  image_url: z.string().optional(),
});

type JobRoleFormValues = z.infer<typeof jobRoleSchema>;

interface Certification {
  id: string;
  title: string;
  slug: string;
  description: string;
  price_cents: number;
  level: string | null;
  image_url: string | null;
  created_at: string;
}

const CertificationsTab = () => {
  const [jobRoles, setJobRoles] = useState<Certification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentJobRole, setCurrentJobRole] = useState<Certification | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<JobRoleFormValues>({
    resolver: zodResolver(jobRoleSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      price_cents: 0,
      level: '',
      image_url: '',
    },
  });
  
  // Fetch certifications
  const fetchJobRoles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobRoles(data || []);
    } catch (error: any) {
      console.error('Error fetching certifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch certifications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobRoles();
  }, []);

  const handleEditJobRole = (jobRole: Certification) => {
    setCurrentJobRole(jobRole);
    form.reset({
      title: jobRole.title,
      slug: jobRole.slug,
      description: jobRole.description,
      price_cents: jobRole.price_cents,
      level: jobRole.level || '',
      image_url: jobRole.image_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleCreateJobRole = () => {
    setCurrentJobRole(null);
    form.reset({
      title: '',
      slug: '',
      description: '',
      price_cents: 0,
      level: '',
      image_url: '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteJobRole = async (certificationId: string) => {
    try {
      const { error } = await supabase
        .from('job_roles')
        .delete()
        .eq('id', certificationId);

      if (error) throw error;

      // Update the local state optimistically
      setJobRoles((prev) => prev.filter(role => role.id !== certificationId));
      
      setDeleteDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Certification role deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting certification:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete certification',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (values: JobRoleFormValues) => {
    try {
      if (currentJobRole) {
        // Update existing certification
        const { error } = await supabase
          .from('job_roles')
          .update({
            title: values.title,
            slug: values.slug,
            description: values.description,
            price_cents: values.price_cents,
            level: values.level || null,
            image_url: values.image_url || null
          })
          .eq('id', currentJobRole.id);

        if (error) throw error;

        // Update local state optimistically
        setJobRoles((prev) => 
          prev.map(role => 
            role.id === currentJobRole.id 
              ? { ...role, ...values } 
              : role
          )
        );

        // Invalidate any related queries
        queryClient.invalidateQueries({ queryKey: ['jobRoles'] });

        toast({
          title: 'Success',
          description: 'Certification role updated successfully',
        });
        
        setIsDialogOpen(false);
      } else {
        // Create new certification
        const { data, error } = await supabase
          .from('job_roles')
          .insert({
            title: values.title,
            slug: values.slug,
            description: values.description,
            price_cents: values.price_cents,
            level: values.level || null,
            image_url: values.image_url || null
          })
          .select();

        if (error) throw error;

        // Update local state with the new certification
        if (data && data.length > 0) {
          setJobRoles((prev) => [data[0], ...prev]);
        }

        // Invalidate any related queries
        queryClient.invalidateQueries({ queryKey: ['jobRoles'] });

        toast({
          title: 'Success',
          description: 'Certification role created successfully',
        });
        
        setIsDialogOpen(false);
      }
    } catch (error: any) {
      console.error('Error saving certification:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save certification',
        variant: 'destructive',
      });
      // Not closing the dialog on error so user can fix and retry
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Certifications</h2>
        <Button onClick={handleCreateJobRole}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Role
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : jobRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No certifications found
                  </TableCell>
                </TableRow>
              ) : (
                jobRoles.map((jobRole) => (
                  <TableRow key={jobRole.id}>
                    <TableCell className="font-medium">{jobRole.title}</TableCell>
                    <TableCell>{jobRole.slug}</TableCell>
                    <TableCell>{jobRole.level || '-'}</TableCell>
                    <TableCell>
                      {jobRole.price_cents === 0 ? (
                        <Badge variant="success">Free</Badge>
                      ) : (
                        `${(jobRole.price_cents / 100).toFixed(2)} USD`
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleEditJobRole(jobRole)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => {
                          setCurrentJobRole(jobRole);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Certification Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {currentJobRole ? 'Edit Certification' : 'Create New Certification'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Frontend Developer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. frontend-developer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Senior, Junior" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price_cents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (cents)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormDescription>Enter 0 to make this role free.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Certification role description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Certification</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete the certification "{currentJobRole?.title}"? 
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => currentJobRole && handleDeleteJobRole(currentJobRole.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CertificationsTab;
