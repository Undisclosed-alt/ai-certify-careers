
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract the hash from the URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const hash = pathParts[pathParts.length - 1];
    
    if (!hash) {
      return new Response(
        JSON.stringify({ error: 'No hash provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Look up the certificate by hash
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .select('*, attempts(*, exams(*, job_roles(*)))')
      .eq('sha256_hash', hash)
      .maybeSingle();

    if (certError || !certificate) {
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: 'Certificate not found' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', certificate.attempts.user_id)
      .single();

    // Return verification details
    return new Response(
      JSON.stringify({
        verified: true,
        issuedAt: certificate.issued_at,
        recipientName: profile?.full_name || 'Unknown',
        certification: certificate.attempts.exams.job_roles.title,
        score: certificate.attempts.score_json?.score || 0,
        level: certificate.attempts.exams.job_roles.level || '',
        issuerId: 'AI-Certify-Careers',
        pdfUrl: certificate.pdf_url
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return new Response(
      JSON.stringify({ 
        verified: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
