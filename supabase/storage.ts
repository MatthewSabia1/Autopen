import { supabase } from './supabase';

const BUCKET_NAME = 'profile-images';

/**
 * Uploads a user's profile image to Supabase Storage
 * @param userId The ID of the user
 * @param file The file to upload
 * @returns A URL to the uploaded image
 */
export const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
  try {
    // Create a unique file path using the user's ID
    const filePath = `${userId}/profile-${new Date().getTime()}`;
    
    // Convert the file to an ArrayBuffer for more reliable uploads
    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(fileArrayBuffer);
    
    // Upload the file to Supabase Storage as an array buffer
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: file.type, // Make sure to set the correct content type
        cacheControl: '3600',
        upsert: true,
      });
    
    if (error) {
      throw error;
    }
    
    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

/**
 * Deletes a user's previous profile image from Supabase Storage
 * @param userId The ID of the user
 * @param filePath The path of the file to delete (optional)
 */
export const deleteProfileImage = async (userId: string, filePath?: string): Promise<void> => {
  try {
    if (filePath) {
      // Delete a specific file
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);
        
      if (error) {
        throw error;
      }
    } else {
      // List all files in the user's folder
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(userId);
        
      if (error) {
        throw error;
      }
      
      // If there are files, delete them
      if (data && data.length > 0) {
        const filesToDelete = data.map(file => `${userId}/${file.name}`);
        
        const { error: deleteError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(filesToDelete);
          
        if (deleteError) {
          throw deleteError;
        }
      }
    }
  } catch (error) {
    console.error('Error deleting profile image:', error);
    throw error;
  }
}; 