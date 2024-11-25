import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, Search, Edit, Trash2 } from 'lucide-react';
import { ResourceEditModal } from './ResourceEditModal';
import { useResourceStore } from '../store/resources';
import type { CustomResource } from '../types/k8s';

function getStatusColor(status: string | undefined) {
  switch (status?.toLowerCase()) {
    case 'running':
    case 'ready':
    case 'active':
      return 'text-green-500';
    case 'pending':
    case 'provisioning':
      return 'text-yellow-500';
    case 'failed':
    case 'error':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

function StatusIcon({ status }: { status: string | undefined }) {
  const color = getStatusColor(status);
  
  switch (status?.toLowerCase()) {
    case 'running':
    case 'ready':
    case 'active':
      return <CheckCircle2 className={`h-5 w-5 ${color}`} />;
    case 'pending':
    case 'provisioning':
      return <Clock className={`h-5 w-5 ${color}`} />;
    default:
      return <AlertCircle className={`h-5 w-5 ${color}`} />;
  }
}

export function ResourceList() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState({
    namespace: '',
    kind: '',
    status: '',
  });
  const [selectedResource, setSelectedResource] = React.useState<CustomResource | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { resources, updateResource, deleteResource } = useResourceStore();
  const queryClient = useQueryClient();

  const { data: queryResources = [], isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => Promise.resolve(resources),
    initialData: resources,
  });

  const filteredResources = React.useMemo(() => {
    return queryResources.filter((resource) => {
      const searchLower = search.toLowerCase();
      if (search && !Object.values(resource.metadata).some(value => 
        String(value).toLowerCase().includes(searchLower)
      )) {
        return false;
      }

      if (filters.namespace && resource.metadata.namespace !== filters.namespace) {
        return false;
      }
      if (filters.kind && resource.kind !== filters.kind) {
        return false;
      }
      if (filters.status && resource.status?.phase !== filters.status) {
        return false;
      }

      return true;
    });
  }, [queryResources, search, filters]);

  const uniqueValues = React.useMemo(() => {
    return {
      namespaces: [...new Set(queryResources.map(r => r.metadata.namespace))],
      kinds: [...new Set(queryResources.map(r => r.kind))],
      statuses: [...new Set(queryResources.map(r => r.status?.phase).filter(Boolean))],
    };
  }, [queryResources]);

  const handleSaveResource = (resource: CustomResource) => {
    updateResource(resource);
    setIsEditModalOpen(false);
  };

  const handleDeleteResource = async (resource: CustomResource) => {
    try {
      setIsDeleting(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      deleteResource(resource.metadata.uid);
      await queryClient.invalidateQueries({ queryKey: ['resources'] });
      setShowDeleteConfirm(null);
      setIsDeleting(false);
    } catch (error) {
      console.error('Failed to delete resource:', error);
      setIsDeleting(false);
    }
  };

  const handleEditResource = (resource: CustomResource) => {
    setSelectedResource(resource);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filters.namespace}
            onChange={(e) => setFilters(f => ({ ...f, namespace: e.target.value }))}
            className="border rounded-md bg-background px-3 py-2"
          >
            <option value="">All Namespaces</option>
            {uniqueValues.namespaces.map(ns => (
              <option key={ns} value={ns}>{ns}</option>
            ))}
          </select>
          <select
            value={filters.kind}
            onChange={(e) => setFilters(f => ({ ...f, kind: e.target.value }))}
            className="border rounded-md bg-background px-3 py-2"
          >
            <option value="">All Kinds</option>
            {uniqueValues.kinds.map(kind => (
              <option key={kind} value={kind}>{kind}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
            className="border rounded-md bg-background px-3 py-2"
          >
            <option value="">All Statuses</option>
            {uniqueValues.statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse bg-card rounded-lg border p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))
        ) : filteredResources.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No resources found
          </div>
        ) : (
          filteredResources.map((resource) => (
            <div key={resource.metadata.uid} className="bg-card rounded-lg border shadow-sm hover:border-primary transition-all duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <StatusIcon status={resource.status?.phase} />
                    <div>
                      <h3 className="font-semibold">{resource.metadata.name}</h3>
                      <p className="text-sm text-muted-foreground">{resource.kind}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditResource(resource)}
                      className="p-1 hover:bg-muted rounded-full"
                    >
                      <Edit className="h-4 w-4 text-primary" />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowDeleteConfirm(resource.metadata.uid)}
                        className="p-1 hover:bg-muted rounded-full"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                      {showDeleteConfirm === resource.metadata.uid && (
                        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-background border animate-in fade-in slide-in-from-bottom-2">
                          <div className="p-4">
                            <p className="text-sm mb-3">Are you sure you want to delete this resource?</p>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-3 py-1 text-sm rounded-md hover:bg-muted"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDeleteResource(resource)}
                                disabled={isDeleting}
                                className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                              >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Namespace</span>
                    <span>{resource.metadata.namespace}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span>{resource.status?.phase || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Replicas</span>
                    <span>{resource.status?.availableReplicas || 0} / {resource.spec.replicas}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-xs text-muted-foreground">
                    Created {new Date(resource.metadata.creationTimestamp).toLocaleString()}
                  </span>
                  <button
                    onClick={() => navigate(`/resources/${resource.metadata.uid}`)}
                    className="text-sm text-primary hover:text-primary/90 font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ResourceEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedResource(null);
        }}
        resource={selectedResource}
        onSave={handleSaveResource}
        onDelete={handleDeleteResource}
      />
    </div>
  );
}