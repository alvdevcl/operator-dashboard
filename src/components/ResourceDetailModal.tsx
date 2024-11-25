import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import yaml from 'js-yaml';
import { YamlEditor } from './YamlEditor';

interface ResourceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: any;
  type: string;
}

export function ResourceDetailModal({ isOpen, onClose, resource, type }: ResourceDetailModalProps) {
  if (!isOpen || !resource) return null;

  const yamlContent = yaml.dump(resource);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">
              {type.charAt(0).toUpperCase() + type.slice(1)} Details
            </h2>
            <p className="text-sm text-muted-foreground">
              {resource.metadata.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Metadata</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Name:</span> {resource.metadata.name}</p>
                <p><span className="text-muted-foreground">Namespace:</span> {resource.metadata.namespace}</p>
                {resource.metadata.labels && (
                  <div>
                    <span className="text-muted-foreground">Labels:</span>
                    <div className="ml-2">
                      {Object.entries(resource.metadata.labels).map(([key, value]) => (
                        <div key={key}>{key}: {String(value)}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Spec</h3>
              <div className="space-y-2 text-sm">
                {type === 'deployment' && (
                  <>
                    <p><span className="text-muted-foreground">Replicas:</span> {resource.spec.replicas}</p>
                    <p><span className="text-muted-foreground">Image:</span> {resource.spec.template.spec.containers[0].image}</p>
                  </>
                )}
                {type === 'service' && (
                  <>
                    <p><span className="text-muted-foreground">Type:</span> {resource.spec.type}</p>
                    <p><span className="text-muted-foreground">Port:</span> {resource.spec.ports[0].port}</p>
                    <p><span className="text-muted-foreground">Target Port:</span> {resource.spec.ports[0].targetPort}</p>
                  </>
                )}
                {type === 'ingress' && resource.spec.rules?.[0] && (
                  <>
                    <p><span className="text-muted-foreground">Host:</span> {resource.spec.rules[0].host}</p>
                    <p><span className="text-muted-foreground">Path:</span> {resource.spec.rules[0].http.paths[0].path}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">YAML Configuration</h3>
            <div className="h-[400px] border rounded-lg overflow-hidden">
              <YamlEditor value={yamlContent} onChange={() => {}} />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}