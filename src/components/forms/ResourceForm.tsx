import React from 'react';
import { useForm } from 'react-hook-form';
import type { ResourceForm as ResourceFormType } from '../../types/templates';

interface ResourceFormProps {
  defaultValues: ResourceFormType;
  onSubmit: (data: ResourceFormType) => void;
  isSaving: boolean;
}

export function ResourceForm({ defaultValues, onSubmit, isSaving }: ResourceFormProps) {
  const { register, handleSubmit, watch } = useForm<ResourceFormType>({
    defaultValues
  });

  const watchIngressEnabled = watch('ingress.enabled');

  return (
    <form id="resourceForm" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <option>AuthUI</option>
            <option>OpsBoard</option>
            <option>DataViewAdmin</option>
            <option>DataModelAdmin</option>
            <option>FrontendService</option>
            <option>BDMS</option>
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
  );
}