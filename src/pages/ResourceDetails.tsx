import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResourceStore } from '../store/resources';
import { ResourceGraph } from '../components/ResourceGraph';
import { ResourceDetailModal } from '../components/ResourceDetailModal';
import { ResourceEditModal } from '../components/ResourceEditModal';
import { ArrowLeft, Edit, Trash2, Share } from 'lucide-react';
import { YamlEditor } from '../components/YamlEditor';
import yaml from 'js-yaml';

interface DetailResource {
  type: string;
  resource: any;
}

export function ResourceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { resources, updateResource, deleteResource } = useResourceStore();
  const [selectedDetailResource, setSelectedDetailResource] = React.useState<DetailResource | null>(null);
  const [showGraph, setShowGraph] = React.useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  const resource = resources.find(r => r.metadata.uid === id);

  if (!resource) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Resource Not Found</h2>
        <button
          onClick={() => navigate('/resources')}
          className="inline-flex items-center text-primary hover:text-primary/90"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Resources
        </button>
      </div>
    );
  }

  const handleSaveResource = (updatedResource: any) => {
    updateResource(updatedResource);
    setIsEditModalOpen(false);
  };

  const handleDeleteResource = () => {
    if (confirm('Are you sure you want to delete this resource?')) {
      deleteResource(resource.metadata.uid);
      navigate('/resources');
    }
  };

  const handleNodeClick = (nodeId: string) => {
    if (nodeId === 'main') return;
    
    const resourceType = nodeId.split('-')[0];
    const k8sResources = getKubernetesResources(resource);
    const detailResource = k8sResources[resourceType as keyof typeof k8sResources];
    
    if (detailResource) {
      setSelectedDetailResource({
        type: resourceType,
        resource: detailResource
      });
    }
  };

  const getKubernetesResources = (resource: any) => {
    const name = resource.metadata.name;
    const namespace = resource.metadata.namespace;

    return {
      pod: {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          name: `${name}-pod`,
          namespace,
          labels: { app: name },
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
            matchLabels: { app: name },
          },
          template: {
            metadata: {
              labels: { app: name },
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
          selector: { app: name },
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
    };
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/resources')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">{resource.metadata.name}</h1>
            <p className="text-lg text-muted-foreground">
              {resource.kind} in namespace {resource.metadata.namespace}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowGraph(!showGraph)}
            className="inline-flex items-center px-4 py-2 rounded-md border border-border hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Share className="h-4 w-4 mr-2" />
            {showGraph ? 'Hide Graph' : 'Show Graph'}
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button
            onClick={handleDeleteResource}
            className="inline-flex items-center px-4 py-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="bg-card rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Resource Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-sm font-medium">{resource.status?.phase || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm font-medium">
                  {new Date(resource.metadata.creationTimestamp).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Replicas</p>
                <p className="text-sm font-medium">
                  {resource.status?.availableReplicas || 0} / {resource.spec.replicas}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">YAML Configuration</h2>
            <div className="h-[400px] border rounded-lg overflow-hidden">
              <YamlEditor value={yaml.dump(resource)} onChange={() => {}} />
            </div>
          </div>
        </div>

        {showGraph && (
          <div className="bg-card rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Resource Graph</h2>
            <ResourceGraph 
              resource={resource} 
              onNodeClick={handleNodeClick}
              onClose={() => setShowGraph(false)}
            />
          </div>
        )}
      </div>

      <ResourceDetailModal
        isOpen={!!selectedDetailResource}
        onClose={() => setSelectedDetailResource(null)}
        resource={selectedDetailResource?.resource}
        type={selectedDetailResource?.type || ''}
      />

      <ResourceEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        resource={resource}
        onSave={handleSaveResource}
        onDelete={handleDeleteResource}
      />
    </div>
  );
}