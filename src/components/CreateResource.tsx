import React from 'react';
import { Plus, X, AlertCircle, FileCode, FormInput, Import, Save } from 'lucide-react';
import { YamlEditor } from './YamlEditor';
import { useResourceStore } from '../store/resources';
import { ResourceForm } from './forms/ResourceForm';
import { catalogTemplates } from './templates/CatalogTemplates';
import yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';
import { useQueryClient } from '@tanstack/react-query';
import type { ResourceForm as ResourceFormType } from '../types/templates';

const defaultFormValues: ResourceFormType = {
  namespace: 'microservice-operator',
  kind: 'CoreUI',
  name: '',
  replicas: 1,
  image: '',
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
};

export function CreateResource() {
  const { addResource } = useResourceStore();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isYamlMode, setIsYamlMode] = React.useState(false);
  const [yamlContent, setYamlContent] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [formValues, setFormValues] = React.useState(defaultFormValues);

  const handleTemplateSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = event.target.value;
    if (!templateId) {
      setFormValues(defaultFormValues);
      setYamlContent('');
      return;
    }

    const template = catalogTemplates.find(t => t.id === templateId);
    if (!template) return;

    try {
      if (isYamlMode) {
        setYamlContent(template.yaml);
      } else {
        const parsed = yaml.load(template.yaml) as any;
        setFormValues({
          name: parsed.metadata.name,
          namespace: parsed.metadata.namespace,
          kind: parsed.kind,
          replicas: parsed.spec.replicas,
          image: parsed.spec.image,
          service: {
            type: parsed.spec.service?.type || 'ClusterIP',
            port: parsed.spec.service?.port || 80,
            targetPort: parsed.spec.service?.targetPort || 8080
          },
          ingress: {
            enabled: !!parsed.spec.ingress?.enabled,
            host: parsed.spec.ingress?.host,
            path: parsed.spec.ingress?.path || '/',
            pathType: parsed.spec.ingress?.pathType || 'Prefix'
          }
        });
      }
      setError(null);
    } catch (error) {
      console.error('Failed to parse template:', error);
      setError('Failed to parse template configuration');
    }
  };

  const handleSubmit = async (data: ResourceFormType | string) => {
    try {
      setIsSaving(true);
      let resource;

      if (typeof data === 'string') {
        // YAML mode
        resource = yaml.load(data) as any;
      } else {
        // Form mode
        resource = {
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
            service: data.service,
            ingress: data.ingress.enabled ? {
              ...data.ingress,
              annotations: {
                'kubernetes.io/ingress.class': 'nginx'
              }
            } : undefined
          }
        };
      }

      // Ensure required fields
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

      addResource(resource);
      await queryClient.invalidateQueries({ queryKey: ['resources'] });
      setIsOpen(false);
      setError(null);
      
      // Reset form
      setFormValues(defaultFormValues);
      setYamlContent('');
    } catch (error) {
      setError('Failed to create resource. Please check your input.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMode = () => {
    if (!isYamlMode && formValues) {
      // Convert form values to YAML
      const resource = {
        apiVersion: 'microservice.alveotech.com/v1alpha1',
        kind: formValues.kind,
        metadata: {
          name: formValues.name || 'my-app',
          namespace: formValues.namespace
        },
        spec: {
          replicas: formValues.replicas,
          image: formValues.image,
          service: formValues.service,
          ingress: formValues.ingress.enabled ? {
            ...formValues.ingress,
            annotations: {
              'kubernetes.io/ingress.class': 'nginx'
            }
          } : undefined
        }
      };
      setYamlContent(yaml.dump(resource));
    } else {
      // Convert YAML to form values
      try {
        const parsed = yaml.load(yamlContent) as any;
        setFormValues({
          name: parsed.metadata.name,
          namespace: parsed.metadata.namespace,
          kind: parsed.kind,
          replicas: parsed.spec.replicas,
          image: parsed.spec.image,
          service: {
            type: parsed.spec.service?.type || 'ClusterIP',
            port: parsed.spec.service?.port || 80,
            targetPort: parsed.spec.service?.targetPort || 8080
          },
          ingress: {
            enabled: !!parsed.spec.ingress?.enabled,
            host: parsed.spec.ingress?.host,
            path: parsed.spec.ingress?.path || '/',
            pathType: parsed.spec.ingress?.pathType || 'Prefix'
          }
        });
      } catch (error) {
        console.error('Failed to parse YAML:', error);
      }
    }
    setIsYamlMode(!isYamlMode);
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
                  <YamlEditor 
                    value={yamlContent} 
                    onChange={setYamlContent} 
                  />
                </div>
              ) : (
                <ResourceForm
                  defaultValues={formValues}
                  onSubmit={handleSubmit}
                  isSaving={isSaving}
                />
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
                onClick={() => isYamlMode ? handleSubmit(yamlContent) : document.getElementById('resourceForm')?.requestSubmit()}
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