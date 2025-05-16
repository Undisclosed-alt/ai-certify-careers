
import { supabase } from "./config.ts";

/**
 * 📝 Exam Service
 * Utilities for handling exam-related operations
 */

/**
 * Get an existing exam for a job role or create a new one
 * @param {string} jobRoleId The job role ID
 * @returns {Promise} The exam object
 */
export async function getOrCreateExamForJobRole(jobRoleId: string) {
  // First try to get an existing exam
  const { data: existingExam, error: examError } = await supabase
    .from("exams")
    .select("*")
    .eq("job_role_id", jobRoleId)
    .single();

  // If the exam already exists, return it
  if (existingExam) {
    return existingExam;
  }

  // If there's a real error (not just 'no rows returned')
  if (examError && !examError.message.includes("no rows returned")) {
    console.error("Error fetching exam:", examError);
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
    console.error("Error creating exam:", createError);
    throw new Error(`Failed to create exam: ${createError.message}`);
  }

  return newExam;
}

/**
 * Get existing questions for an exam
 * @param {string} examId The exam ID
 * @returns {Promise} Array of questions
 */
export async function getExistingQuestions(examId: string) {
  const { data: questions, error } = await supabase
    .from("questions")
    .select("*")
    .eq("exam_id", examId);

  if (error) {
    console.error("Error fetching questions:", error);
    throw new Error(`Failed to fetch questions: ${error.message}`);
  }

  return questions || [];
}
