import { supabase } from './supabase';
import { uploadProfileImage, deleteProfileImage } from './storage';

// Define the profile type
export type Profile = {
  id: string;
  user_id: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  updated_at?: string;
  is_admin: boolean;
};

/**
 * Gets a user's profile from the database
 * @param userId The ID of the user
 * @returns The user's profile or null if not found
 */
export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
};

/**
 * Updates a user's profile in the database
 * @param userId The ID of the user
 * @param updates The profile fields to update
 * @returns The updated profile
 */
export const updateProfile = async (
  userId: string, 
  updates: Partial<Omit<Profile, 'id' | 'user_id'>>
): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

/**
 * Creates a new profile for a user
 * @param userId The ID of the user
 * @param profile The profile data
 * @returns The created profile
 */
export const createProfile = async (
  userId: string, 
  profile: Omit<Profile, 'id' | 'user_id'>
): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        { 
          user_id: userId, 
          ...profile
        }
      ])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
};

/**
 * Updates a user's profile image
 * @param userId The ID of the user
 * @param file The image file to upload
 * @returns The URL of the uploaded image
 */
export const updateProfileImage = async (userId: string, file: File): Promise<string> => {
  let oldAvatarPath: string | null = null;
  try {
    // 1. Get the current profile to find the old avatar URL
    const currentProfile = await getProfile(userId);
    const oldAvatarUrl = currentProfile?.avatar_url;

    // Extract path from URL if it exists and is from our storage bucket
    if (oldAvatarUrl && oldAvatarUrl.includes(BUCKET_NAME)) {
      try {
        const urlParts = new URL(oldAvatarUrl);
        // Pathname usually starts with /storage/v1/object/public/bucket-name/...
        // We want the part after the bucket name
        const pathSegments = urlParts.pathname.split('/');
        const bucketIndex = pathSegments.indexOf(BUCKET_NAME);
        if (bucketIndex !== -1 && bucketIndex + 1 < pathSegments.length) {
          oldAvatarPath = pathSegments.slice(bucketIndex + 1).join('/');
        }
      } catch (e) {
        console.error("Error parsing old avatar URL:", e);
        // Continue without deleting if URL parsing fails
      }
    }

    // 2. Upload the new profile image
    const publicUrl = await uploadProfileImage(userId, file);
    
    // 3. Update the profile with the new image URL
    await updateProfile(userId, { avatar_url: publicUrl });

    // 4. Delete the old profile image *after* successfully updating the profile
    if (oldAvatarPath) {
      // Extract the folder/filename part for deletion
      await deleteProfileImage(userId, oldAvatarPath);
    }
    
    return publicUrl;
  } catch (error) {
    console.error('Error updating profile image:', error);
    // Optional: If upload succeeded but profile update/delete failed,
    // potentially try to delete the newly uploaded image to avoid orphans.
    throw error;
  }
};

/**
 * Gets all user profiles (Admin only)
 * Requires the calling user to have is_admin = true in their own profile due to RLS.
 * @returns A list of all user profiles or null on error.
 */
export const getAllProfiles = async (): Promise<Profile[] | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, username, avatar_url, is_admin'); // Select specific fields needed for admin list

    if (error) {
      // RLS might throw an error if the user is not an admin
      console.error('Error fetching all profiles (check RLS/admin status):', error);
      throw error;
    }

    return data;
  } catch (error) {
    // Catch potential errors from the try block or re-thrown RLS errors
    console.error('Failed to get all profiles:', error);
    return null;
  }
};

// Added BUCKET_NAME constant here as well for parsing logic
const BUCKET_NAME = 'profile-images'; 