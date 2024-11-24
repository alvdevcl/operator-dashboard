import React from 'react';
import { ResourceCatalog } from '../components/ResourceCatalog';

export function Catalogs() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold gradient-text mb-2">Resource Catalogs</h1>
        <p className="text-lg text-muted-foreground">
          Browse and manage your resource templates
        </p>
      </div>
      <ResourceCatalog />
    </div>
  );
}