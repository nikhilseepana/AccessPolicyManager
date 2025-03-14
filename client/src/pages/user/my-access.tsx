import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function MyAccess() {
  // Fetch current user's access policies
  const { data: policies, isLoading } = useQuery({
    queryKey: ['/api/access-policies'],
    staleTime: 1000 * 60, // 1 minute
  });

  // Fetch schemas
  const { data: schemas } = useQuery({
    queryKey: ['/api/schemas'],
    staleTime: 1000 * 60, // 1 minute
  });

  // Fetch tables
  const { data: tables } = useQuery({
    queryKey: ['/api/tables'],
    staleTime: 1000 * 60, // 1 minute
  });

  // Group policies by schema
  const policyBySchema = policies?.reduce((grouped: any, policy: any) => {
    const schemaId = policy.schemaId;
    if (!grouped[schemaId]) {
      grouped[schemaId] = [];
    }
    grouped[schemaId].push(policy);
    return grouped;
  }, {});

  // Get schema name by id
  const getSchemaName = (schemaId: number) => {
    const schema = schemas?.find(s => s.id === schemaId);
    return schema?.name || 'Unknown Schema';
  };

  // Get table name by id
  const getTableName = (tableId: number) => {
    const table = tables?.find(t => t.id === tableId);
    return table?.name || 'Unknown Table';
  };

  // Get label for effect
  const getEffectLabel = (effect: string) => {
    switch(effect) {
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show empty state
  if (!policies || policies.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">My Current Access</h2>
        </div>
        <div className="p-6 text-center text-gray-500">
          <p>You don't have any access permissions yet.</p>
          <p className="mt-2">Request access to database resources to view them here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium">My Current Access</h2>
      </div>
      
      <div className="p-6">
        {policyBySchema && Object.keys(policyBySchema).map((schemaId) => (
          <div className="mb-6" key={schemaId}>
            <h3 className="text-base font-medium mb-3">{getSchemaName(parseInt(schemaId))}</h3>
            <div className="border border-gray-200 rounded overflow-hidden">
              <div className="grid grid-cols-3 bg-gray-100 px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                <div>Resource</div>
                <div>Access Type</div>
                <div>Fields</div>
              </div>
              <div className="divide-y divide-gray-200">
                {policyBySchema[schemaId].map((policy: any) => (
                  <div className="grid grid-cols-3 px-4 py-3 text-sm" key={policy.id}>
                    <div className="font-medium">{getTableName(policy.tableId)}</div>
                    <div>{getEffectLabel(policy.effect)}</div>
                    <div>
                      {policy.effect === 'allowAll' ? 'All fields' : 
                       (policy.fields as string[]).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
