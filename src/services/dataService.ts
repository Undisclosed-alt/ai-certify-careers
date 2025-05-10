import { supabase } from '@/integrations/supabase/client';
import { JobRole, Exam, Question, ExamAttempt, ExamResult, mapJobRoleFromDb, mapExamFromDb, mapQuestionFromDb, mapExamAttemptFromDb, mapExamResultFromDb } from '@/types';

// Mock data for job roles
const jobRoles: JobRole[] = [
  {
    id: 'role-1',
    title: 'Junior Frontend Developer',
    description: 'Entry-level position focused on implementing user interfaces with HTML, CSS, and JavaScript.',
    level: 'Entry Level',
    price: 59.99,
    imageUrl: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?auto=format&fit=crop&w=200&h=200'
  },
  {
    id: 'role-2',
    title: 'Full Stack Developer',
    description: 'Mid-level role requiring proficiency in both frontend and backend technologies.',
    level: 'Mid Level',
    price: 89.99,
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=200&h=200'
  },
  {
    id: 'role-3',
    title: 'DevOps Engineer',
    description: 'Senior role focused on CI/CD pipelines, infrastructure automation, and cloud technologies.',
    level: 'Senior Level',
    price: 119.99,
    imageUrl: 'https://images.unsplash.com/photo-1607743386760-88ac62b89b8a?auto=format&fit=crop&w=200&h=200'
  },
  {
    id: 'role-4',
    title: 'Data Scientist',
    description: 'Specialized role focusing on data analysis, machine learning, and statistical modeling.',
    level: 'Specialized',
    price: 149.99,
    imageUrl: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=200&h=200'
  }
];

// Store for user's exam attempts and results
let examAttempts: ExamAttempt[] = [];
let examResults: ExamResult[] = [];

// Get all job roles
export const getJobRoles = async (): Promise<JobRole[]> => {
  try {
    const { data: jobRoles, error } = await supabase
      .from('job_roles')
      .select('*');

    if (error) {
      console.error('Error fetching job roles:', error);
      throw error;
    }

    return jobRoles.map(mapJobRoleFromDb);
  } catch (error) {
    console.error('Failed to fetch job roles:', error);
    throw error;
  }
};

// Get a specific job role by id
export const getJobRoleById = async (id: string): Promise<JobRole | null> => {
  try {
    const { data: jobRole, error } = await supabase
      .from('job_roles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return null;
      }
      console.error('Error fetching job role:', error);
      throw error;
    }

    return mapJobRoleFromDb(jobRole);
  } catch (error) {
    console.error('Failed to fetch job role:', error);
    throw error;
  }
};

// Get exam for a job role
export const getExamForJobRole = async (jobRoleId: string): Promise<Exam | null> => {
  try {
    // Get the exam
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('job_role_id', jobRoleId)
      .single();

    if (examError) {
      if (examError.code === 'PGRST116') { // Record not found
        return null;
      }
      console.error('Error fetching exam:', examError);
      throw examError;
    }

    // Get the questions for this exam
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', exam.id);

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      throw questionsError;
    }

    const mappedQuestions = questions.map(mapQuestionFromDb);
    return mapExamFromDb(exam, mappedQuestions);
  } catch (error) {
    console.error('Failed to fetch exam:', error);
    throw error;
  }
};

// Get exam attempt by id
export const getExamAttemptById = async (attemptId: string): Promise<ExamAttempt | null> => {
  try {
    const { data: attempt, error } = await supabase
      .from('attempts')
      .select('*')
      .eq('id', attemptId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return null;
      }
      console.error('Error fetching exam attempt:', error);
      throw error;
    }

    return mapExamAttemptFromDb(attempt);
  } catch (error) {
    console.error('Failed to fetch exam attempt:', error);
    throw error;
  }
};

