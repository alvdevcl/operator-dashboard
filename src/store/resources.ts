import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CustomResource } from '../types/k8s';
import { v4 as uuidv4 } from 'uuid';

// Initial resources based on catalog templates
const initialResources: CustomResource[] = [
  {
    apiVersion: 'microservice.alveotech.com/v1alpha1',
    kind: 'AuthService',
    metadata: {
      name: 'auth-service',
      namespace: 'microservice-operator',
      uid: uuidv4(),
      creationTimestamp: new Date().toISOString()
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
      creationTimestamp: new Date().toISOString()
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
      creationTimestamp: new Date().toISOString()
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
  }
];

interface ResourceState {
  resources: CustomResource[];
  addResource: (resource: CustomResource) => void;
  updateResource: (resource: CustomResource) => void;
  deleteResource: (uid: string) => void;
  setResources: (resources: CustomResource[]) => void;
}

export const useResourceStore = create<ResourceState>()(
  persist(
    (set) => ({
      resources: initialResources,
      addResource: (resource) => {
        const newResource = {
          ...resource,
          metadata: {
            ...resource.metadata,
            uid: resource.metadata.uid || uuidv4(),
            creationTimestamp: resource.metadata.creationTimestamp || new Date().toISOString(),
          },
          status: resource.status || {
            phase: 'Pending',
            replicas: resource.spec.replicas || 1,
            availableReplicas: 0
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
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration from version 0 to 1
          return {
            ...persistedState,
            resources: persistedState.resources || initialResources
          };
        }
        return persistedState as ResourceState;
      },
    }
  )
);