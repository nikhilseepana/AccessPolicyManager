import { useMutation } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface CopyPermissionsModalProps {
  sourceUser: any;
  users: any[];
  onClose: () => void;
}

export default function CopyPermissionsModal({
  sourceUser,
  users,
  onClose,
}: CopyPermissionsModalProps) {
  const { toast } = useToast();
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false);

  // Copy permissions mutation
  const copyPermissionsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest({ path: '/api/access-policies/copy', method: 'POST', data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/access-policies'] });
      toast({
        title: 'Permissions copied',
        description: `Permissions successfully copied to the selected user.`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Failed to copy permissions',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle copy permissions
  const handleCopyPermissions = () => {
    if (!targetUserId) {
      toast({
        title: 'No user selected',
        description: 'Please select a user to copy permissions to.',
        variant: 'destructive',
      });
      return;
    }

    copyPermissionsMutation.mutate({
      sourceUserId: sourceUser.id,
      targetUserId: parseInt(targetUserId),
      replaceExisting,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Copy User Permissions</DialogTitle>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Select a user to copy permissions from{' '}
            <span className="font-medium">{sourceUser.email}</span> to:
          </p>

          <div className="mb-4">
            <Label htmlFor="targetUser" className="block text-sm font-medium text-gray-700 mb-1">
              Destination User
            </Label>
            <Select value={targetUserId} onValueChange={setTargetUserId}>
              <SelectTrigger id="targetUser">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="replaceExisting"
                checked={replaceExisting}
                onCheckedChange={(checked) => setReplaceExisting(!!checked)}
              />
              <Label htmlFor="replaceExisting" className="text-sm text-gray-700 cursor-pointer">
                Replace existing permissions
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCopyPermissions}
            disabled={!targetUserId || copyPermissionsMutation.isPending}
          >
            {copyPermissionsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Copying...
              </>
            ) : (
              'Copy Permissions'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
