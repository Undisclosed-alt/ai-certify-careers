
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Types
interface JobRole {
  id: string;
  title: string;
}

interface Exam {
  id: string;
  job_role_id: string;
  version: number;
  time_limit_minutes: number;
  passing_score: number;
}

interface Question {
  id: string;
  exam_id: string;
  body: string;
  type: string;
  options: any[] | null;
  correct_answer: string | null;
  category: string | null;
}

// Form schemas
const examSchema = z.object({
  job_role_id: z.string().min(1, "Job role is required"),
  time_limit_minutes: z.coerce.number().int().positive("Time limit must be a positive number"),
  passing_score: z.coerce.number().int().min(0).max(100, "Passing score must be between 0 and 100"),
});

const questionSchema = z.object({
  body: z.string().min(1, "Question body is required"),
  type: z.string().min(1, "Question type is required"),
  category: z.string().optional(),
  options: z.string().optional(),
  correct_answer: z.string().optional(),
});

type ExamFormValues = z.infer<typeof examSchema>;
type QuestionFormValues = z.infer<typeof questionSchema>;

const ExamsQuestionsTab = () => {
  // State
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [selectedJobRoleId, setSelectedJobRoleId] = useState<string | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingJobRoles, setIsLoadingJobRoles] = useState(true);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const { toast } = useToast();

  // Forms
  const examForm = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      job_role_id: '',
      time_limit_minutes: 60,
      passing_score: 70,
    },
  });

  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      body: '',
      type: 'multiple_choice',
      category: '',
      options: '',
      correct_answer: '',
    },
  });

  // Fetch job roles
  useEffect(() => {
    const fetchJobRoles = async () => {
      try {
        const { data, error } = await supabase
          .from('job_roles')
          .select('id, title')
          .order('title');

        if (error) throw error;
        setJobRoles(data || []);
        
        // Select the first job role by default if available
        if (data && data.length > 0 && !selectedJobRoleId) {
          setSelectedJobRoleId(data[0].id);
        }
      } catch (error: any) {
        console.error('Error fetching job roles:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch job roles',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingJobRoles(false);
      }
    };

    fetchJobRoles();
  }, []);

  // Fetch exams when job role changes
  useEffect(() => {
    if (!selectedJobRoleId) return;
    
    const fetchExams = async () => {
      setIsLoadingExams(true);
      setSelectedExam(null);
      setQuestions([]);
      
      try {
        const { data, error } = await supabase
          .from('exams')
          .select('*')
          .eq('job_role_id', selectedJobRoleId)
          .order('version', { ascending: false });

        if (error) throw error;
        setExams(data || []);
      } catch (error: any) {
        console.error('Error fetching exams:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch exams',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingExams(false);
      }
    };

    fetchExams();
  }, [selectedJobRoleId]);

  // Fetch questions when exam changes
  useEffect(() => {
    if (!selectedExam) return;
    
    const fetchQuestions = async () => {
      setIsLoadingQuestions(true);
      
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', selectedExam.id);

        if (error) throw error;
        setQuestions(data || []);
      } catch (error: any) {
        console.error('Error fetching questions:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch questions',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, [selectedExam]);

  // Create new exam version
  const handleCreateExam = () => {
    if (!selectedJobRoleId) return;
    
    // Find the latest version
    let latestVersion = 0;
    if (exams.length > 0) {
      latestVersion = Math.max(...exams.map(exam => exam.version));
    }
    
    examForm.reset({
      job_role_id: selectedJobRoleId,
      time_limit_minutes: 60,
      passing_score: 70,
    });
    
    setIsExamDialogOpen(true);
  };

  // Save exam
  const onSubmitExam = async (values: ExamFormValues) => {
    try {
      // Create a new exam with incremented version
      let latestVersion = 0;
      if (exams.length > 0) {
        latestVersion = Math.max(...exams.map(exam => exam.version));
      }
      
      const newExam = {
        ...values,
        version: latestVersion + 1,
      };
      
      const { data, error } = await supabase
        .from('exams')
        .insert(newExam)
        .select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        // Update local state
        setExams([data[0], ...exams]);
        setSelectedExam(data[0]);
      }
      
      setIsExamDialogOpen(false);
      toast({
        title: 'Success',
        description: `Exam version ${latestVersion + 1} created successfully`,
      });
    } catch (error: any) {
      console.error('Error creating exam:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create exam',
        variant: 'destructive',
      });
    }
  };

  // Handle adding/editing question
  const handleQuestionAction = (question: Question | null = null) => {
    setCurrentQuestion(question);
    
    if (question) {
      // Format options for the form
      const optionsString = question.options 
        ? JSON.stringify(question.options) 
        : '';
        
      questionForm.reset({
        body: question.body,
        type: question.type,
        category: question.category || '',
        options: optionsString,
        correct_answer: question.correct_answer || '',
      });
    } else {
      questionForm.reset({
        body: '',
        type: 'multiple_choice',
        category: '',
        options: '',
        correct_answer: '',
      });
    }
    
    setIsQuestionDialogOpen(true);
  };

  // Save question
  const onSubmitQuestion = async (values: QuestionFormValues) => {
    if (!selectedExam) return;
    
    try {
      // Parse options string to JSON if provided
      let parsedOptions = null;
      if (values.options) {
        try {
          parsedOptions = JSON.parse(values.options);
          if (!Array.isArray(parsedOptions)) {
            throw new Error('Options must be a valid JSON array');
          }
        } catch (e) {
          toast({
            title: 'Invalid options format',
            description: 'Options must be a valid JSON array',
            variant: 'destructive',
          });
          return;
        }
      }
      
      const questionData = {
        exam_id: selectedExam.id,
        body: values.body,
        type: values.type,
        category: values.category || null,
        options: parsedOptions,
        correct_answer: values.correct_answer || null,
      };
      
      if (currentQuestion) {
        // Update existing question
        const { error } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', currentQuestion.id);

        if (error) throw error;
        
        // Update local state
        setQuestions(questions.map(q => 
          q.id === currentQuestion.id ? { ...q, ...questionData } : q
        ));
        
        toast({
          title: 'Success',
          description: 'Question updated successfully',
        });
      } else {
        // Create new question
        const { data, error } = await supabase
          .from('questions')
          .insert(questionData)
          .select();

        if (error) throw error;
        
        if (data && data.length > 0) {
          setQuestions([...questions, data[0]]);
        }
        
        toast({
          title: 'Success',
          description: 'Question added successfully',
        });
      }
      
      setIsQuestionDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving question:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save question',
        variant: 'destructive',
      });
    }
  };

  // Delete question
  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
      
      // Update local state
      setQuestions(questions.filter(q => q.id !== questionId));
      
      toast({
        title: 'Success',
        description: 'Question deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting question:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete question',
        variant: 'destructive',
      });
    }
  };

  if (isLoadingJobRoles) {
    return <div className="flex justify-center p-8">Loading job roles...</div>;
  }

  return (
    <div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Exams & Questions Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <FormLabel>Select Job Role</FormLabel>
              <Select value={selectedJobRoleId || ''} onValueChange={setSelectedJobRoleId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a job role" />
                </SelectTrigger>
                <SelectContent>
                  {jobRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedJobRoleId && (
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Exams
                </h3>
                <Button onClick={handleCreateExam}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create New Version
                </Button>
              </div>
            )}
            
            {isLoadingExams ? (
              <div className="text-center py-4">Loading exams...</div>
            ) : exams.length === 0 ? (
              <div className="text-center py-4">No exams available for this job role.</div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {exams.map((exam) => (
                  <Button
                    key={exam.id}
                    variant={selectedExam?.id === exam.id ? "default" : "outline"}
                    onClick={() => setSelectedExam(exam)}
                  >
                    Version {exam.version}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {selectedExam && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                Questions for Exam Version {selectedExam.version}
              </CardTitle>
              <div className="text-sm text-muted-foreground mt-1">
                Time limit: {selectedExam.time_limit_minutes} minutes | 
                Passing score: {selectedExam.passing_score}%
              </div>
            </div>
            <Button onClick={() => handleQuestionAction()}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingQuestions ? (
              <div className="text-center py-4">Loading questions...</div>
            ) : questions.length === 0 ? (
              <div className="text-center py-4">No questions available for this exam.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="max-w-md truncate">
                        {question.body}
                      </TableCell>
                      <TableCell>{question.type}</TableCell>
                      <TableCell>{question.category || '-'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuestionAction(question)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Exam Dialog */}
      <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Exam Version</DialogTitle>
          </DialogHeader>
          <Form {...examForm}>
            <form onSubmit={examForm.handleSubmit(onSubmitExam)} className="space-y-6">
              <FormField
                control={examForm.control}
                name="time_limit_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Limit (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={examForm.control}
                name="passing_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passing Score (%)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsExamDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentQuestion ? 'Edit Question' : 'Add New Question'}
            </DialogTitle>
          </DialogHeader>
          <Form {...questionForm}>
            <form onSubmit={questionForm.handleSubmit(onSubmitQuestion)} className="space-y-6">
              <FormField
                control={questionForm.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter question text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={questionForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select question type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          <SelectItem value="true_false">True/False</SelectItem>
                          <SelectItem value="short_answer">Short Answer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={questionForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Programming, Design" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={questionForm.control}
                name="options"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Options (JSON array)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='["Option 1", "Option 2", "Option 3"]' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={questionForm.control}
                name="correct_answer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correct Answer</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Correct answer or index" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamsQuestionsTab;
