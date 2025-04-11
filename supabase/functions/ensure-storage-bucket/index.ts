
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Get the Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Create the required bucket if it doesn't exist
    const { data: buckets, error: getBucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (getBucketsError) {
      throw new Error(`Failed to list storage buckets: ${getBucketsError.message}`);
    }
    
    console.log("Current buckets:", buckets?.map(b => b.name).join(', ') || 'No buckets found');
    
    // Check if the progress_photos bucket exists
    const progressPhotosBucketExists = buckets?.some(bucket => bucket.name === 'progress_photos');
    
    if (!progressPhotosBucketExists) {
      console.log("Creating progress_photos bucket...");
      
      const { error: createBucketError } = await supabaseAdmin.storage.createBucket('progress_photos', {
        public: true, // Make the bucket public so files can be accessed without authentication
        fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
      });
      
      if (createBucketError) {
        throw new Error(`Failed to create progress_photos bucket: ${createBucketError.message}`);
      }
      
      console.log("progress_photos bucket created successfully");
    } else {
      console.log("progress_photos bucket already exists");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Storage buckets configured successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error configuring storage buckets:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
