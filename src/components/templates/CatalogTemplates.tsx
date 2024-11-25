import type { Template } from '../../types/templates';

export const catalogTemplates: Template[] = [
  {
    id: 'auth-service',
    name: 'Authentication Service',
    yaml: `apiVersion: microservice.alveotech.com/v1alpha1
kind: AuthService
metadata:
  name: auth-service
  namespace: microservice-operator
spec:
  replicas: 1
  image: ac-m2repo-prod.asset-control.com:5443/auth-service:1.0.0
  service:
    type: ClusterIP
    port: 80
    targetPort: 8080
  ingress:
    enabled: true
    host: "auth.alveotech.com"
    path: "/"
    pathType: "Prefix"
    annotations:
      kubernetes.io/ingress.class: nginx`
  },
  {
    id: 'auth-ui',
    name: 'Authentication UI',
    yaml: `apiVersion: microservice.alveotech.com/v1alpha1
kind: AuthUI
metadata:
  name: auth-ui
  namespace: microservice-operator
spec:
  replicas: 1
  image: ac-m2repo-prod.asset-control.com:5443/auth-ui:1.0.0
  service:
    type: ClusterIP
    port: 80
    targetPort: 8080
  ingress:
    enabled: true
    host: "auth-ui.alveotech.com"
    path: "/"
    pathType: "Prefix"
    annotations:
      kubernetes.io/ingress.class: nginx`
  },
  {
    id: 'ops-board',
    name: 'Operations Board UI',
    yaml: `apiVersion: microservice.alveotech.com/v1alpha1
kind: OpsBoard
metadata:
  name: ops-board
  namespace: microservice-operator
spec:
  replicas: 2
  image: ac-m2repo-prod.asset-control.com:5443/ops-board:1.0.0
  service:
    type: ClusterIP
    port: 80
    targetPort: 8080
  ingress:
    enabled: true
    host: "ops.alveotech.com"
    path: "/"
    pathType: "Prefix"
    annotations:
      kubernetes.io/ingress.class: nginx`
  },
  {
    id: 'data-view-admin',
    name: 'Data View Admin UI',
    yaml: `apiVersion: microservice.alveotech.com/v1alpha1
kind: DataViewAdmin
metadata:
  name: data-view-admin
  namespace: microservice-operator
spec:
  replicas: 1
  image: ac-m2repo-prod.asset-control.com:5443/data-view-admin:1.0.0
  service:
    type: ClusterIP
    port: 80
    targetPort: 8080
  ingress:
    enabled: true
    host: "data-view.alveotech.com"
    path: "/"
    pathType: "Prefix"
    annotations:
      kubernetes.io/ingress.class: nginx`
  },
  {
    id: 'data-model-admin',
    name: 'Data Model Admin UI',
    yaml: `apiVersion: microservice.alveotech.com/v1alpha1
kind: DataModelAdmin
metadata:
  name: data-model-admin
  namespace: microservice-operator
spec:
  replicas: 1
  image: ac-m2repo-prod.asset-control.com:5443/data-model-admin:1.0.0
  service:
    type: ClusterIP
    port: 80
    targetPort: 8080
  ingress:
    enabled: true
    host: "data-model.alveotech.com"
    path: "/"
    pathType: "Prefix"
    annotations:
      kubernetes.io/ingress.class: nginx`
  },
  {
    id: 'frontend-service',
    name: 'Frontend Service',
    yaml: `apiVersion: microservice.alveotech.com/v1alpha1
kind: FrontendService
metadata:
  name: frontend-service
  namespace: microservice-operator
spec:
  replicas: 3
  image: ac-m2repo-prod.asset-control.com:5443/frontend-service:1.0.0
  service:
    type: ClusterIP
    port: 80
    targetPort: 8080
  ingress:
    enabled: true
    host: "frontend.alveotech.com"
    path: "/"
    pathType: "Prefix"
    annotations:
      kubernetes.io/ingress.class: nginx`
  },
  {
    id: 'bdms',
    name: 'BDMS',
    yaml: `apiVersion: microservice.alveotech.com/v1alpha1
kind: BDMS
metadata:
  name: bdms
  namespace: microservice-operator
spec:
  replicas: 2
  image: ac-m2repo-prod.asset-control.com:5443/bdms:1.0.0
  service:
    type: ClusterIP
    port: 80
    targetPort: 8080
  ingress:
    enabled: true
    host: "bdms.alveotech.com"
    path: "/"
    pathType: "Prefix"
    annotations:
      kubernetes.io/ingress.class: nginx`
  }
];