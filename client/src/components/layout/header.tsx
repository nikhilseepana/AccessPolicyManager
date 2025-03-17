import { useQuery } from '@tanstack/react-query';
import { Shield, Bell, ChevronDown, UserCircle, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';

interface HeaderProps {
  onViewToggle?: (view: 'admin' | 'user') => void;
  viewAsUser: boolean;
}

export default function Header({ onViewToggle, viewAsUser }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Fetch notifications
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ['/api/notifications'],
    staleTime: 1000 * 30, // 30 seconds
  });

  // Count unread notifications
  const unreadCount = notifications.filter((notification: any) => !notification.read).length || 0;

  // Handle role change
  const handleRoleChange = (value: string) => {
    if (onViewToggle) {
      onViewToggle(value as 'admin' | 'user');
    }
  };

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Format notification time
  const formatNotificationTime = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - notifDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-xl font-medium">User Access Management</h1>
        </div>
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Notifications</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {notifications.length > 0 ? (
                  notifications.map((notification: any) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg ${notification.read ? 'bg-gray-100' : 'bg-blue-50'}`}
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium">{notification.message}</p>
                        <span className="text-xs text-gray-500">
                          {formatNotificationTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No notifications</p>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* User Menu */}
          <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-1">
                <span className="hidden md:inline-block">{user?.email}</span>
                <UserCircle className="h-5 w-5" />
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Role Switcher (for admins only) */}
          {onViewToggle && (
            <>
              <Separator orientation="vertical" className="h-6 bg-blue-400" />
              <Select value={viewAsUser ? 'user' : 'admin'} onValueChange={handleRoleChange}>
                <SelectTrigger className="bg-primary-dark text-white border-none w-auto">
                  <SelectValue placeholder="Select View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin View</SelectItem>
                  <SelectItem value="user">User View</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
