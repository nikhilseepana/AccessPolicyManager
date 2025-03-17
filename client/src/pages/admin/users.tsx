import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { useState } from 'react';

import CopyPermissionsModal from '@/components/admin/copy-permissions-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function AdminUsers() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/users'],
    staleTime: 1000 * 60, // 1 minute
  });

  // Fetch schemas
  const { data: schemas } = useQuery({
    queryKey: ['/api/schemas'],
    staleTime: 1000 * 60, // 1 minute
  });

  // Fetch policies
  const { data: allPolicies } = useQuery({
    queryKey: ['/api/access-policies'],
    staleTime: 1000 * 60, // 1 minute
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest({
        path: `/api/users/${userId}`,
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'User deleted',
        description: 'The user has been successfully deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete user',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle view user permissions
  const handleViewUserPermissions = (userId: number) => {
    // Implementation would depend on UI requirements
    // Could show a modal or navigate to a dedicated page
    toast({
      title: 'View Permissions',
      description: 'This functionality would show detailed user permissions.',
    });
  };

  // Handle copy user permissions
  const handleCopyUserPermissions = (user: any) => {
    setSelectedUser(user);
    setShowCopyModal(true);
  };

  // Handle delete user
  const handleDeleteUser = (userId: number) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Generate user initials
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  // Get background color based on user id
  const getUserColor = (id: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];
    return colors[id % colors.length];
  };

  // Filter users by search term
  const filteredUsers = users?.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get resources for user
  const getUserResources = (userId: number) => {
    const userPolicies = allPolicies?.filter((policy) => policy.userId === userId) || [];

    // Get unique schemas
    const schemaIds = [...new Set(userPolicies.map((policy) => policy.schemaId))];
    const schemaNames = schemaIds.map((id) => {
      const schema = schemas?.find((s) => s.id === id);
      return schema?.name || 'Unknown';
    });

    return schemaNames.join(', ') || 'None';
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium">User Management</h2>
          <div className="flex items-center">
            <div className="relative mr-4">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            <Button className="flex items-center">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Schemas
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Last Activity
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`flex-shrink-0 h-8 w-8 ${getUserColor(user.id)} rounded-full flex items-center justify-center text-white`}
                        >
                          {getInitials(user.email)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getUserResources(user.id)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-primary hover:text-primary-dark mr-3"
                        onClick={() => handleViewUserPermissions(user.id)}
                      >
                        View
                      </button>
                      <button
                        className="text-gray-500 hover:text-gray-700 mr-3"
                        onClick={() => handleCopyUserPermissions(user)}
                      >
                        Copy
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{filteredUsers ? filteredUsers.length : 0}</span>{' '}
            of <span className="font-medium">{users ? users.length : 0}</span> users
          </div>
        </div>
      </div>

      {showCopyModal && selectedUser && (
        <CopyPermissionsModal
          sourceUser={selectedUser}
          users={users?.filter((u) => u.id !== selectedUser.id) || []}
          onClose={() => setShowCopyModal(false)}
        />
      )}
    </>
  );
}
