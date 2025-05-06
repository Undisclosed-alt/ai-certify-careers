import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { Exam, Question, ExamAttempt } from '@/types';
import { saveExamAnswer, completeExamAttempt, evaluateExam } from '@/services/dataService';
import { useToast } from '@/hooks/use-toast';

const ExamPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  
  // Get exam and attempt from location state or redirect
  useEffect(() => {
    if (location.state?.exam && location.state?.attemptId) {
      setExam(location.state.exam);
      setAttemptId(location.state.attemptId);
      setTimeRemaining(location.state.exam.timeLimit * 60); // Convert minutes to seconds
    } else {
      navigate('/jobs');
    }
  }, [location.state, navigate]);
  
  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null) return;
    
    if (timeRemaining <= 0) {
      handleSubmitExam();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeRemaining(prevTime => (prevTime !== null ? prevTime - 1 : null));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining]);
  
  const handleAnswerChange = async (questionId: string, answer: string | number) => {
    // Update local state
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Save to backend
    if (attemptId) {
      try {
        await saveExamAnswer(attemptId, questionId, answer);
      } catch (error) {
        console.error('Failed to save answer:', error);
        toast({
          title: "Error",
          description: "Failed to save your answer. Please check your connection.",
          variant: "destructive"
        });
      }
    }
  };
  
  const goToNextQuestion = () => {
    if (exam && currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleSubmitExam = async () => {
    if (!attemptId || !exam) return;
    
    setIsSubmitting(true);
    
    try {
      // Mark the attempt as completed
      await completeExamAttempt(attemptId);
      
      // Evaluate the exam
      const result = await evaluateExam(attemptId);
      
      // Navigate to the results page
      navigate(`/results/${result.id}`, { state: { result } });
    } catch (error) {
      console.error('Failed to submit exam:', error);
      toast({
        title: "Error",
        description: "Failed to submit your exam. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (!exam || !attemptId) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold mb-2">Loading exam...</h2>
        <p className="text-muted-foreground">
          Please wait while we prepare your certification exam.
        </p>
      </div>
    );
  }
  
  const currentQuestion = exam.questions[currentQuestionIndex];
  const totalQuestions = exam.questions.length;
  const progress = (currentQuestionIndex + 1) / totalQuestions * 100;
  
  // Format time remaining
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Check if all questions are answered
  const answeredQuestions = Object.keys(answers).length;
  const allAnswered = answeredQuestions === totalQuestions;
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <p className="text-muted-foreground">Question {currentQuestionIndex + 1} of {totalQuestions}</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center">
          <div className={`py-1 px-3 rounded-full text-sm font-medium ${
            (timeRemaining || 0) < 300 
              ? 'bg-red-100 text-red-800' 
              : 'bg-brand-100 text-brand-800'
          }`}>
            Time Remaining: {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <Progress value={progress} className="h-2" />
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">
            <span className="text-muted-foreground mr-2">#{currentQuestionIndex + 1}.</span>
            {currentQuestion.text}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentQuestion.type === 'multipleChoice' && currentQuestion.options.length > 0 && (
            <RadioGroup
              value={(answers[currentQuestion.id] as string)?.toString()}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, parseInt(value))}
              className="space-y-3"
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          )}
          
          {(currentQuestion.type === 'openEnded' || currentQuestion.type === 'coding') && (
            <Textarea
              value={(answers[currentQuestion.id] as string) || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder={
                currentQuestion.type === 'coding' 
                  ? 'Write your code here...' 
                  : 'Write your answer here...'
              }
              className="min-h-[200px]"
            />
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            onClick={goToPrevQuestion} 
            variant="outline" 
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentQuestionIndex === totalQuestions - 1 ? (
              <Button 
                onClick={() => setShowConfirmSubmit(true)} 
                variant="default"
              >
                Submit Exam
              </Button>
            ) : (
              <Button onClick={goToNextQuestion}>
                Next
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
      
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Question Type: 
            <span className="ml-1 font-medium capitalize">{currentQuestion.type}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Category: 
            <span className="ml-1 font-medium">{currentQuestion.category}</span>
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <p className="text-sm text-muted-foreground">
            {answeredQuestions} of {totalQuestions} questions answered
          </p>
        </div>
      </div>
      
      {/* Question navigation */}
      <div className="mt-8">
        <h3 className="text-sm font-medium mb-2">Question Navigation:</h3>
        <div className="grid grid-cols-10 gap-2">
          {exam.questions.map((q, index) => (
            <Button
              key={q.id}
              variant={index === currentQuestionIndex ? "default" : answers[q.id] ? "secondary" : "outline"}
              size="sm"
              className="w-full"
              onClick={() => setCurrentQuestionIndex(index)}
            >
              {index + 1}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Submit confirmation dialog */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Submit Exam?</CardTitle>
            </CardHeader>
            <CardContent>
              {!allAnswered && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    You haven't answered all questions yet. 
                    ({answeredQuestions} of {totalQuestions} answered)
                  </AlertDescription>
                </Alert>
              )}
              <p className="mb-4">
                Are you sure you want to submit your exam? Once submitted, you cannot make any changes.
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmSubmit(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitExam}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : 'Submit Exam'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ExamPage;