// Get exam result by attempt id
export const getExamResultById = async (attemptId: string): Promise<ExamResult | null> => {
  try {
    const { data: attempt, error } = await supabase
      .from('attempts')
      .select('*, exams!inner(job_role_id)')
      .eq('id', attemptId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching exam result:', error);
      throw error;
    }

    if (!attempt) {
      return null;
    }

    const result = mapExamResultFromDb(attempt);
    // Set the jobRoleId from the joined exam data
    result.jobRoleId = (attempt.exams as any).job_role_id;
    
    return result;
  } catch (error) {
    console.error('Failed to fetch exam result:', error);
    throw error;
  }
};

// Get user's exam attempts
export const getUserExamAttempts = async (userId: string): Promise<ExamAttempt[]> => {
  try {
    const { data: attempts, error } = await supabase
      .from('attempts')
      .select('*, exams!inner(job_role_id)')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user exam attempts:', error);
      throw error;
    }

    return attempts.map(attempt => {
      const mappedAttempt = mapExamAttemptFromDb(attempt);
      // Set the jobRoleId from the joined exam data
      mappedAttempt.jobRoleId = (attempt.exams as any).job_role_id;
      return mappedAttempt;
    });
  } catch (error) {
    console.error('Failed to fetch user exam attempts:', error);
    throw error;
  }
};

