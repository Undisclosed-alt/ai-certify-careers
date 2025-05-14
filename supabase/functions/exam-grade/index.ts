
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { OpenAI } from "https://esm.sh/openai@4.16.1";

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
    const { attemptId, answers } = await req.json();
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .select('*, exams(*)')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attempt) {
      return new Response(
        JSON.stringify({ error: 'Attempt not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the questions for this exam
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', attempt.exam_id);

    if (questionsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve questions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize score calculation
    let score = 0;
    let totalPoints = 0;
    let detailedScores = {};

    // First, score multiple choice questions (easy to automate)
    const mcqQuestions = questions.filter(q => q.type === 'mcq');
    for (const question of mcqQuestions) {
      const userAnswer = answers[question.id];
      const points = question.difficulty || 1;
      totalPoints += points;
      
      if (userAnswer !== undefined && String(userAnswer) === String(question.correct_answer)) {
        score += points;
        detailedScores[question.id] = { score: points, max: points, feedback: "Correct" };
      } else {
        detailedScores[question.id] = { score: 0, max: points, feedback: "Incorrect" };
      }
    }

    // For coding and free response questions, use OpenAI to grade
    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY") || "",
    });

    const freeResponseQuestions = questions.filter(q => q.type !== 'mcq');
    for (const question of freeResponseQuestions) {
      const userAnswer = answers[question.id] || '';
      const points = question.difficulty * 2 || 2; // Higher points for free response
      totalPoints += points;
      
      // Skip if no answer provided
      if (!userAnswer) {
        detailedScores[question.id] = { score: 0, max: points, feedback: "No answer provided" };
        continue;
      }

      // Create a prompt for OpenAI to evaluate the answer
      const prompt = `Grade this ${question.type} question answer:
      
      Question: ${question.body}
      
      ${question.correct_answer ? `Correct Answer or Example Solution: ${question.correct_answer}` : ''}
      
      User's Answer: ${userAnswer}
      
      Evaluate the answer on a scale of 0 to ${points} points. Provide brief, specific feedback explaining the score.
      Format your response as a JSON object with these fields:
      - score: number (0-${points})
      - feedback: string (brief explanation)`;

      // Call OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      // Parse the response
      const response = completion.choices[0].message.content;
      try {
        const grading = JSON.parse(response);
        score += grading.score;
        detailedScores[question.id] = { 
          score: grading.score, 
          max: points, 
          feedback: grading.feedback 
        };
      } catch (e) {
        console.error("Error parsing OpenAI response:", e);
        detailedScores[question.id] = { 
          score: 0, 
          max: points, 
          feedback: "Error grading response" 
        };
      }

      // Log the prompt and response
      await supabase
        .from('prompt_logs')
        .insert({
          type: 'answer_grading',
          prompt,
          response: JSON.parse(response),
          metadata: { 
            question_id: question.id, 
            attempt_id: attemptId 
          }
        });
    }

    // Calculate final percentage score
    const percentageScore = Math.round((score / totalPoints) * 100);
    
    // Fix: exams is an array; guard for undefined
    const passing = attempt.exams?.[0]?.passing_score !== undefined
      ? attempt.exams[0].passing_score
      : 70;
      
    const passed = percentageScore >= passing;

    // Determine ranking
    let rank = null;
    if (passed) {
      if (percentageScore >= 90) {
        rank = 'top';
      } else if (percentageScore >= 80) {
        rank = 'mid';
      } else {
        rank = 'low';
      }
    }

    // Create a feedback summary
    const feedbackPrompt = `Based on the exam results below, provide a brief encouraging feedback summary for the candidate:
    
    Score: ${percentageScore}%
    Passing Score: ${passing}%
    Result: ${passed ? 'PASSED' : 'FAILED'}
    
    Detailed feedback:
    ${Object.entries(detailedScores).map(([id, detail]) => {
      const question = questions.find(q => q.id === id);
      return `- ${question?.body}: ${detail.score}/${detail.max} - ${detail.feedback}`;
    }).join('\n')}
    
    Keep the feedback under 150 words. Be encouraging but honest.`;

    const feedbackCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: [{ role: "user", content: feedbackPrompt }],
    });

    const feedbackSummary = feedbackCompletion.choices[0].message.content;

    // Create the score JSON
    const scoreJson = {
      score: percentageScore,
      totalPoints,
      pointsEarned: score,
      details: detailedScores,
      feedback: feedbackSummary
    };

    // Update the attempt with the results
    const { data: updatedAttempt, error: updateError } = await supabase
      .from('attempts')
      .update({
        completed_at: new Date().toISOString(),
        status: passed ? 'passed' : 'failed',
        rank,
        score_json: scoreJson,
        answers_json: answers
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update attempt with results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        score: percentageScore,
        passed,
        rank,
        feedback: feedbackSummary,
        details: detailedScores
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error grading exam:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
