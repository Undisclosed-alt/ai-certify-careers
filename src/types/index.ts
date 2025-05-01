
export interface User {
  id: string;
  name: string;
  email: string;
  agreedToTerms: boolean;
}

export interface JobRole {
  id: string;
  title: string;
  description: string;
  level: string;
  price: number;
  imageUrl: string;
}

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
  jobRoleId: string;
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
  jobRoleId: string;
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
  jobRoleId: string;
  startedAt: string;
  completedAt: string | null;
  answers: Record<string, string | number>;
}
