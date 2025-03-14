import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function MyRequests() {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // Fetch user's access requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['/api/access-requests'],
    staleTime: 1000 * 30, // 30 seconds
  });

  // Fetch schemas
  const { data: schemas } = useQuery({
    queryKey: ['/api/schemas'],
    staleTime: 1000 * 60, // 1 minute
  });

  // Handle viewing request details
  const handleViewRequestDetails = (requestId: number) => {
    const request = requests?.find(r => r.id === requestId);
    setSelectedRequest(request);
  };

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

  // Get schema name
  const getSchemaName = (schemaId: number) => {
    const schema = schemas?.find(s => s.id === schemaId);
    return schema?.name || 'Unknown';
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Rejected
          </span>
        );
      default:
        return status;
    }
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
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">My Access Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schema</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests && requests.length > 0 ? (
                requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getSchemaName(request.schemaId)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatRelativeTime(request.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        className="text-primary hover:text-primary-dark" 
                        onClick={() => handleViewRequestDetails(request.id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No access requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing{' '}
            <span className="font-medium">
              {requests ? requests.length : 0}
            </span>{' '}
            requests
          </div>
        </div>
      </div>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Submitted {selectedRequest && formatRelativeTime(selectedRequest.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="mt-4">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div className="mb-1">
                  <span className="text-sm font-medium text-gray-500">Schema:</span>{' '}
                  <span className="text-sm">{getSchemaName(selectedRequest.schemaId)}</span>
                </div>
                {selectedRequest.reason && (
                  <div className="mb-1">
                    <span className="text-sm font-medium text-gray-500">Reason:</span>{' '}
                    <span className="text-sm">{selectedRequest.reason}</span>
                  </div>
                )}
              </div>
              
              {selectedRequest.items && selectedRequest.items.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Requested Resources:</h4>
                  {selectedRequest.items.map((item: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded mb-2">
                      <div className="text-sm">
                        <span className="font-medium">Table:</span> {item.table?.name}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Access Type:</span>{' '}
                        {item.effect.charAt(0).toUpperCase() + item.effect.slice(1)}
                      </div>
                      {item.effect !== 'allowAll' && (
                        <div className="text-sm">
                          <span className="font-medium">Fields:</span>{' '}
                          {item.fields?.join(', ') || 'None'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
