
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { OpenAI } from "https://esm.sh/openai@4.16.1";
import { supabase } from "../_shared/config.ts";
import { getOrCreateExamForJobRole, getExistingQuestions } from "../_shared/exams.ts";
import { logPrompt, logError } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobRoleId, userId } = await req.json();
    
    // Get or create an exam for this job role using our shared service
    const exam = await getOrCreateExamForJobRole(jobRoleId);

    // Get existing questions for this exam using our shared service
    const existingQuestions = await getExistingQuestions(exam.id);

    if (existingQuestions && existingQuestions.length > 0) {
      // Return existing questions
      return new Response(
        JSON.stringify({ questions: existingQuestions }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // If no existing questions, generate new ones using OpenAI
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Get job role details
    const { data: jobRole, error: jobRoleError } = await supabase
      .from('job_roles')
      .select('*')
      .eq('id', jobRoleId)
      .single();

    if (jobRoleError || !jobRole) {
      return new Response(
        JSON.stringify({ error: 'Job role not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a prompt for OpenAI
    const prompt = `Generate a certification exam for a ${jobRole.title} role. 
    The exam should include:
    - 5 multiple choice questions (type: mcq)
    - 2 coding questions (type: coding)
    - 3 free response questions (type: free)
    
    For multiple choice questions, provide 4 options and indicate the correct answer.
    For coding questions, provide a problem statement and expected solution.
    For free response questions, provide a question prompt.
    
    Format the response as a JSON array of question objects with these fields:
    - body: the question text
    - type: "mcq", "coding", or "free"
    - options: array of strings (for mcq) or null
    - correct_answer: index of correct option (for mcq), code solution (for coding), or null (for free)
    - category: technical category of the question (e.g., "HTML", "JavaScript", "Databases")
    - difficulty: 1 (easy), 2 (medium), or 3 (hard)`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    // Parse the response
    const response = completion.choices[0].message.content;
    let questions;
    try {
      const parsed = JSON.parse(response);
      questions = parsed.questions || [];
    } catch (e) {
      console.error("Error parsing OpenAI response:", e);
      return new Response(
        JSON.stringify({ error: "Failed to parse questions" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert the questions into the database
    const questionsToInsert = questions.map((q: any) => ({
      exam_id: exam.id,
      body: q.body,
      type: q.type,
      options: q.options,
      correct_answer: q.correct_answer,
      category: q.category,
      difficulty: q.difficulty
    }));

    const { data: insertedQuestions, error: insertError } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select();

    if (insertError) {
      console.error("Error inserting questions:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save questions" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the prompt and response using our shared logger service
    await logPrompt({
      type: 'exam_generation',
      prompt,
      response: { questions },
      metadata: { exam_id: exam.id, job_role_id: jobRoleId }
    });

    return new Response(
      JSON.stringify({ questions: insertedQuestions }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    // Use our shared error logger
    const errorDetails = logError(error, 'exam-generate');
    
    return new Response(
      JSON.stringify({ error: errorDetails.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
