import React, { useState, useRef, ChangeEvent } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { Upload, Camera, Save, User, Mail, PenTool, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AccountSettings: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading, error, updateProfile, uploadAvatar } = useProfile();
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
      <div className="w-full max-w-4xl mx-auto bg-paper dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-accent-tertiary/20 dark:border-dark-border-secondary p-8 my-8">
        <div className="flex justify-center items-center h-48">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="font-serif text-ink-light dark:text-dark-text-tertiary">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-paper dark:bg-dark-bg-secondary rounded-lg shadow-sm border border-accent-tertiary/20 dark:border-dark-border-secondary p-8 my-8">
      <h2 className="font-display text-3xl text-ink-dark dark:text-dark-text-primary mb-6 flex items-center">
        <User className="w-8 h-8 mr-3 text-accent-primary" />
        Account Settings
      </h2>

      {error && (
        <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md">
          <p className="text-red-700 dark:text-red-300 font-serif">{error}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Avatar Upload Section */}
        <div className="md:w-1/3 flex flex-col items-center">
          <div 
            className="relative w-48 h-48 rounded-full bg-cream dark:bg-dark-bg-tertiary border-4 border-accent-tertiary/30 dark:border-dark-border-primary overflow-hidden cursor-pointer group"
            onClick={handleAvatarClick}
          >
            {isUploadingAvatar ? (
              <div className="absolute inset-0 flex items-center justify-center bg-ink-dark/20 dark:bg-dark-bg-secondary/40">
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
                  <div className="w-full h-full flex items-center justify-center bg-accent-primary/10 dark:bg-dark-bg-tertiary text-accent-primary">
                    <User className="w-24 h-24" />
                  </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center bg-ink-dark/50 dark:bg-dark-bg-secondary/60 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-white text-center">
                    <Camera className="w-10 h-10 mx-auto mb-2" />
                    <p className="font-serif text-sm">Change Photo</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={isUploadingAvatar}
            className="mt-4 px-4 py-2 font-serif flex items-center border border-accent-tertiary/30 dark:border-dark-border-primary text-ink-light dark:text-dark-text-tertiary rounded hover:bg-cream dark:hover:bg-dark-bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Photo
          </button>

          <p className="mt-2 text-xs text-ink-faded dark:text-dark-text-muted font-serif text-center max-w-xs">
            Recommended: Square image, at least 300x300 pixels, JPG or PNG format, max 2MB
          </p>
        </div>

        {/* Profile Information Section */}
        <div className="md:w-2/3">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block font-serif text-sm text-ink-light dark:text-dark-text-tertiary mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-faded dark:text-dark-text-muted">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-3 font-serif bg-cream/50 dark:bg-dark-bg-tertiary/70 border border-accent-tertiary/30 dark:border-dark-border-secondary rounded-md text-ink-faded dark:text-dark-text-muted cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-ink-faded dark:text-dark-text-muted font-serif">
                Your email address cannot be changed
              </p>
            </div>

            <div>
              <label htmlFor="username" className="block font-serif text-sm text-ink-light dark:text-dark-text-tertiary mb-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-faded dark:text-dark-text-muted">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!isEditing || isSaving}
                  className={`w-full pl-10 pr-4 py-3 font-serif ${!isEditing ? 'bg-cream/50 dark:bg-dark-bg-tertiary/70 cursor-not-allowed' : 'bg-cream dark:bg-dark-bg-tertiary'} border border-accent-tertiary/30 dark:border-dark-border-primary rounded-md focus:outline-none focus:ring-1 focus:ring-accent-primary dark:text-dark-text-primary`}
                  placeholder="Choose a username"
                />
              </div>
              <p className="mt-1 text-xs text-ink-faded dark:text-dark-text-muted font-serif">
                This will be displayed on your profile and projects
              </p>
            </div>

            <div>
              <label htmlFor="bio" className="block font-serif text-sm text-ink-light dark:text-dark-text-tertiary mb-1">
                About Me
              </label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-ink-faded dark:text-dark-text-muted">
                  <PenTool size={18} />
                </div>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={!isEditing || isSaving}
                  rows={5}
                  className={`w-full pl-10 pr-4 py-3 font-serif ${!isEditing ? 'bg-cream/50 dark:bg-dark-bg-tertiary/70 cursor-not-allowed' : 'bg-cream dark:bg-dark-bg-tertiary'} border border-accent-tertiary/30 dark:border-dark-border-primary rounded-md focus:outline-none focus:ring-1 focus:ring-accent-primary dark:text-dark-text-primary`}
                  placeholder="Tell us a bit about yourself..."
                />
              </div>
            </div>

            {saveMessage && (
              <div className={`p-3 rounded-md flex items-start ${saveMessage.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/30' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/30'}`}>
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
                disabled={isSaving}
                className={`px-6 py-3 font-serif rounded flex items-center justify-center transition-colors ${isEditing ? 'bg-accent-primary text-white hover:bg-accent-primary/90 dark:bg-accent-primary/90 dark:hover:bg-accent-primary' : 'bg-accent-secondary text-white hover:bg-accent-secondary/90 dark:bg-accent-secondary/90 dark:hover:bg-accent-secondary'} disabled:opacity-60 disabled:cursor-not-allowed`}
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;