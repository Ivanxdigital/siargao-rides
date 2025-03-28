import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Function to upload a file to Supabase storage
export async function uploadFile(
  file: File,
  bucket: string,
  folder: string = ''
): Promise<{ url: string | null; error: Error | null }> {
  if (!file) {
    return { url: null, error: new Error('No file provided') };
  }
  
  try {
    const supabase = createClientComponentClient();
    
    // Create a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder ? `${folder}/` : ''}${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      return { url: null, error };
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return { url: publicUrl, error: null };
  } catch (error) {
    return { url: null, error: error as Error };
  }
}

// Function to delete a file from Supabase storage
export async function deleteFile(
  path: string,
  bucket: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = createClientComponentClient();
    
    // Get the file path without the URL part
    const filePath = path.split(`${bucket}/`)[1];
    
    if (!filePath) {
      return { error: new Error('Invalid file path') };
    }
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    return { error };
  } catch (error) {
    return { error: error as Error };
  }
} 