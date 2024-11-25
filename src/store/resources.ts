import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomResource } from '../types/k8s';
import { v4 as uuidv4 } from 'uuid';

interface ResourceState {
  resources: CustomResource[];
  addResource: (resource: CustomResource) => void;
  updateResource: (resource: CustomResource) => void;
  deleteResource: (uid: string) => void;
  setResources: (resources: CustomResource[]) => void;
}

// Initial resources based on catalog templates
const initialResources: CustomResource[] = [
  {
    apiVersion: 'microservice.alveotech.com/v1alpha1',
    kind: 'AuthService',
    metadata: {
      name: 'auth-service',
      namespace: 'microservice-operator',
      uid: uuidv4(),
      creationTimestamp: '2024-03-10T10:00:00Z'
    },
    spec: {
      replicas: 1,
      image: 'ac-m2repo-prod.asset-control.com:5443/auth-service:1.0.0',
      service: {
        type: 'ClusterIP',
        port: 80,
        targetPort: 8080
      }
    },
    status: {
      phase: 'Running',
      replicas: 1,
      availableReplicas: 1
    }
  },
  {
    apiVersion: 'microservice.alveotech.com/v1alpha1',
    kind: 'AuthUI',
    metadata: {
      name: 'auth-ui',
      namespace: 'microservice-operator',
      uid: uuidv4(),
      creationTimestamp: '2024-03-10T11:00:00Z'
    },
    spec: {
      replicas: 1,
      image: 'ac-m2repo-prod.asset-control.com:5443/auth-ui:1.0.0',
      service: {
        type: 'ClusterIP',
        port: 80,
        targetPort: 8080
      }
    },
    status: {
      phase: 'Running',
      replicas: 1,
      availableReplicas: 1
    }
  },
  {
    apiVersion: 'microservice.alveotech.com/v1alpha1',
    kind: 'OpsBoard',
    metadata: {
      name: 'ops-board',
      namespace: 'microservice-operator',
      uid: uuidv4(),
      creationTimestamp: '2024-03-10T12:00:00Z'
    },
    spec: {
      replicas: 2,
      image: 'ac-m2repo-prod.asset-control.com:5443/ops-board:1.0.0',
      service: {
        type: 'ClusterIP',
        port: 80,
        targetPort: 8080
      }
    },
    status: {
      phase: 'Running',
      replicas: 2,
      availableReplicas: 2
    }
  },
  {
    apiVersion: 'microservice.alveotech.com/v1alpha1',
    kind: 'DataViewAdmin',
    metadata: {
      name: 'data-view-admin',
      namespace: 'microservice-operator',
      uid: uuidv4(),
      creationTimestamp: '2024-03-10T13:00:00Z'
    },
    spec: {
      replicas: 1,
      image: 'ac-m2repo-prod.asset-control.com:5443/data-view-admin:1.0.0',
      service: {
        type: 'ClusterIP',
        port: 80,
        targetPort: 8080
      }
    },
    status: {
      phase: 'Running',
      replicas: 1,
      availableReplicas: 1
    }
  },
  {
    apiVersion: 'microservice.alveotech.com/v1alpha1',
    kind: 'DataModelAdmin',
    metadata: {
      name: 'data-model-admin',
      namespace: 'microservice-operator',
      uid: uuidv4(),
      creationTimestamp: '2024-03-10T14:00:00Z'
    },
    spec: {
      replicas: 1,
      image: 'ac-m2repo-prod.asset-control.com:5443/data-model-admin:1.0.0',
      service: {
        type: 'ClusterIP',
        port: 80
      }
    },
    status: {
      phase: 'Running',
      replicas: 1,
      availableReplicas: 1
    }
  },
  {
    apiVersion: 'microservice.alveotech.com/v1alpha1',
    kind: 'FrontendService',
    metadata: {
      name: 'frontend-service',
      namespace: 'microservice-operator',
      uid: uuidv4(),
      creationTimestamp: '2024-03-10T15:00:00Z'
    },
    spec: {
      replicas: 3,
      image: 'ac-m2repo-prod.asset-control.com:5443/frontend-service:1.0.0',
      service: {
        type: 'ClusterIP',
        port: 80
      }
    },
    status: {
      phase: 'Running',
      replicas: 3,
      availableReplicas: 3
    }
  },
  {
    apiVersion: 'microservice.alveotech.com/v1alpha1',
    kind: 'BDMS',
    metadata: {
      name: 'bdms',
      namespace: 'microservice-operator',
      uid: uuidv4(),
      creationTimestamp: '2024-03-10T16:00:00Z'
    },
    spec: {
      replicas: 2,
      image: 'ac-m2repo-prod.asset-control.com:5443/bdms:1.0.0',
      service: {
        type: 'ClusterIP',
        port: 80
      }
    },
    status: {
      phase: 'Running',
      replicas: 2,
      availableReplicas: 2
    }
  },
  {
    apiVersion: 'microservice.alveotech.com/v1alpha1',
    kind: 'DataSets',
    metadata: {
      name: 'data-sets',
      namespace: 'microservice-operator',
      uid: uuidv4(),
      creationTimestamp: '2024-03-10T17:00:00Z'
    },
    spec: {
      replicas: 2,
      image: 'ac-m2repo-prod.asset-control.com:5443/data-sets:1.0.0',
      service: {
        type: 'ClusterIP',
        port: 80
      }
    },
    status: {
      phase: 'Running',
      replicas: 2,
      availableReplicas: 2
    }
  },
  {
    apiVersion: 'microservice.alveotech.com/v1alpha1',
    kind: 'TasksService',
    metadata: {
      name: 'tasks-service',
      namespace: 'microservice-operator',
      uid: uuidv4(),
      creationTimestamp: '2024-03-10T18:00:00Z'
    },
    spec: {
      replicas: 2,
      image: 'ac-m2repo-prod.asset-control.com:5443/tasks-service:1.0.0',
      service: {
        type: 'ClusterIP',
        port: 80
      }
    },
    status: {
      phase: 'Running',
      replicas: 2,
      availableReplicas: 2
    }
  }
];

export const useResourceStore = create<ResourceState>()(
  persist(
    (set) => ({
      resources: initialResources,
      addResource: (resource) => {
        // Ensure resource has required fields
        const newResource = {
          ...resource,
          metadata: {
            ...resource.metadata,
            uid: resource.metadata.uid || uuidv4(),
            creationTimestamp: resource.metadata.creationTimestamp || new Date().toISOString(),
          },
          status: resource.status || {
            phase: 'Pending',
          },
        };
        
        set((state) => ({
          resources: [...state.resources, newResource],
        }));
      },
      updateResource: (resource) =>
        set((state) => ({
          resources: state.resources.map((r) =>
            r.metadata.uid === resource.metadata.uid ? resource : r
          ),
        })),
      deleteResource: (uid) =>
        set((state) => ({
          resources: state.resources.filter((r) => r.metadata.uid !== uid),
        })),
      setResources: (resources) => set({ resources }),
    }),
    {
      name: 'k8s-resources-storage',
    }
  )
);