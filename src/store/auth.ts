import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types/k8s';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (userData: Partial<User>) => void;
  hasPermission: (action: 'view' | 'create' | 'edit' | 'delete', namespace?: string) => boolean;
}

// Initial user state
const defaultUser: User = {
  name: 'Admin User',
  email: 'admin@k8s.local',
  role: 'admin',
  namespaces: ['default', 'microservice-operator']
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: defaultUser,
      setUser: (user) => set({ user }),
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),
      hasPermission: (action, namespace) => {
        const { user } = get();
        if (!user) return false;

        // Check namespace access if specified
        if (namespace && !user.namespaces.includes(namespace) && user.role !== 'admin') {
          return false;
        }

        switch (user.role) {
          case 'admin':
            return true;
          case 'editor':
            return action !== 'delete';
          case 'viewer':
            return action === 'view';
          default:
            return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration from version 0 to 1
          return {
            ...persistedState,
            user: persistedState.user || defaultUser
          };
        }
        return persistedState as AuthState;
      },
    }
  )
);