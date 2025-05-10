
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import * as crypto from "https://deno.land/std@0.170.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This is a simplified version - in a real app, you would use a PDF library
// to generate a proper PDF certificate, but for this demo we'll generate a simple HTML certificate
async function generateCertificateHtml(attemptData: any, profileData: any, jobRoleData: any) {
  const date = new Date(attemptData.completed_at).toLocaleDateString('en-US', {
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
  
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Certificate of Completion</title>
    <style>
      body {
        font-family: 'Arial', sans-serif;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      .certificate {
        border: 20px solid #0066cc;
        padding: 50px;
        position: relative;
        background: #fff;
      }
      .header {
        text-align: center;
      }
      .title {
        font-size: 36px;
        font-weight: bold;
        margin-bottom: 20px;
        color: #0066cc;
      }
      .name {
        font-size: 28px;
        margin: 20px 0;
      }
      .course {
        font-size: 22px;
        margin: 20px 0;
      }
      .date {
        margin-top: 40px;
        text-align: center;
      }
      .verification {
        margin-top: 30px;
        font-size: 12px;
        color: #666;
        text-align: center;
      }
      .badge {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 100px;
        height: 100px;
        background: #0066cc;
        border-radius: 50%;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 24px;
      }
    </style>
  </head>
  <body>
    <div class="certificate">
      <div class="badge">${attemptData.rank?.toUpperCase() || 'PASS'}</div>
      <div class="header">
        <div class="title">Certificate of Achievement</div>
      </div>
      <p>This is to certify that</p>
      <div class="name">${profileData.full_name || 'Candidate'}</div>
      <p>has successfully completed the</p>
      <div class="course">${jobRoleData.title} Certification Exam</div>
      <p>with a score of ${attemptData.score_json?.score || 0}%</p>
      <div class="date">Issued on ${date}</div>
      <div class="verification">Certificate ID: ${attemptData.id}<br>Verify at: 
      https://your-domain.com/verify/${attemptData.id}</div>
    </div>
  </body>
  </html>
  `;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { attemptId } = await req.json();
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if a certificate already exists
    const { data: existingCert, error: certError } = await supabase
      .from('certificates')
      .select('pdf_url')
      .eq('attempt_id', attemptId)
      .maybeSingle();

    if (existingCert) {
      return new Response(
        JSON.stringify({ pdfUrl: existingCert.pdf_url }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the attempt data
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .select('*, exams(job_role_id)')
      .eq('id', attemptId)
      .eq('status', 'passed') // Only passed attempts get certificates
      .single();

    if (attemptError || !attempt) {
      return new Response(
        JSON.stringify({ error: 'No passing attempt found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', attempt.user_id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    // Get the job role
    const { data: jobRole, error: jobRoleError } = await supabase
      .from('job_roles')
      .select('*')
      .eq('id', attempt.exams.job_role_id)
      .single();

    if (jobRoleError || !jobRole) {
      return new Response(
        JSON.stringify({ error: 'Job role not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate the certificate (HTML for simplicity)
    const certificateHtml = await generateCertificateHtml(attempt, profile || {}, jobRole);

    // Generate a hash for verification
    const encoder = new TextEncoder();
    const data = encoder.encode(attempt.id + attempt.completed_at);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // In a real app, you would:
    // 1. Convert the HTML to a PDF
    // 2. Upload the PDF to Supabase Storage
    // Here, we'll simulate that by storing the HTML directly
    
    const fileName = `${attempt.user_id}/${attempt.id}_certificate.html`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('certificates')
      .upload(fileName, certificateHtml, {
        contentType: 'text/html',
        cacheControl: '3600'
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: 'Failed to upload certificate' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the public URL
    const { data: urlData } = await supabase
      .storage
      .from('certificates')
      .getPublicUrl(fileName);

    // Create a certificate record
    const { data: certificate, error: insertError } = await supabase
      .from('certificates')
      .insert({
        attempt_id: attemptId,
        pdf_url: urlData.publicUrl,
        sha256_hash: hashHex
      })
      .select()
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create certificate record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ pdfUrl: certificate.pdf_url }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error generating certificate:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
