export interface Template {
    id: string;
    name: string;
    yaml: string;
  }
  
  export interface ResourceForm {
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