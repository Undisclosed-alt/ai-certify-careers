
import { supabase } from '@/integrations/supabase/client';
import { Certification, ExamResult, mapCertificationFromDb, mapExamResultFromDb } from '@/types';

// TODO: Update function names from getJobRoles to getCertifications when database is migrated
export const getCertifications = async (): Promise<Certification[]> => {
  const { data, error } = await supabase
    .from('job_roles') // TODO: Rename table from job_roles to certifications
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching certifications:', error);
    throw error;
  }

  return data.map(mapCertificationFromDb);
};

export const getCertificationById = async (id: string): Promise<Certification | null> => {
  const { data, error } = await supabase
    .from('job_roles') // TODO: Rename table from job_roles to certifications
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching certification:', error);
    throw error;
  }

  return data ? mapCertificationFromDb(data) : null;
};

// Keep legacy function names for backward compatibility during transition
export const getJobRoles = getCertifications;
export const getJobRoleById = getCertificationById;

// Add missing exam result functions
export const getExamResultById = async (id: string): Promise<ExamResult | null> => {
  const { data, error } = await supabase
    .from('attempts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching exam result:', error);
    throw error;
  }

  return data ? mapExamResultFromDb(data) : null;
};

// Add missing exam functions
export const saveExamAnswer = async (attemptId: string, questionId: string, answer: string | number): Promise<void> => {
  const { error } = await supabase
    .from('attempts')
    .update({
      answers_json: { [questionId]: answer }
    })
    .eq('id', attemptId);

  if (error) {
    console.error('Error saving exam answer:', error);
    throw error;
  }
};

export const completeExamAttempt = async (attemptId: string): Promise<void> => {
  const { error } = await supabase
    .from('attempts')
    .update({
      completed_at: new Date().toISOString(),
      status: 'completed'
    })
    .eq('id', attemptId);

  if (error) {
    console.error('Error completing exam attempt:', error);
    throw error;
  }
};

export const evaluateExam = async (attemptId: string): Promise<ExamResult> => {
  // This would typically call an edge function to evaluate the exam
  // For now, we'll return a mock result
  const result = await getExamResultById(attemptId);
  if (!result) {
    throw new Error('Exam result not found');
  }
  return result;
};

// Add missing generation functions for backward compatibility
export const generateExamForJobRole = async (jobRoleId: string): Promise<any> => {
  // This would typically call an edge function to generate an exam
  // For now, we'll return a mock response
  return { examId: 'mock-exam-id' };
};

export const startExamAttempt = async (examId: string, userId: string): Promise<any> => {
  // This would typically call an edge function to start an attempt
  // For now, we'll return a mock response
  return { attemptId: 'mock-attempt-id' };
};
