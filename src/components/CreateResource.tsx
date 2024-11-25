import React from 'react';
import { Plus, X, AlertCircle, FileCode, FormInput, Import, Save, Copy } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { YamlEditor } from './YamlEditor';
import { useResourceStore } from '../store/resources';
import yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';
import { useQueryClient } from '@tanstack/react-query';

const catalogTemplates = [
  {
    id: 'auth-service',
    name: 'Authentication Service',
    yaml: `apiVersion: microservice.alveotech.com/v1alpha1
kind: AuthService
metadata:
  name: auth-service
  namespace: microservice-operator
spec:
  replicas: 1
  image: ac-m2repo-prod.asset-control.com:5443/auth-service:1.0.0
  service:
    type: ClusterIP
    port: 80
    targetPort: 8080
  ingress:
    enabled: true
    host: "auth.alveotech.com"
    path: "/"
    pathType: "Prefix"
    annotations:
      kubernetes.io/ingress.class: nginx`
  },
  {
    id: 'auth-ui',
    name: 'Authentication UI',
    yaml: `apiVersion: microservice.alveotech.com/v1alpha1
kind: AuthUI
metadata:
  name: auth-ui
  namespace: microservice-operator
spec:
  replicas: 1
  image: ac-m2repo-prod.asset-control.com:5443/auth-ui:1.0.0
  service:
    type: ClusterIP
    port: 80
    targetPort: 8080
  ingress:
    enabled: true
    host: "auth-ui.alveotech.com"
    path: "/"
    pathType: "Prefix"
    annotations:
      kubernetes.io/ingress.class: nginx`
  }
];

interface ResourceForm {
  name: string;
  namespace: string;
  kind: string;
  replicas: number;
  image: string;
  service: {
    type: string;
    port: number;
    targetPort: number;
  };
  ingress: {
    enabled: boolean;
    host?: string;
    path?: string;
    pathType?: string;
  };
}

const defaultYaml = `apiVersion: microservice.alveotech.com/v1alpha1
kind: CoreUI
metadata:
  name: my-app
  namespace: microservice-operator
spec:
  replicas: 1
  image: nginx:latest
  service:
    type: ClusterIP
    port: 80
    targetPort: 8080
  ingress:
    enabled: true
    host: "my-app.example.com"
    path: "/"
    pathType: "Prefix"
    annotations:
      kubernetes.io/ingress.class: nginx`;

