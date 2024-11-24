import React from 'react';
import { ResourceList } from '../components/ResourceList';
import { CreateResource } from '../components/CreateResource';
import { useNavigate } from 'react-router-dom';

export function Resources() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Resources</h1>
          <p className="text-lg text-muted-foreground">
            Manage your Kubernetes resources
          </p>
        </div>
        <CreateResource />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <ResourceList />
      </div>
    </div>
  );
}