// This script creates the user-avatars storage bucket in Supabase
// Run with: node src/lib/scripts/create-storage-bucket.js

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Configure dotenv
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Loaded (value hidden)' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Loaded (value hidden)' : 'Missing');

// We need the service role key to create buckets
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBucket() {
  try {
    // Check if bucket exists
    const { data: existingBuckets, error: fetchError } = await supabase
      .storage
      .listBuckets();
    
    if (fetchError) {
      throw fetchError;
    }
    
    const bucketExists = existingBuckets.some(bucket => bucket.name === 'user-avatars');
    
    if (bucketExists) {
      console.log('Bucket "user-avatars" already exists.');
      return;
    }
    
    // Create the bucket
    const { error } = await supabase
      .storage
      .createBucket('user-avatars', {
        public: true,  // Files will be publicly accessible
        fileSizeLimit: 1024 * 1024 * 2, // 2MB limit for avatar images
      });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Storage bucket "user-avatars" created successfully!');
    
    // Set up policies to allow authenticated users to upload their own avatars
    // This allows users to upload to their own folder
    const policyName = 'Allow authenticated uploads to own folder';
    
    const { error: policyError } = await supabase
      .rpc('create_storage_policy', {
        bucket_name: 'user-avatars',
        policy_name: policyName,
        definition: {
          command: 'INSERT',
          check: "((storage.foldername(name))[1] = auth.uid())",
        }
      });
    
    if (policyError) {
      console.warn('Warning: Could not create bucket policy automatically:', policyError.message);
      console.log('You may need to set up storage policies manually in the Supabase dashboard.');
    } else {
      console.log('✅ Storage policy created successfully!');
    }
    
  } catch (error) {
    console.error('Error creating storage bucket:', error.message);
    process.exit(1);
  }
}

createBucket()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Unhandled error:', err));