export function CreateResource() {
  const { addResource } = useResourceStore();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isYamlMode, setIsYamlMode] = React.useState(false);
  const [yamlContent, setYamlContent] = React.useState(defaultYaml);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const { register, handleSubmit, watch, reset, setValue } = useForm<ResourceForm>({
    defaultValues: {
      namespace: 'microservice-operator',
      kind: 'CoreUI',
      replicas: 1,
      service: {
        type: 'ClusterIP',
        port: 80,
        targetPort: 8080
      },
      ingress: {
        enabled: false,
        pathType: 'Prefix',
        path: '/'
      }
    }
  });

  const watchIngressEnabled = watch('ingress.enabled');

  const handleTemplateSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = event.target.value;
    if (!templateId) return;

    const template = catalogTemplates.find(t => t.id === templateId);
    if (!template) return;

    if (isYamlMode) {
      setYamlContent(template.yaml);
    } else {
      try {
        const parsed = yaml.load(template.yaml) as any;
        setValue('name', parsed.metadata.name);
        setValue('namespace', parsed.metadata.namespace);
        setValue('kind', parsed.kind);
        setValue('replicas', parsed.spec.replicas);
        setValue('image', parsed.spec.image);
        setValue('service.type', parsed.spec.service?.type || 'ClusterIP');
        setValue('service.port', parsed.spec.service?.port || 80);
        setValue('service.targetPort', parsed.spec.service?.targetPort || 8080);
        setValue('ingress.enabled', !!parsed.spec.ingress?.enabled);
        if (parsed.spec.ingress?.enabled) {
          setValue('ingress.host', parsed.spec.ingress.host);
          setValue('ingress.path', parsed.spec.ingress.path);
          setValue('ingress.pathType', parsed.spec.ingress.pathType);
        }
      } catch (error) {
        console.error('Failed to parse template:', error);
        setError('Failed to parse template configuration');
      }
    }
  };

  const handleFormSubmit = async (data: ResourceForm) => {
    try {
      const resource = {
        apiVersion: 'microservice.alveotech.com/v1alpha1',
        kind: data.kind,
        metadata: {
          name: data.name,
          namespace: data.namespace,
          uid: uuidv4(),
          creationTimestamp: new Date().toISOString()
        },
        spec: {
          replicas: data.replicas,
          image: data.image,
          service: {
            type: data.service.type,
            port: data.service.port,
            targetPort: data.service.targetPort
          },
          ingress: data.ingress.enabled ? {
            enabled: true,
            host: data.ingress.host,
            path: data.ingress.path,
            pathType: data.ingress.pathType,
            annotations: {
              'kubernetes.io/ingress.class': 'nginx'
            }
          } : undefined
        },
        status: {
          phase: 'Pending',
          replicas: data.replicas,
          availableReplicas: 0
        }
      };

      setIsSaving(true);
      addResource(resource);
      await queryClient.invalidateQueries({ queryKey: ['resources'] });
      setIsOpen(false);
      reset();
      setError(null);
      setIsSaving(false);
    } catch (error) {
      setError('Failed to create resource. Please check your input.');
      setIsSaving(false);
    }
  };

  const handleYamlSubmit = async () => {
    try {
      const resource = yaml.load(yamlContent) as any;
      
      if (!resource.metadata.uid) {
        resource.metadata.uid = uuidv4();
      }
      if (!resource.metadata.creationTimestamp) {
        resource.metadata.creationTimestamp = new Date().toISOString();
      }
      if (!resource.status) {
        resource.status = {
          phase: 'Pending',
          replicas: resource.spec.replicas || 1,
          availableReplicas: 0
        };
      }

      setIsSaving(true);
      addResource(resource);
      await queryClient.invalidateQueries({ queryKey: ['resources'] });
      setIsOpen(false);
      setYamlContent(defaultYaml);
      setError(null);
      setIsSaving(false);
    } catch (error) {
      setError('Invalid YAML format. Please check your configuration.');
      setIsSaving(false);
    }
  };

  const toggleMode = () => {
    if (!isYamlMode) {
      const formData = watch();
      const resource = {
        apiVersion: 'microservice.alveotech.com/v1alpha1',
        kind: formData.kind,
        metadata: {
          name: formData.name || 'my-app',
          namespace: formData.namespace
        },
        spec: {
          replicas: formData.replicas,
          image: formData.image,
          service: formData.service,
          ingress: formData.ingress.enabled ? {
            ...formData.ingress,
            annotations: {
              'kubernetes.io/ingress.class': 'nginx'
            }
          } : undefined
        }
      };
      setYamlContent(yaml.dump(resource));
    }
    setIsYamlMode(!isYamlMode);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlContent);
    setCopied(true);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-white hover:bg-primary/90"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Resource
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="relative bg-background rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">Create Resource</h2>
                <p className="text-sm text-muted-foreground">
                  {isYamlMode ? 'Edit YAML directly' : 'Configure your resource'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMode}
                  className="inline-flex items-center px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {isYamlMode ? (
                    <>
                      <FormInput className="h-4 w-4 mr-2" />
                      Switch to Form
                    </>
                  ) : (
                    <>
                      <FileCode className="h-4 w-4 mr-2" />
                      Switch to YAML
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              </div>
            )}

            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
              {/* Template Selection */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Import className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Import from Template</label>
                </div>
                <select
                  onChange={handleTemplateSelect}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="">Select a template...</option>
                  {catalogTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {isYamlMode ? (
                <div className="relative h-[500px]">
                  <div className="absolute top-2 right-2 z-10">
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center px-3 py-1.5 rounded-md bg-background border hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <YamlEditor value={yamlContent} onChange={setYamlContent} />
                </div>
              ) : (
                <form id="resourceForm" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        {...register('name')}
                        className="w-full p-2 border rounded-md bg-background"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Kind</label>
                      <select
                        {...register('kind')}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option>CoreUI</option>
                        <option>AuthService</option>
                        <option>DataService</option>
                        <option>ApiGateway</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Namespace</label>
                      <input
                        {...register('namespace')}
                        className="w-full p-2 border rounded-md bg-background"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Replicas</label>
                      <input
                        type="number"
                        {...register('replicas')}
                        className="w-full p-2 border rounded-md bg-background"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Image</label>
                    <input
                      {...register('image')}
                      className="w-full p-2 border rounded-md bg-background"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Service Configuration</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select
                          {...register('service.type')}
                          className="w-full p-2 border rounded-md bg-background"
                        >
                          <option>ClusterIP</option>
                          <option>NodePort</option>
                          <option>LoadBalancer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Port</label>
                        <input
                          type="number"
                          {...register('service.port')}
                          className="w-full p-2 border rounded-md bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Target Port</label>
                        <input
                          type="number"
                          {...register('service.targetPort')}
                          className="w-full p-2 border rounded-md bg-background"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...register('ingress.enabled')}
                        id="ingressEnabled"
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="ingressEnabled" className="text-sm font-medium">
                        Enable Ingress
                      </label>
                    </div>

                    {watchIngressEnabled && (
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <label className="block text-sm font-medium mb-1">Host</label>
                          <input
                            {...register('ingress.host')}
                            className="w-full p-2 border rounded-md bg-background"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Path</label>
                          <input
                            {...register('ingress.path')}
                            className="w-full p-2 border rounded-md bg-background"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Path Type</label>
                          <select
                            {...register('ingress.pathType')}
                            className="w-full p-2 border rounded-md bg-background"
                          >
                            <option>Prefix</option>
                            <option>Exact</option>
                            <option>ImplementationSpecific</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50 dark:bg-gray-800">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={isYamlMode ? handleYamlSubmit : () => document.getElementById('resourceForm')?.requestSubmit()}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin mr-2">⋯</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Resource
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}