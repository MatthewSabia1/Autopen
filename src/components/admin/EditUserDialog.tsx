import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../../supabase/auth'; // Import useAuth to check if editing self

// Type matching the user data structure
type AdminUserData = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  email: string | null;
  is_admin: boolean;
  subscription_status: string | null;
  created_at: string;
};

interface EditUserDialogProps {
  user: AdminUserData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: { user_id: string; username?: string | null; is_admin?: boolean }) => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ user, isOpen, onClose, onSave }) => {
  const { user: currentUser } = useAuth(); // Get the currently logged-in user
  const [username, setUsername] = useState(user.username || '');
  const [isAdmin, setIsAdmin] = useState(user.is_admin);
  const [isSaving, setIsSaving] = useState(false); // Add saving state

  // Reset state if the user prop changes (e.g., opening the dialog for a different user)
  useEffect(() => {
    setUsername(user.username || '');
    setIsAdmin(user.is_admin);
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedData: { user_id: string; username?: string | null; is_admin?: boolean } = { user_id: user.user_id };
      if (username !== (user.username || '')) {
        updatedData.username = username;
      }
      if (isAdmin !== user.is_admin) {
        updatedData.is_admin = isAdmin;
      }
      // Only call onSave if there are actual changes
      if (Object.keys(updatedData).length > 1) {
         await onSave(updatedData); // Make onSave potentially async
      }
      onClose(); // Close dialog on successful save or if no changes
    } catch (error) {
        console.error("Failed to save user changes:", error);
        // Handle error display to the user if needed (e.g., using a toast notification)
    } finally {
        setIsSaving(false);
    }
  };

  // Prevent admin from disabling their own admin status in the dialog
  const isEditingSelf = currentUser?.id === user.user_id;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] bg-paper dark:bg-paper-dark border-accent-tertiary/20 dark:border-accent-tertiary-dark/20 font-serif">
        <DialogHeader className="pb-4 border-b border-accent-tertiary/20 dark:border-accent-tertiary-dark/20">
          <DialogTitle className="font-display text-lg font-medium text-ink-dark dark:text-ink-dark-dark">Edit User Profile</DialogTitle>
          <DialogDescription className="text-sm text-ink-light dark:text-ink-light-dark">
            Modify user details for {user.email || 'this user'}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-6">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right text-sm font-sans font-medium text-ink-dark dark:text-ink-dark-dark">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="col-span-3 font-serif border-accent-tertiary/30 dark:border-accent-tertiary-dark/40 focus:border-accent-primary dark:focus:border-accent-primary-dark bg-cream dark:bg-paper-well focus:bg-paper dark:focus:bg-paper-dark text-ink-dark dark:text-ink-dark-dark"
              placeholder="Enter username"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isAdmin" className="text-right text-sm font-sans font-medium text-ink-dark dark:text-ink-dark-dark">
              Admin Status
            </Label>
            <div className="col-span-3 flex items-center">
               <Switch
                 id="isAdmin"
                 checked={isAdmin}
                 onCheckedChange={setIsAdmin}
                 disabled={isSaving || isEditingSelf}
                 aria-readonly={isEditingSelf}
                 className="data-[state=checked]:bg-accent-primary data-[state=unchecked]:bg-accent-tertiary dark:data-[state=checked]:bg-accent-primary-dark dark:data-[state=unchecked]:bg-accent-tertiary-dark"
               />
               <span className={`ml-2 text-xs ${isEditingSelf ? 'text-ink-faded dark:text-ink-faded-dark' : 'text-ink-light dark:text-ink-light-dark'}`}>
                   {isAdmin ? 'Enabled' : 'Disabled'} {isEditingSelf ? '(Cannot change own status)' : ''}
               </span>
             </div>
          </div>
        </div>
        <DialogFooter className="pt-4 border-t border-accent-tertiary/20 dark:border-accent-tertiary-dark/20">
          <DialogClose asChild>
            <Button variant="outline" className="text-ink-light dark:text-ink-light-dark border-accent-tertiary/30 dark:border-accent-tertiary-dark/50 hover:border-accent-primary/30 dark:hover:border-accent-primary-dark/30 hover:bg-accent-tertiary/20 dark:hover:bg-accent-tertiary-dark/20" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
          </DialogClose>
          <Button
             type="button"
             onClick={handleSave}
             className="bg-accent-primary text-white hover:bg-accent-secondary dark:bg-accent-primary-dark dark:hover:bg-accent-secondary-dark"
             disabled={isSaving || (username === (user.username || '') && isAdmin === user.is_admin)}
           >
             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog; 