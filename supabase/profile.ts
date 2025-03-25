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
  try {
    // Upload the new profile image
    const publicUrl = await uploadProfileImage(userId, file);
    
    // Update the profile with the new image URL
    await updateProfile(userId, { avatar_url: publicUrl });
    
    return publicUrl;
  } catch (error) {
    console.error('Error updating profile image:', error);
    throw error;
  }
};

/**
 * Gets or creates a user profile
 * @param userId The ID of the user
 * @param email The user's email
 * @returns The user's profile
 */
export const getOrCreateProfile = async (userId: string, email: string): Promise<Profile | null> => {
  try {
    // First try to get the profile
    const profile = await getProfile(userId);
    
    // If profile exists, return it
    if (profile) {
      return profile;
    }
    
    // Otherwise create a new profile
    const username = email.split('@')[0]; // Default username from email
    
    return await createProfile(userId, {
      username,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`, // Default avatar
    });
  } catch (error) {
    console.error('Error in getOrCreateProfile:', error);
    return null;
  }
}; 