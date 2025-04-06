import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Adjust path if needed
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Adjust path
import { Badge } from "@/components/ui/badge"; // Adjust path
import { Button } from "@/components/ui/button"; // Adjust path
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Adjust path
import { MoreHorizontal, User, Mail, Calendar, CreditCard, Edit, Settings, ShieldCheck, Trash2 } from 'lucide-react';
import EditUserDialog from './EditUserDialog';
import { cn } from '@/lib/utils';

// Ensure type matches the one in AdminDashboard
type AdminUserData = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  email: string | null;
  is_admin: boolean;
  subscription_status: string | null;
  created_at: string;
};

interface UsersTableProps {
  users: AdminUserData[];
  onUserUpdate: (updatedUser: Partial<AdminUserData> & { user_id: string }) => void;
  onSubscriptionManage: (userId: string) => void;
}

// Helper to format date
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

// Helper to get initials for Avatar Fallback
const getInitials = (name: string | null | undefined): string => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
};

// Helper function for subscription status badge styling
const getSubscriptionBadgeVariant = (status: string | null): React.ComponentProps<typeof Badge>['variant'] => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'trialing':
      return 'default'; // Use default (or a specific 'success' variant if defined)
    case 'past_due':
    case 'incomplete':
      return 'destructive';
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'outline';
    default:
      return 'secondary'; // For 'N/A', 'Pending', etc.
  }
};

const UsersTable: React.FC<UsersTableProps> = ({ users, onUserUpdate, onSubscriptionManage }) => {
  const [editingUser, setEditingUser] = useState<AdminUserData | null>(null);

  if (!users || users.length === 0) {
    return <p className="text-center text-ink-light py-8 font-serif">No users found.</p>;
  }

  const handleEditClick = (user: AdminUserData) => {
    setEditingUser(user);
  };

  const handleCloseDialog = () => {
    setEditingUser(null);
  };

  const handleSaveChanges = (updatedData: Partial<AdminUserData> & { user_id: string }) => {
    onUserUpdate(updatedData);
    setEditingUser(null);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader className="bg-cream dark:bg-paper-dark">
            <TableRow className="border-b border-accent-tertiary/30 dark:border-accent-tertiary-dark/30">
              <TableHead className="px-4 py-3 text-left text-sm font-sans font-medium text-ink-dark dark:text-ink-dark-dark tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-ink-light dark:text-ink-light-dark" /> User
                </div>
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-sans font-medium text-ink-dark dark:text-ink-dark-dark tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-ink-light dark:text-ink-light-dark" /> Email
                </div>
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-sans font-medium text-ink-dark dark:text-ink-dark-dark tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-ink-light dark:text-ink-light-dark" /> Joined Date
                </div>
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-sans font-medium text-ink-dark dark:text-ink-dark-dark tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-ink-light dark:text-ink-light-dark" /> Subscription
                </div>
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-sans font-medium text-ink-dark dark:text-ink-dark-dark tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-ink-light dark:text-ink-light-dark" /> Admin Status
                </div>
              </TableHead>
              <TableHead className="px-4 py-3 text-right text-sm font-sans font-medium text-ink-dark dark:text-ink-dark-dark tracking-wider whitespace-nowrap">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="dark:divide-accent-tertiary-dark/20">
            {users.map((user) => (
              <TableRow key={user.user_id} className="border-b border-accent-tertiary/20 dark:border-accent-tertiary-dark/20 hover:bg-accent-primary/5 dark:hover:bg-accent-primary-dark/10 transition-colors duration-150">
                <TableCell className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url ?? undefined} alt={user.username ?? 'User'} />
                      <AvatarFallback className="text-xs font-medium bg-accent-tertiary dark:bg-accent-tertiary-dark text-ink-light dark:text-ink-light-dark font-sans">
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-serif font-medium text-ink-dark dark:text-ink-dark-dark">{user.username || 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm font-serif text-ink-light dark:text-ink-light-dark whitespace-nowrap">{user.email || 'N/A'}</TableCell>
                <TableCell className="px-4 py-3 text-sm font-serif text-ink-light dark:text-ink-light-dark whitespace-nowrap">{formatDate(user.created_at)}</TableCell>
                <TableCell className="px-4 py-3 text-sm whitespace-nowrap">
                  <Badge
                    variant={getSubscriptionBadgeVariant(user.subscription_status)}
                    className={cn(
                      "font-sans font-normal text-xs px-1.5 py-0.5 border",
                      getSubscriptionBadgeVariant(user.subscription_status) === 'default' && "bg-accent-primary/10 text-accent-primary border-accent-primary/20 dark:bg-accent-primary-dark/20 dark:text-accent-primary-dark dark:border-accent-primary-dark/30",
                      getSubscriptionBadgeVariant(user.subscription_status) === 'destructive' && "bg-danger/10 text-danger border-danger/30 dark:bg-danger-dark/20 dark:text-danger-dark dark:border-danger-dark/40",
                      getSubscriptionBadgeVariant(user.subscription_status) === 'outline' && "text-ink-light border-accent-tertiary/50 dark:text-ink-light-dark dark:border-accent-tertiary-dark/50",
                      getSubscriptionBadgeVariant(user.subscription_status) === 'secondary' && "bg-accent-tertiary/50 text-ink-light border-accent-tertiary/50 dark:bg-accent-tertiary-dark/40 dark:text-ink-light-dark dark:border-accent-tertiary-dark/50"
                    )}
                  >
                    {user.subscription_status || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm whitespace-nowrap">
                  <Badge
                    variant={user.is_admin ? 'default' : 'secondary'}
                    className={cn(
                      "font-sans font-normal text-xs px-1.5 py-0.5 border",
                      user.is_admin
                        ? "bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30 dark:bg-accent-yellow-dark/20 dark:text-accent-yellow-dark dark:border-accent-yellow-dark/30"
                        : "bg-accent-tertiary/50 text-ink-light border-accent-tertiary/50 dark:bg-accent-tertiary-dark/40 dark:text-ink-light-dark dark:border-accent-tertiary-dark/50"
                    )}
                  >
                    {user.is_admin ? 'Admin' : 'User'}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-right whitespace-nowrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-ink-light dark:text-ink-light-dark hover:bg-accent-tertiary/30 dark:hover:bg-accent-tertiary-dark/30 hover:text-ink-dark dark:hover:text-ink-dark-dark">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="font-serif bg-paper dark:bg-paper-dark shadow-lg border-accent-tertiary/20 dark:border-accent-tertiary-dark/20">
                      <DropdownMenuItem
                        className="text-sm text-ink-dark dark:text-ink-dark-dark hover:bg-accent-tertiary/20 dark:hover:bg-accent-tertiary-dark/20 cursor-pointer"
                        onClick={() => handleEditClick(user)}
                      >
                        <Edit className="mr-2 h-4 w-4 text-ink-light dark:text-ink-light-dark" />
                        <span>Edit User</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-sm text-ink-dark dark:text-ink-dark-dark hover:bg-accent-tertiary/20 dark:hover:bg-accent-tertiary-dark/20 cursor-pointer"
                        onClick={() => onSubscriptionManage(user.user_id)}
                      >
                        <Settings className="mr-2 h-4 w-4 text-ink-light dark:text-ink-light-dark" />
                        <span>Manage Subscription</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          isOpen={!!editingUser}
          onClose={handleCloseDialog}
          onSave={handleSaveChanges}
        />
      )}
    </>
  );
};

export default UsersTable; 