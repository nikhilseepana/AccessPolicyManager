import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RequestItem from '@/components/admin/request-item';

export default function AdminRequests() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch data
  const { data: accessRequests, isLoading } = useQuery({
    queryKey: ['/api/access-requests'],
    staleTime: 1000 * 30, // 30 seconds
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return await apiRequest('PATCH', `/api/access-requests/${requestId}`, { status: 'approved' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/access-requests'] });
      toast({
        title: 'Request approved',
        description: 'The user has been notified of the approval.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to approve request',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return await apiRequest('PATCH', `/api/access-requests/${requestId}`, { status: 'rejected' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/access-requests'] });
      toast({
        title: 'Request rejected',
        description: 'The user has been notified of the rejection.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to reject request',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle approve request
  const handleApproveRequest = (requestId: number) => {
    approveMutation.mutate(requestId);
  };

  // Handle reject request
  const handleRejectRequest = (requestId: number) => {
    rejectMutation.mutate(requestId);
  };

  // Filter requests
  const filteredRequests = accessRequests?.filter(request => {
    // Filter by status
    if (statusFilter !== 'all' && request.status !== statusFilter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !request.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium">Access Requests</h2>
        <div className="flex items-center">
          <div className="relative mr-4">
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {filteredRequests && filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <RequestItem
              key={request.id}
              request={request}
              onApprove={() => handleApproveRequest(request.id)}
              onReject={() => handleRejectRequest(request.id)}
              isPending={approveMutation.isPending || rejectMutation.isPending}
            />
          ))
        ) : (
          <div className="p-6 text-center text-gray-500">
            No access requests found
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing{' '}
          <span className="font-medium">
            {filteredRequests ? filteredRequests.length : 0}
          </span>{' '}
          of{' '}
          <span className="font-medium">
            {accessRequests ? accessRequests.length : 0}
          </span>{' '}
          requests
        </div>
      </div>
    </div>
  );
}
