import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import StatCard from '@/components/admin/stat-card';
import { Loader2 } from 'lucide-react';

interface AdminDashboardProps {
  onTabChange: (tab: 'dashboard' | 'requests' | 'users' | 'schema') => void;
}

export default function AdminDashboard({ onTabChange }: AdminDashboardProps) {
  // Fetch stats data
  const { data: accessRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['/api/access-requests'],
    staleTime: 1000 * 60, // 1 minute
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
    staleTime: 1000 * 60, // 1 minute
  });

  const { data: schemas, isLoading: isLoadingSchemas } = useQuery({
    queryKey: ['/api/schemas'],
    staleTime: 1000 * 60, // 1 minute
  });

  // Calculate stats
  const pendingRequests = accessRequests?.filter(req => req.status === 'pending').length || 0;
  const totalUsers = users?.length || 0;
  const totalSchemas = schemas?.length || 0;

  // Format relative time
  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffInHours = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Show loading state if data is being fetched
  if (isLoadingRequests || isLoadingUsers || isLoadingSchemas) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Pending Requests"
          value={pendingRequests}
          icon="pending_actions"
          actionText="View all requests"
          onAction={() => onTabChange('requests')}
        />
        <StatCard
          title="Active Users"
          value={totalUsers}
          icon="people"
          actionText="Manage users"
          onAction={() => onTabChange('users')}
        />
        <StatCard
          title="Total Schemas"
          value={totalSchemas}
          icon="schema"
          actionText="Manage schema"
          onAction={() => onTabChange('schema')}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Recent Access Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schema</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resources</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accessRequests && accessRequests.length > 0 ? (
                accessRequests.slice(0, 5).map((request) => {
                  const schema = schemas?.find(s => s.id === request.schemaId);
                  const user = users?.find(u => u.id === request.userId);
                  
                  return (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-primary-light rounded-full flex items-center justify-center text-white">
                            {user?.email.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{schema?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">Multiple resources</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatRelativeTime(request.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          className={`${
                            request.status === 'pending' ? 'text-primary hover:text-primary-dark' : 'text-gray-500 hover:text-gray-700'
                          } mr-3`}
                          onClick={() => onTabChange('requests')}
                        >
                          {request.status === 'pending' ? 'Review' : 'View'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No access requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-right">
          <button 
            className="text-primary text-sm font-medium flex items-center ml-auto"
            onClick={() => onTabChange('requests')}
          >
            View all requests
            <span className="material-icons text-sm ml-1">arrow_forward</span>
          </button>
        </div>
      </div>
    </>
  );
}