// Start an exam attempt
export const startExamAttempt = async (userId: string, examId: string): Promise<ExamAttempt> => {
  try {
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('job_role_id')
      .eq('id', examId)
      .single();

    if (examError) {
      console.error('Error fetching exam:', examError);
      throw examError;
    }

    const { data: attempt, error } = await supabase
      .from('attempts')
      .insert({
        user_id: userId,
        exam_id: examId,
        started_at: new Date().toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting exam attempt:', error);
      throw error;
    }

    const mappedAttempt = mapExamAttemptFromDb(attempt);
    mappedAttempt.jobRoleId = exam.job_role_id;
    
    return mappedAttempt;
  } catch (error) {
    console.error('Failed to start exam attempt:', error);
    throw error;
  }
};

// Submit exam answers
export const submitExamAnswers = async (
  attemptId: string, 
  answers: Record<string, string | number>
): Promise<ExamResult> => {
  try {
    // Call our edge function to grade the answers
    const { data, error } = await supabase.functions.invoke('exam-grade', {
      body: { attemptId, answers }
    });

    if (error) {
      console.error('Error grading exam:', error);
      throw error;
    }

    // Fetch the updated attempt with the results
    const { data: attempt, error: fetchError } = await supabase
      .from('attempts')
      .select('*, exams!inner(job_role_id)')
      .eq('id', attemptId)
      .single();

    if (fetchError) {
      console.error('Error fetching graded attempt:', fetchError);
      throw fetchError;
    }

    const result = mapExamResultFromDb(attempt);
    result.jobRoleId = (attempt.exams as any).job_role_id;
    
    return result;
  } catch (error) {
    console.error('Failed to submit exam answers:', error);
    throw error;
  }
};

// Get certificate by attempt id
export const getCertificateByAttemptId = async (attemptId: string): Promise<string | null> => {
  try {
    // Call our edge function to generate the certificate if it doesn't exist
    const { data, error } = await supabase.functions.invoke('certificate-generate', {
      body: { attemptId }
    });

    if (error) {
      console.error('Error generating certificate:', error);
      throw error;
    }

    return data.pdfUrl;
  } catch (error) {
    console.error('Failed to get certificate:', error);
    throw error;
  }
};

// Dynamically generate exam questions for a job role
export const generateExamForJobRole = async (jobRoleId: string): Promise<Exam> => {
  const role = await getJobRoleById(jobRoleId);
  if (!role) throw new Error('Job role not found');
  
  // In a real app, this would call OpenAI to generate questions
  // For now, we'll use predefined questions based on role
  
  const questions: Question[] = [];
  
  // Generic questions for all roles
  questions.push(
    {
      id: `q-${jobRoleId}-1`,
      text: 'What is the primary goal of responsive web design?',
      options: [
        'To make websites load faster on mobile devices',
        'To create a layout that adjusts to different screen sizes and devices',
        'To simplify the website navigation for mobile users',
        'To reduce the amount of content displayed on small screens'
      ],
      type: 'multipleChoice',
      category: 'Web Development'
    },
    {
      id: `q-${jobRoleId}-2`,
      text: 'Which of the following is NOT a JavaScript framework or library?',
      options: [
        'Angular',
        'React',
        'Symfony',
        'Vue.js'
      ],
      type: 'multipleChoice',
      category: 'JavaScript'
    }
  );
  
  // Role-specific questions
  if (role.title.includes('Frontend')) {
    questions.push(
      {
        id: `q-${jobRoleId}-3`,
        text: 'Explain how CSS flexbox helps with layout design and when you would use it.',
        options: [],
        type: 'openEnded',
        category: 'CSS'
      },
      {
        id: `q-${jobRoleId}-4`,
        text: 'What is the difference between == and === in JavaScript?',
        options: [
          'They are identical in behavior',
          '== checks value equality, === checks value and type equality',
          '=== checks value equality, == checks value and type equality',
          '== is for strings, === is for numbers'
        ],
        type: 'multipleChoice',
        category: 'JavaScript'
      }
    );
  } else if (role.title.includes('Full Stack')) {
    questions.push(
      {
        id: `q-${jobRoleId}-3`,
        text: 'What is the purpose of an ORM (Object-Relational Mapping)?',
        options: [
          'To display data in a graphical form',
          'To map database tables to application objects',
          'To analyze data for insights',
          'To compress data for faster transmission'
        ],
        type: 'multipleChoice',
        category: 'Backend'
      },
      {
        id: `q-${jobRoleId}-4`,
        text: 'Create a function that fetches data from an API and handles errors appropriately.',
        options: [],
        type: 'coding',
        category: 'API Integration'
      }
    );
  } else if (role.title.includes('DevOps')) {
    questions.push(
      {
        id: `q-${jobRoleId}-3`,
        text: 'What is the benefit of using infrastructure as code (IaC)?',
        options: [
          'It makes deploying infrastructure changes faster and more reliable',
          'It reduces the need for security measures',
          'It eliminates the need for server hardware',
          'It prevents any changes to the infrastructure'
        ],
        type: 'multipleChoice',
        category: 'Infrastructure'
      },
      {
        id: `q-${jobRoleId}-4`,
        text: 'Describe your approach to implementing a CI/CD pipeline for a microservices architecture.',
        options: [],
        type: 'openEnded',
        category: 'CI/CD'
      }
    );
  } else if (role.title.includes('Data Scientist')) {
    questions.push(
      {
        id: `q-${jobRoleId}-3`,
        text: 'Which of the following is NOT a common method for handling missing data?',
        options: [
          'Imputation with mean or median values',
          'Deleting rows with missing values',
          'Using algorithm-specific methods',
          'Replacing all missing values with a constant like 999'
        ],
        type: 'multipleChoice',
        category: 'Data Preprocessing'
      },
      {
        id: `q-${jobRoleId}-4`,
        text: 'Explain the difference between supervised and unsupervised learning, including examples of algorithms for each.',
        options: [],
        type: 'openEnded',
        category: 'Machine Learning'
      }
    );
  }
  
  // More generic questions for all roles
  questions.push(
    {
      id: `q-${jobRoleId}-5`,
      text: 'What is version control and why is it important in software development?',
      options: [
        'A system that records changes to files over time, allowing teams to collaborate and track history',
        'A system that ensures all software versions are compatible with each other',
        'A methodology for releasing software updates according to a schedule',
        'A way of checking that code meets quality standards before deployment'
      ],
      type: 'multipleChoice',
      category: 'Development Practices'
    },
    {
      id: `q-${jobRoleId}-6`,
      text: 'Explain your approach to debugging a complex technical issue.',
      options: [],
      type: 'openEnded',
      category: 'Problem Solving'
    }
  );
  
  return {
    id: `exam-${jobRoleId}`,
    jobRoleId,
    title: `${role.title} Certification Exam`,
    description: `Comprehensive assessment for ${role.title} position. The exam evaluates technical knowledge, problem-solving abilities, and best practices relevant to the role.`,
    timeLimit: 60, // 60 minutes
    questions,
    passingScore: 70  // 70% to pass
  };
};

export const saveExamAnswer = (
  attemptId: string, 
  questionId: string, 
  answer: string | number
): Promise<ExamAttempt> => {
  const attemptIndex = examAttempts.findIndex(a => a.id === attemptId);
  if (attemptIndex === -1) throw new Error('Exam attempt not found');
  
  const updatedAttempt = {
    ...examAttempts[attemptIndex],
    answers: {
      ...examAttempts[attemptIndex].answers,
      [questionId]: answer
    }
  };
  
  examAttempts[attemptIndex] = updatedAttempt;
  return Promise.resolve(updatedAttempt);
};

export const completeExamAttempt = (attemptId: string): Promise<ExamAttempt> => {
  const attemptIndex = examAttempts.findIndex(a => a.id === attemptId);
  if (attemptIndex === -1) throw new Error('Exam attempt not found');
  
  const updatedAttempt = {
    ...examAttempts[attemptIndex],
    completedAt: new Date().toISOString()
  };
  
  examAttempts[attemptIndex] = updatedAttempt;
  return Promise.resolve(updatedAttempt);
};

export const evaluateExam = async (attemptId: string): Promise<ExamResult> => {
  const attempt = examAttempts.find(a => a.id === attemptId);
  if (!attempt) throw new Error('Exam attempt not found');
  
  const exam = await generateExamForJobRole(attempt.jobRoleId);
  const role = await getJobRoleById(attempt.jobRoleId);
  
  // In a real app, this would use OpenAI to evaluate open-ended questions
  // For simplicity, we'll score based on completion and randomness

  const totalQuestions = exam.questions.length;
  const answeredQuestions = Object.keys(attempt.answers).length;
  const completionRate = answeredQuestions / totalQuestions;
  
  // Add randomness to make it feel more realistic
  const baseScore = completionRate * 85;
  const randomFactor = Math.random() * 15; // +/- 15%
  let finalScore = Math.min(100, Math.max(0, baseScore + randomFactor));
  finalScore = Math.round(finalScore * 10) / 10; // Round to 1 decimal place
  
  const passed = finalScore >= exam.passingScore;
  
  // Determine ranking based on score
  let ranking: 'top' | 'mid' | 'low' | null = null;
  if (passed) {
    if (finalScore >= 90) ranking = 'top';
    else if (finalScore >= 80) ranking = 'mid';
    else ranking = 'low';
  }
  
  // Generate feedback based on performance
  let feedback = '';
  if (ranking === 'top') {
    feedback = `Outstanding performance! Your comprehensive understanding of ${role?.title} concepts demonstrates exceptional readiness for this role. You exhibited particular strength in problem-solving and technical knowledge.`;
  } else if (ranking === 'mid') {
    feedback = `Good job! You've demonstrated solid competency in core ${role?.title} skills. Consider strengthening your knowledge in a few areas to enhance your expertise further.`;
  } else if (ranking === 'low') {
    feedback = `Congratulations on passing! You've demonstrated sufficient knowledge of ${role?.title} fundamentals. For professional growth, consider deepening your understanding of key concepts and practices.`;
  } else {
    feedback = `Thank you for completing the assessment. While you didn't meet the passing threshold this time, we encourage you to continue learning and try again in the future.`;
  }
  
  const result: ExamResult = {
    id: `result-${Date.now()}`,
    userId: attempt.userId,
    examId: attempt.examId,
    jobRoleId: attempt.jobRoleId,
    score: finalScore,
    passed,
    ranking,
    feedback,
    completedAt: new Date().toISOString()
  };
  
  examResults = [...examResults, result];
  return Promise.resolve(result);
};

export const getExamResults = (userId: string): Promise<ExamResult[]> => {
  const results = examResults.filter(result => result.userId === userId);
  return Promise.resolve(results);
};
