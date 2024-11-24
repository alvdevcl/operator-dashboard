import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { AlertCircle, Plus, X } from 'lucide-react';
import { YamlEditor } from './YamlEditor';
import yaml from 'js-yaml';

// ... (previous code remains the same until the CreateResource component)

export function CreateResource() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [yamlMode, setYamlMode] = React.useState(false);
  const [yamlContent, setYamlContent] = React.useState('');
  
  const { register, handleSubmit, watch, control, reset, setValue, formState: { errors } } = useForm<ResourceForm>({
    defaultValues: {
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

  React.useEffect(() => {
    const savedTemplate = localStorage.getItem('selectedTemplate');
    if (savedTemplate) {
      try {
        const template = JSON.parse(savedTemplate);
        setYamlMode(true);
        setYamlContent(yaml.dump(template));
        localStorage.removeItem('selectedTemplate');
        setIsOpen(true);
      } catch (error) {
        console.error('Failed to load template:', error);
      }
    }
  }, []);

  // ... (rest of the component code remains the same)
}