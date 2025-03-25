import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import DashboardLayout from "../layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Camera, CheckCircle, ImageOff, Loader, Mail, PenTool, Save, Upload, User, WifiOff } from 'lucide-react';
import { useAuth } from '../../../supabase/auth';
import { useToast } from '@/components/ui/use-toast';

const Settings = () => {
  const { user, profile, profileLoading, updateUserProfile, updateUserAvatar } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  
  const [username, setUsername] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Update local state when profile changes
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setImageError(false); // Reset image error state when profile updates
    }
    
    // Set loading state based on profile loading
    setLoading(profileLoading);
    
    // Monitor online status
    const handleOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [profile, profileLoading]);

  const handleImageError = () => {
    setImageError(true);
    console.error('Failed to load profile image:', profile?.avatar_url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (!user) {
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      await updateUserProfile({
        username,
        bio
      });
      
      setIsEditing(false);
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
        variant: "default",
      });
      
      setSaveMessage({
        type: 'success',
        text: 'Profile updated successfully!'
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setSaveMessage({
        type: 'error',
        text: 'Failed to update profile. Please try again.'
      });
      
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    if (isOffline) {
      setSaveMessage({
        type: 'error',
        text: 'Cannot upload images while offline'
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setSaveMessage({
        type: 'error',
        text: 'Please upload an image file'
      });
      
      toast({
        title: "Invalid File",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setSaveMessage({
        type: 'error',
        text: 'Image size should be less than 2MB'
      });
      
      toast({
        title: "File Too Large",
        description: "Image size should be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);
    setImageError(false);
    setSaveMessage(null);

    try {
      // Upload the avatar using the Auth context function
      await updateUserAvatar(file);
      
      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
        variant: "default",
      });
      
      setSaveMessage({
        type: 'success',
        text: 'Profile picture updated successfully!'
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
      
      setSaveMessage({
        type: 'error',
        text: 'Failed to upload profile picture. Please try again.'
      });
    } finally {
      setIsUploadingAvatar(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeTab="Settings">
        <div className="w-full max-w-4xl mx-auto bg-paper rounded-lg shadow-textera border border-accent-tertiary/20 p-8 my-8">
          <div className="flex justify-center items-center h-48">
            <div className="text-center">
              <div className="animate-spin w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="font-serif text-ink-light">Loading your profile...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="Settings">
      <div className="w-full max-w-4xl mx-auto bg-paper rounded-lg shadow-textera border border-accent-tertiary/20 p-8 my-8">
        <h2 className="font-display text-3xl text-ink-dark mb-6 flex items-center">
          <User className="w-8 h-8 mr-3 text-accent-primary" />
          Account Settings
        </h2>

        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-md flex items-center">
            {isOffline ? (
              <WifiOff className="w-5 h-5 mr-3 text-amber-600" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-3 text-red-600" />
            )}
            <p className="text-red-700 font-serif">{error}</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar Upload Section */}
          <div className="md:w-1/3 flex flex-col items-center">
            <div 
              className={`relative w-48 h-48 rounded-full bg-cream border-4 border-accent-tertiary/30 overflow-hidden ${isOffline ? 'cursor-not-allowed opacity-80' : 'cursor-pointer group'}`}
              onClick={handleAvatarClick}
            >
              {isUploadingAvatar ? (
                <div className="absolute inset-0 flex items-center justify-center bg-ink-dark/20">
                  <Loader className="w-10 h-10 text-white animate-spin" />
                </div>
              ) : (
                <>
                  {profile?.avatar_url && !imageError ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-accent-primary/10 text-accent-primary">
                      {imageError ? (
                        <div className="text-center">
                          <ImageOff className="w-16 h-16 mx-auto mb-2" />
                          <p className="text-xs text-ink-faded">Image failed to load</p>
                        </div>
                      ) : (
                        <User className="w-24 h-24" />
                      )}
                    </div>
                  )}

                  {!isOffline && (
                    <div className="absolute inset-0 flex items-center justify-center bg-ink-dark/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="text-white text-center">
                        <Camera className="w-10 h-10 mx-auto mb-2" />
                        <p className="font-serif text-sm">Change Photo</p>
                      </div>
                    </div>
                  )}
                  
                  {isOffline && (
                    <div className="absolute inset-0 flex items-center justify-center bg-ink-dark/50">
                      <div className="text-white text-center">
                        <WifiOff className="w-10 h-10 mx-auto mb-2" />
                        <p className="font-serif text-sm">Offline Mode</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              disabled={isOffline}
            />

            <Button
              variant="outline"
              type="button"
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar || isOffline}
              className="mt-4 px-4 py-2 font-serif flex items-center border border-accent-tertiary/30 text-ink-light rounded hover:bg-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-4 h-4 mr-2" />
                  Upload Unavailable
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </>
              )}
            </Button>

            <p className="mt-2 text-xs text-ink-faded font-serif text-center max-w-xs">
              Recommended: Square image, at least 300x300 pixels, JPG or PNG format, max 2MB
            </p>
          </div>

          {/* Profile Information Section */}
          <div className="md:w-2/3">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="block font-serif text-sm text-ink-light mb-1">
                  Email
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-faded">
                    <Mail size={18} />
                  </div>
                  <Input
                    type="email"
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-3 font-serif bg-cream/50 border border-accent-tertiary/30 rounded-md text-ink-faded cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-ink-faded font-serif">
                  Your email address cannot be changed
                </p>
              </div>

              <div>
                <Label htmlFor="username" className="block font-serif text-sm text-ink-light mb-1">
                  Username
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-faded">
                    <User size={18} />
                  </div>
                  <Input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!isEditing || isSaving || isOffline}
                    className={`w-full pl-10 pr-4 py-3 font-serif ${!isEditing || isOffline ? 'bg-cream/50 cursor-not-allowed' : 'bg-cream'} border border-accent-tertiary/30 rounded-md focus:outline-none focus:ring-1 focus:ring-accent-primary`}
                    placeholder="Choose a username"
                  />
                </div>
                <p className="mt-1 text-xs text-ink-faded font-serif">
                  This will be displayed on your profile and projects
                </p>
              </div>

              <div>
                <Label htmlFor="bio" className="block font-serif text-sm text-ink-light mb-1">
                  About Me
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-ink-faded">
                    <PenTool size={18} />
                  </div>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={!isEditing || isSaving || isOffline}
                    rows={5}
                    className={`w-full pl-10 pr-4 py-3 font-serif ${!isEditing || isOffline ? 'bg-cream/50 cursor-not-allowed' : 'bg-cream'} border border-accent-tertiary/30 rounded-md focus:outline-none focus:ring-1 focus:ring-accent-primary`}
                    placeholder="Tell us a bit about yourself..."
                  />
                </div>
              </div>

              {saveMessage && (
                <div className={`p-3 rounded-md flex items-start ${saveMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                  {saveMessage.type === 'error' ? (
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="font-serif text-sm">{saveMessage.text}</p>
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSaving || (isEditing && isOffline)}
                  className={`px-6 py-3 font-serif rounded flex items-center justify-center transition-colors ${
                    isOffline && !isEditing 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : isEditing 
                        ? 'bg-accent-primary text-white hover:bg-accent-primary/90' 
                        : 'bg-accent-secondary text-white hover:bg-accent-secondary/90'
                  } ${(isSaving || (isEditing && isOffline)) ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {isSaving ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : isEditing ? (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <PenTool className="w-5 h-5 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
                
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      if (profile) {
                        setUsername(profile.username || '');
                        setBio(profile.bio || '');
                      }
                    }}
                    className="ml-4 px-6 py-3 font-serif border border-accent-tertiary/30 text-ink-light rounded hover:bg-cream transition-colors"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings; 