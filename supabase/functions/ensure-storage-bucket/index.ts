
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Set up Supabase client with service role
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if "progress-photos" bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      throw new Error(`Error listing buckets: ${bucketsError.message}`);
    }

    console.log("Available buckets:", buckets);
    const progressBucket = buckets.find(b => b.name === "progress-photos");

    // If "progress-photos" bucket doesn't exist, create it
    if (!progressBucket) {
      console.log("Creating progress-photos bucket");
      
      const { error: createError } = await supabase
        .storage
        .createBucket("progress-photos", {
          public: true, // Changed to public for easier access
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"]
        });

      if (createError) {
        throw new Error(`Error creating bucket: ${createError.message}`);
      }
      
      // Set up public access policy for the bucket
      const { error: policyError } = await supabase
        .storage
        .from("progress-photos")
        .createSignedUploadUrl("test-policy");
        
      if (policyError) {
        console.log("Warning: Could not set up policy automatically", policyError);
      }
      
      console.log("Successfully created progress-photos bucket");
    } else {
      console.log("Progress-photos bucket already exists");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Progress photos bucket ensured" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error ensuring bucket:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "An unknown error occurred" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
