import React from 'react';
import { AlertCircle, CheckCircle2, Clock, Search, Edit, Trash2, ChevronDown, ChevronRight, Box, Shield, Cog, Globe, Database } from 'lucide-react';
import { ResourceEditModal } from './ResourceEditModal';
import { useResourceStore } from '../store/resources';
import { useQuery } from '@tanstack/react-query';
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

interface KubernetesResources {
  pod?: any;
  deployment?: any;
  service?: any;
  ingress?: any;
  configMap?: any;
  secret?: any;
}

export function ResourceList() {
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState({
    namespace: '',
    kind: '',
    status: '',
  });
  const [selectedResource, setSelectedResource] = React.useState<CustomResource | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  const { resources, updateResource, deleteResource } = useResourceStore();

  // Use React Query to manage resources
  const { data: queryResources, isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => Promise.resolve(resources),
    initialData: resources,
  });

  const filteredResources = React.useMemo(() => {
    return queryResources.filter((resource) => {
      // Search
      const searchLower = search.toLowerCase();
      if (search && !Object.values(resource.metadata).some(value => 
        String(value).toLowerCase().includes(searchLower)
      )) {
        return false;
      }

      // Filters
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

  const handleDeleteResource = (resource: CustomResource) => {
    deleteResource(resource.metadata.uid);
    setIsEditModalOpen(false);
  };

  const handleEditResource = (resource: CustomResource) => {
    setSelectedResource(resource);
    setIsEditModalOpen(true);
  };

  const toggleRowExpansion = (uid: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(uid)) {
      newExpandedRows.delete(uid);
    } else {
      newExpandedRows.add(uid);
    }
    setExpandedRows(newExpandedRows);
  };

  const getKubernetesResources = (resource: CustomResource): KubernetesResources => {
    const name = resource.metadata.name;
    const namespace = resource.metadata.namespace;

    return {
      pod: {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          name: `${name}-pod`,
          namespace,
          labels: {
            app: name,
          },
        },
        spec: {
          containers: [{
            name: name,
            image: resource.spec.image,
            ports: [{
              containerPort: resource.spec.service?.targetPort || 8080,
            }],
          }],
        },
      },
      deployment: {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
          name: `${name}-deployment`,
          namespace,
        },
        spec: {
          replicas: resource.spec.replicas || 1,
          selector: {
            matchLabels: {
              app: name,
            },
          },
          template: {
            metadata: {
              labels: {
                app: name,
              },
            },
            spec: {
              containers: [{
                name: name,
                image: resource.spec.image,
                ports: [{
                  containerPort: resource.spec.service?.targetPort || 8080,
                }],
              }],
            },
          },
        },
      },
      service: resource.spec.service && {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
          name: `${name}-service`,
          namespace,
        },
        spec: {
          type: resource.spec.service.type || 'ClusterIP',
          ports: [{
            port: resource.spec.service.port || 80,
            targetPort: resource.spec.service.targetPort || 8080,
          }],
          selector: {
            app: name,
          },
        },
      },
      ingress: resource.spec.ingress?.enabled && {
        apiVersion: 'networking.k8s.io/v1',
        kind: 'Ingress',
        metadata: {
          name: `${name}-ingress`,
          namespace,
          annotations: resource.spec.ingress.annotations || {},
        },
        spec: {
          rules: [{
            host: resource.spec.ingress.host,
            http: {
              paths: [{
                path: resource.spec.ingress.path || '/',
                pathType: resource.spec.ingress.pathType || 'Prefix',
                backend: {
                  service: {
                    name: `${name}-service`,
                    port: {
                      number: resource.spec.service?.port || 80,
                    },
                  },
                },
              }],
            },
          }],
          tls: resource.spec.ingress.tls,
        },
      },
      configMap: {
        apiVersion: 'v1',
        kind: 'ConfigMap',
        metadata: {
          name: `${name}-config`,
          namespace,
        },
        data: {
          'app.properties': `environment=${namespace}\nservice.name=${name}`,
        },
      },
      secret: {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
          name: `${name}-secret`,
          namespace,
        },
        type: 'Opaque',
        data: {
          'api.key': Buffer.from('your-api-key').toString('base64'),
          'api.secret': Buffer.from('your-api-secret').toString('base64'),
        },
      },
    };
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

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="w-8 px-6 py-3"></th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Namespace
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Kind
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Age
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                </td>
              </tr>
            ) : filteredResources.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">
                  No resources found
                </td>
              </tr>
            ) : (
              filteredResources.map((resource) => (
                <React.Fragment key={resource.metadata.uid}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleRowExpansion(resource.metadata.uid)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                      >
                        {expandedRows.has(resource.metadata.uid) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusIcon status={resource.status?.phase} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {resource.metadata.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {resource.metadata.namespace}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {resource.kind}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(resource.metadata.creationTimestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditResource(resource)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                        >
                          <Edit className="h-4 w-4 text-primary" />
                        </button>
                        <button
                          onClick={() => handleDeleteResource(resource)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(resource.metadata.uid) && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                        <div className="space-y-4">
                          <h4 className="font-medium text-sm">Associated Kubernetes Resources</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(getKubernetesResources(resource)).map(([key, value]) => {
                              if (!value) return null;
                              
                              const getIcon = () => {
                                switch (key) {
                                  case 'pod':
                                    return <Box className="h-5 w-5 text-blue-500" />;
                                  case 'deployment':
                                    return <Database className="h-5 w-5 text-purple-500" />;
                                  case 'service':
                                    return <Globe className="h-5 w-5 text-green-500" />;
                                  case 'ingress':
                                    return <Globe className="h-5 w-5 text-orange-500" />;
                                  case 'configMap':
                                    return <Cog className="h-5 w-5 text-yellow-500" />;
                                  case 'secret':
                                    return <Shield className="h-5 w-5 text-red-500" />;
                                  default:
                                    return null;
                                }
                              };

                              return (
                                <div key={key} className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                                  <div className="flex items-center gap-2 mb-2">
                                    {getIcon()}
                                    <h5 className="font-medium capitalize">{key}</h5>
                                  </div>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    <p>Name: {value.metadata.name}</p>
                                    <p>Namespace: {value.metadata.namespace}</p>
                                    {key === 'deployment' && (
                                      <p>Replicas: {value.spec.replicas}</p>
                                    )}
                                    {key === 'service' && (
                                      <p>Type: {value.spec.type}</p>
                                    )}
                                    {key === 'ingress' && value.spec.rules?.[0] && (
                                      <p>Host: {value.spec.rules[0].host}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
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