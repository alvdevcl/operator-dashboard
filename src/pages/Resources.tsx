import React from 'react';
import { ResourceList } from '../components/ResourceList';
import { CreateResource } from '../components/CreateResource';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export function Resources() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['resources'] });
    await queryClient.refetchQueries({ queryKey: ['resources'] });
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Resources</h1>
          <p className="text-lg text-muted-foreground">
            Manage your Kubernetes resources
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <CreateResource />
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <ResourceList />
      </div>
    </div>
  );
}