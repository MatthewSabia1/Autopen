import React, { useState, useRef, ChangeEvent } from 'react';
import { useProfile } from '../hooks/useProfile';
import { Upload, Camera, Save, User, Mail, PenTool, CheckCircle, AlertCircle, Loader, WifiOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading, error, isOffline, updateProfile, uploadAvatar } = useProfile();
  const [username, setUsername] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form values when profile is loaded
  React.useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    const { error } = await updateProfile({
      username,
      bio
    });

    setIsSaving(false);

    if (error) {
      setSaveMessage({
        type: 'error',
        text: error
      });
    } else {
      setSaveMessage({
        type: 'success',
        text: 'Profile updated successfully!'
      });
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
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
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setSaveMessage({
        type: 'error',
        text: 'Please upload an image file'
      });
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setSaveMessage({
        type: 'error',
        text: 'Image size should be less than 2MB'
      });
      return;
    }

    setIsUploadingAvatar(true);
    setSaveMessage(null);

    const { error } = await uploadAvatar(file);
    
    setIsUploadingAvatar(false);

    if (error) {
      setSaveMessage({
        type: 'error',
        text: error
      });
    } else {
      setSaveMessage({
        type: 'success',
        text: 'Profile picture updated successfully!'
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-paper rounded-lg shadow-sm border border-accent-tertiary/20 p-8 my-8">
        <div className="flex justify-center items-center h-48">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="font-serif text-ink-light">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-paper rounded-lg shadow-sm border border-accent-tertiary/20 p-8 my-8">
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
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-accent-primary/10 text-accent-primary">
                    <User className="w-24 h-24" />
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

          <button
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
          </button>

          <p className="mt-2 text-xs text-ink-faded font-serif text-center max-w-xs">
            Recommended: Square image, at least 300x300 pixels, JPG or PNG format, max 2MB
          </p>
        </div>

        {/* Profile Information Section */}
        <div className="md:w-2/3">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block font-serif text-sm text-ink-light mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-faded">
                  <Mail size={18} />
                </div>
                <input
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
              <label htmlFor="username" className="block font-serif text-sm text-ink-light mb-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-faded">
                  <User size={18} />
                </div>
                <input
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
              <label htmlFor="bio" className="block font-serif text-sm text-ink-light mb-1">
                About Me
              </label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-ink-faded">
                  <PenTool size={18} />
                </div>
                <textarea
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
              <button
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
              </button>
              
              {isEditing && (
                <button
                  type="button"
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
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;