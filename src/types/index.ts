import { Tables } from '@/integrations/supabase/types';

export interface User {
  id: string;
  name: string;
  email: string;
  agreedToTerms: boolean;
}

// TODO: Rename database table from job_roles to certifications in future migration
export interface Certification {
  id: string;
  title: string;
  description: string;
  level: string;
  price: number;
  price_cents?: number; // Add this property for direct database value access
  imageUrl: string;
}

// Keep JobRole as an alias for backward compatibility during transition
export type JobRole = Certification;

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOption?: number; 
  type: 'multipleChoice' | 'coding' | 'openEnded';
  category: string;
}

export interface Exam {
  id: string;
  certificationId: string; // TODO: Rename from jobRoleId in future migration
  title: string;
  description: string;
  timeLimit: number; // in minutes
  questions: Question[];
  passingScore: number;
}

export interface ExamResult {
  id: string;
  userId: string;
  examId: string;
  certificationId: string; // TODO: Rename from jobRoleId in future migration
  jobRoleId: string; // Keep for backward compatibility
  score: number;
  passed: boolean;
  ranking: 'top' | 'mid' | 'low' | null;
  feedback: string;
  completedAt: string;
}

export interface ExamAttempt {
  id: string;
  userId: string;
  examId: string;
  certificationId: string; // TODO: Rename from jobRoleId in future migration
  startedAt: string;
  completedAt: string | null;
  answers: Record<string, string | number>;
}

// Type mappings between our app types and Supabase database types
// TODO: Update these mappings when database tables are renamed from job_roles to certifications
export const mapCertificationFromDb = (jobRole: Tables<'job_roles'>): Certification => ({
  id: jobRole.id,
  title: jobRole.title,
  description: jobRole.description,
  level: jobRole.level || '',
  price: jobRole.price_cents / 100, // Convert cents to dollars
  price_cents: jobRole.price_cents, // Add the raw price_cents value
  imageUrl: jobRole.image_url || '',
});

export const mapQuestionFromDb = (question: Tables<'questions'>): Question => ({
  id: question.id,
  text: question.body,
  options: (question.options as any)?.map((option: string) => option) || [],
  correctOption: question.correct_answer ? parseInt(question.correct_answer) : undefined,
  type: mapQuestionType(question.type),
  category: question.category || '',
});

export const mapExamFromDb = (exam: Tables<'exams'>, questions: Question[] = []): Exam => ({
  id: exam.id,
  certificationId: exam.job_role_id, // TODO: Rename from job_role_id in future migration
  title: '', // This would typically come from the certification
  description: '', // This would typically come from the certification
  timeLimit: exam.time_limit_minutes,
  questions,
  passingScore: exam.passing_score,
});

export const mapExamAttemptFromDb = (attempt: Tables<'attempts'>): ExamAttempt => ({
  id: attempt.id,
  userId: attempt.user_id,
  examId: attempt.exam_id,
  certificationId: '', // This would typically be derived from the exam
  startedAt: attempt.started_at,
  completedAt: attempt.completed_at || null,
  answers: (attempt.answers_json as any) || {},
});

export const mapExamResultFromDb = (attempt: Tables<'attempts'>): ExamResult => ({
  id: attempt.id,
  userId: attempt.user_id,
  examId: attempt.exam_id,
  certificationId: '', // This would typically be derived from the exam
  jobRoleId: '', // Keep for backward compatibility
  score: (attempt.score_json as any)?.score || 0,
  passed: attempt.status === 'passed',
  ranking: attempt.rank as 'top' | 'mid' | 'low' | null,
  feedback: (attempt.score_json as any)?.feedback || '',
  completedAt: attempt.completed_at || '',
});

// Helper function to map question types
const mapQuestionType = (dbType: string): 'multipleChoice' | 'coding' | 'openEnded' => {
  switch (dbType) {
    case 'mcq':
      return 'multipleChoice';
    case 'coding':
      return 'coding';
    case 'free':
      return 'openEnded';
    default:
      return 'multipleChoice';
  }
};
