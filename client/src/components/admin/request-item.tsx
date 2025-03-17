import { useQuery } from '@tanstack/react-query';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface RequestItemProps {
  request: any;
  onApprove: () => void;
  onReject: () => void;
  isPending: boolean;
}

export default function RequestItem({ request, onApprove, onReject, isPending }: RequestItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  // Fetch schemas
  const { data: schemas } = useQuery({
    queryKey: ['/api/schemas'],
    staleTime: 1000 * 60, // 1 minute
  });

  // Get schema name
  const getSchemaName = (schemaId: number) => {
    const schema = schemas?.find((s: any) => s.id === schemaId);
    return schema?.name || 'Unknown Schema';
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

  // Get initials from email
  const getInitials = (email: string) => {
    if (!email) return '';
    return email.substring(0, 2).toUpperCase();
  };

  // Get background color based on email
  const getAvatarColor = (email: string) => {
    if (!email) return 'bg-primary-light';

    const colors = [
      'bg-primary-light',
      'bg-green-500',
      'bg-purple-500',
      'bg-yellow-500',
      'bg-pink-500',
    ];

    const hash = email.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    return colors[hash % colors.length];
  };

  // Get effect label
  const getEffectLabel = (effect: string) => {
    switch (effect) {
      case 'allow':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Allow
          </span>
        );
      case 'deny':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Deny
          </span>
        );
      case 'allowAll':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            AllowAll
          </span>
        );
      default:
        return effect;
    }
  };

  // Handle edit permissions
  const handleEditPermission = (item: any) => {
    setEditItem(item);
    setShowEditModal(true);
  };

  // Render request details
  const renderRequestDetails = () => {
    if (!expanded) return null;

    return (
      <div className="mt-4 bg-gray-50 rounded p-4">
        <div className="text-sm text-gray-700 mb-2">
          <span className="font-medium">Schema:</span> {getSchemaName(request.schemaId)}
        </div>
        <div className="border border-gray-200 rounded overflow-hidden">
          <div className="grid grid-cols-4 bg-gray-100 px-4 py-2 text-xs font-medium text-gray-500 uppercase">
            <div>Resource</div>
            <div>Access Type</div>
            <div>Fields</div>
            <div>Actions</div>
          </div>
          <div className="divide-y divide-gray-200">
            {request.items &&
              request.items.map((item: any) => (
                <div className="grid grid-cols-4 px-4 py-3 text-sm" key={item.id}>
                  <div className="font-medium">{item.table?.name || 'Unknown'}</div>
                  <div>{getEffectLabel(item.effect)}</div>
                  <div>
                    {item.effect === 'allowAll'
                      ? 'All fields'
                      : item.fields && item.fields.length > 0
                        ? item.fields.join(', ')
                        : 'No fields'}
                  </div>
                  <div>
                    {request.status === 'pending' && (
                      <button
                        className="text-primary hover:text-primary-dark text-sm"
                        onClick={() => handleEditPermission(item)}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="p-6 hover:bg-gray-50 transition-colors duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div
              className={`flex-shrink-0 h-10 w-10 ${getAvatarColor(request.user?.email)} rounded-full flex items-center justify-center text-white`}
            >
              {getInitials(request.user?.email)}
            </div>
            <div className="ml-4">
              <div className="flex items-center">
                <h3 className="text-base font-medium text-gray-900">{request.user?.email}</h3>
                <span
                  className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    request.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : request.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Requested {formatRelativeTime(request.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            {request.status === 'pending' && (
              <>
                <Button variant="default" className="mr-2" onClick={onApprove} disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Approve
                </Button>
                <Button variant="outline" onClick={onReject} disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Reject
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="ml-2"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {renderRequestDetails()}
      </div>

      {/* Edit Permission Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Access Permission</DialogTitle>
          </DialogHeader>

          {editItem && (
            <div className="py-4">
              <div className="mb-4">
                <p className="text-sm font-medium">
                  Resource: <span className="font-normal">{editItem.table?.name}</span>
                </p>
              </div>

              <div className="mb-4">
                <Label className="mb-2 block">Access Type</Label>
                <RadioGroup defaultValue={editItem.effect} className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="allowAll" id="allowAll" />
                    <Label htmlFor="allowAll">AllowAll</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="allow" id="allow" />
                    <Label htmlFor="allow">Allow</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="deny" id="deny" />
                    <Label htmlFor="deny">Deny</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="mb-4">
                <Label className="mb-2 block">Fields</Label>
                {/* Field selection would go here */}
                <p className="text-sm text-gray-500">
                  Currently selected: {editItem.fields ? editItem.fields.join(', ') : 'None'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
