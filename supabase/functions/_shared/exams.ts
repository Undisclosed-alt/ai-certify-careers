
import { supabase } from "./config.ts";
import { ExamType, QuestionType } from "./types.ts";
import { logError, logInfo } from "./logger.ts";

/**
 * 📝 Exam Service
 * Utilities for handling exam-related operations
 */

/**
 * Get an existing exam for a job role or create a new one
 * @param {string} jobRoleId The job role ID
 * @returns {Promise} The exam object
 */
export async function getOrCreateExamForJobRole(jobRoleId: string): Promise<ExamType> {
  logInfo("Getting or creating exam for job role", { jobRoleId });
  
  // First try to get an existing exam
  const { data: existingExam, error: examError } = await supabase
    .from("exams")
    .select("*")
    .eq("job_role_id", jobRoleId)
    .single();

  // If the exam already exists, return it
  if (existingExam) {
    return existingExam as ExamType;
  }

  // If there's a real error (not just 'no rows returned')
  if (examError && !examError.message.includes("no rows returned")) {
    logError("Failed to fetch exam", examError, { jobRoleId });
    throw new Error(`Failed to fetch exam: ${examError.message}`);
  }

  // Create a new exam for this job role
  const { data: newExam, error: createError } = await supabase
    .from("exams")
    .insert({
      job_role_id: jobRoleId,
      time_limit_minutes: 60, // Default values
      passing_score: 70,
      version: 1
    })
    .select()
    .single();

  if (createError) {
    logError("Failed to create exam", createError, { jobRoleId });
    throw new Error(`Failed to create exam: ${createError.message}`);
  }

  return newExam as ExamType;
}

/**
 * Get existing questions for an exam
 * @param {string} examId The exam ID
 * @returns {Promise} Array of questions
 */
export async function getExistingQuestions(examId: string): Promise<QuestionType[]> {
  logInfo("Getting existing questions", { examId });
  
  const { data: questions, error } = await supabase
    .from("questions")
    .select("*")
    .eq("exam_id", examId);

  if (error) {
    logError("Failed to fetch questions", error, { examId });
    throw new Error(`Failed to fetch questions: ${error.message}`);
  }

  return questions as QuestionType[] || [];
}
