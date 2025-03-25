import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { getOrCreateProfile, updateProfile, updateProfileImage, type Profile } from "./profile";

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserProfile: (updates: Partial<Omit<Profile, 'id' | 'user_id'>>) => Promise<Profile | null>;
  updateUserAvatar: (file: File) => Promise<string>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch the user's profile
  const fetchProfile = async (userId: string, email: string) => {
    if (!userId) return null;
    
    setProfileLoading(true);
    try {
      const userProfile = await getOrCreateProfile(userId, email);
      setProfile(userProfile);
      return userProfile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  // Refresh the user's profile
  const refreshProfile = async () => {
    if (!user?.id || !user?.email) return;
    await fetchProfile(user.id, user.email);
  };

  // Update the user's profile
  const updateUserProfile = async (updates: Partial<Omit<Profile, 'id' | 'user_id'>>) => {
    if (!user?.id) return null;
    
    try {
      const updatedProfile = await updateProfile(user.id, updates);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
      return updatedProfile;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  // Update the user's avatar
  const updateUserAvatar = async (file: File) => {
    if (!user?.id) throw new Error("User not authenticated");
    
    try {
      const avatarUrl = await updateProfileImage(user.id, file);
      
      // Update the local profile state
      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
      
      return avatarUrl;
    } catch (error) {
      console.error("Error updating avatar:", error);
      throw error;
    }
  };

  useEffect(() => {
    console.log("=== AUTH CONTEXT DEBUG ===");
    console.log("1. Initializing auth context, checking session...");
    
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("2. Error getting session:", error.message);
      } else {
        console.log("2. Session check result:", session ? "Active session found" : "No active session");
      }
      
      const currentUser = session?.user ?? null;
      console.log("3. Current user from session:", currentUser?.email || "none", currentUser?.id || "none");
      setUser(currentUser);
      
      if (currentUser?.id && currentUser?.email) {
        console.log("4. User authenticated, fetching profile...");
        fetchProfile(currentUser.id, currentUser.email);
      } else {
        console.log("4. No authenticated user, skipping profile fetch");
        setProfileLoading(false);
      }
      
      setLoading(false);
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("5. Auth state change detected:", event);
      console.log("6. New session state:", session ? "Session exists" : "No session");
      
      const currentUser = session?.user ?? null;
      console.log("7. Current user after state change:", currentUser?.email || "none", currentUser?.id || "none");
      setUser(currentUser);
      
      if (currentUser?.id && currentUser?.email) {
        console.log("8. User authenticated after state change, fetching profile...");
        fetchProfile(currentUser.id, currentUser.email);
      } else {
        console.log("8. No authenticated user after state change");
        setProfile(null);
        setProfileLoading(false);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    console.log("=== SIGN IN DEBUG ===");
    console.log("1. Attempting to sign in user:", email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error("2. Sign in error:", error.message);
      throw error;
    }
    
    console.log("2. Sign in successful:", data.user?.email);
    console.log("3. User ID:", data.user?.id);
    console.log("4. Session expiry:", new Date(data.session?.expires_at || 0).toLocaleString());
    
    // Verify we can access user data immediately after login
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log("5. getUser check after login:", userData?.user?.id || "No user");
    
    if (userError) {
      console.error("6. Get user error after login:", userError.message);
    }
    
    return;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        profile,
        loading, 
        profileLoading,
        signIn, 
        signUp, 
        signOut,
        refreshProfile,
        updateUserProfile,
        updateUserAvatar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
