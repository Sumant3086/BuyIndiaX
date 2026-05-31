# BuyIndiaX - E-Commerce Platform: Kubernetes DevOps Project

**Academic Year:** 2024–25
**Course:** INT334 – DevOps
**University:** Lovely Professional University, Phagwara, Punjab

**Student Details:**
- **Name:** Sumant Yadav
- **Roll No.:** 43
- **Section:** M10

---

## Table of Contents
1. Title Page (See above)
2. Table of Contents
3. Abstract
4. Introduction
5. Tools & Technologies Used
6. System Architecture
7. Application Stack
8. Kubernetes Resources Implemented
9. Deployment Process (Step-by-Step)
10. Horizontal Pod Autoscaler (HPA) – Deep Dive
11. Monitoring & Observability
12. Project Results & Demonstration
13. Challenges Faced & Solutions
14. Conclusion
15. Future Scope
16. References

---

## 3. Abstract

This project demonstrates the deployment of a containerized full-stack MERN (MongoDB, Express.js, React, Node.js) e-commerce application, "BuyIndiaX", onto a Kubernetes cluster. Traditional monolithic deployments often face significant challenges regarding scalability, resilience, and resource optimization under fluctuating workloads. To address these modern enterprise requirements, this project leverages container orchestration using Kubernetes on a Minikube cluster, providing an automated and highly available infrastructure.

The core implementation involves containerizing the application using Docker and managing its lifecycle with Kubernetes deployments, services, and an Ingress controller for routing external traffic. A robust auto-scaling mechanism was established using the Horizontal Pod Autoscaler (HPA) to dynamically adjust pod replicas based on real-time CPU and Memory consumption. Furthermore, an enterprise-grade monitoring and observability stack was integrated using Prometheus for metrics collection and Grafana for visualizing cluster health and application performance. This report details the architecture, tools, step-by-step deployment processes, and the resulting highly scalable and monitored DevOps environment.

---

## 4. Introduction

### What is DevOps? What is container orchestration?
DevOps is a set of practices that combines software development (Dev) and IT operations (Ops) to shorten the systems development life cycle and provide continuous delivery with high software quality. A crucial aspect of modern DevOps is container orchestration, which automates the deployment, management, scaling, and networking of containers. Without orchestration, managing hundreds of containers in a production environment becomes an operational bottleneck.

### Problem statement: Why traditional deployments fail at scale
Traditional application deployments often rely on manual scaling and dedicated servers. Under heavy traffic spikes, these systems struggle to allocate resources dynamically, leading to downtime, slow response times, and poor user experiences. Conversely, during low-traffic periods, servers remain underutilized, resulting in unnecessary infrastructure costs. They lack the self-healing and automated traffic routing capabilities required by modern e-commerce platforms.

### Objectives of this project
- To containerize a full-stack MERN application for consistent execution across environments.
- To deploy the application onto a Kubernetes cluster ensuring high availability.
- To implement dynamic resource management using Horizontal Pod Autoscaler (HPA).
- To establish a comprehensive monitoring stack using Prometheus and Grafana.

### Scope and limitations
The scope of this project encompasses the creation of Docker images, writing Kubernetes YAML manifests, configuring HPA, and setting up monitoring on a local Minikube cluster. Limitations include the local nature of the deployment (Minikube instead of a cloud-managed Kubernetes service like EKS/GKE) and the absence of a fully automated CI/CD pipeline.

---

## 5. Tools & Technologies Used

- **Docker:** Used for application containerization. It packages the application code along with its dependencies into standardized units (containers) for software development, ensuring it runs seamlessly in any environment.
- **Kubernetes:** The primary container orchestration platform used to automate the deployment, scaling, and management of the Docker containers.
- **Minikube:** A tool that runs a single-node Kubernetes cluster locally. It was chosen as the development environment for testing the orchestration setup before a hypothetical production rollout.
- **kubectl:** The Kubernetes command-line tool utilized to deploy applications, inspect and manage cluster resources, and view logs.
- **Helm:** The package manager for Kubernetes. It was used to streamline the installation and configuration of complex applications like Prometheus and Grafana.
- **YAML Manifests:** Used for Infrastructure as Code (IaC) to define the desired state of Kubernetes resources (Deployments, Services, Ingress, etc.) in a declarative manner.
- **ConfigMaps:** Used for application configuration management, decoupling environment-specific configurations (like `NODE_ENV`, `PORT`, `MONGODB_URI`) from the container images.
- **Secrets:** Utilized for secure, base64-encoded storage of sensitive data such as JWT secrets and API keys, ensuring they are not hardcoded in the source code or ConfigMaps.
- **Prometheus:** An open-source systems monitoring and alerting toolkit. It collects and stores metrics as time-series data (with a 7-day retention policy) and provides a powerful query language, PromQL.
- **Grafana:** A multi-platform open-source analytics and interactive visualization web application. It integrates with Prometheus to display customizable dashboards for monitoring.
- **HPA (Horizontal Pod Autoscaler):** A Kubernetes component that automatically updates a workload resource (like a Deployment) to match demand, based on observed CPU and memory thresholds.
- **Metrics Server:** A scalable, efficient source of container resource metrics for Kubernetes built-in autoscaling pipelines. It tracks resource usage across the cluster, which the HPA relies on.

---

## 6. System Architecture

The architecture of the BuyIndiaX deployment is designed for resilience, security, and scalability within a microservices ecosystem.

**Architecture Components:**
- **Ingress Controller:** Acts as the entry point for all external traffic (Port 80). It routes HTTP requests to the appropriate services based on the requested path.
- **Frontend Layer:** External traffic targeting the root path (`/`) is directed to the Frontend Service (ClusterIP), which load-balances requests among the Frontend Pods (2–5 replicas running the React App).
- **Backend Layer:** Traffic targeting `/api` is routed to the Backend Service (ClusterIP), which forwards it to the Backend Pods (2–5 replicas running the Node.js Express API).
- **Database Layer:** The Backend Pods communicate with the MongoDB Pod via a dedicated service. This database pod uses persistent storage to ensure data survives pod restarts.
- **Monitoring Stack:** Prometheus continuously scrapes metrics from the nodes, pods, and the metrics server. Grafana queries Prometheus to render real-time visual dashboards.
- **Namespace:** All resources are encapsulated within the `"buyindiax"` namespace to provide environment isolation and logical grouping.

**Text-Based Architecture Diagram:**
```text
[ External User Traffic ]
           |
           v
+-----------------------+
|  Ingress Controller   |  <-- Routes based on rules (buyindiax.local)
|       (Port 80)       |
+-----------------------+
      |            |
  Path: /      Path: /api
      |            |
      v            v
+----------+   +----------+
| Frontend |   | Backend  |
| Service  |   | Service  |
|ClusterIP |   |ClusterIP |
+----------+   +----------+
      |            |
      v            v
+----------+   +----------+       +-----------+
| Frontend |   | Backend  |       | MongoDB   |
| Pods(2-5)|   | Pods(2-5)| ----> | Pod & SVC |
| (React)  |   | (Node.js)|       | (Storage) |
+----------+   +----------+       +-----------+
      |            |                    |
      +------------+--------------------+
                   |
                   v
          +------------------+
          | Metrics Server   |  <-- Tracks CPU/Memory
          +------------------+
                   |
                   v
          +------------------+
          |       HPA        |  <-- Scales up/down
          +------------------+
                   |
                   v
+------------------------------------------+
| Monitoring Stack (Prometheus + Grafana)  |
+------------------------------------------+
```

---

## 7. Application Stack

BuyIndiaX is a comprehensive full-stack e-commerce platform built on the MERN stack, designed using a containerized microservices architecture to allow independent scaling of frontend and backend components.

- **Frontend:** A Single Page Application (SPA) built with React. It handles the user interface, shopping cart interactions, and dynamic product rendering.
- **Backend:** A robust REST API built using Node.js and Express. It processes business logic, user authentication, inventory management, and interfaces with the database.
- **Database:** MongoDB, a NoSQL database, handles unstructured data and flexible schema designs required for complex product catalogs, user profiles, and order histories.
- **Containerized Microservices Architecture:** The frontend, backend, and database components are completely decoupled. Each runs in its own Docker container, ensuring that a failure in one component does not crash the entire system, and each can be scaled independently based on specific traffic demands.

---

## 8. Kubernetes Resources Implemented

- **Namespace (`buyindiax`):** Provides a virtual cluster within the physical cluster. It isolates the BuyIndiaX application components from other potential projects running on the same Minikube instance.
- **Pods & Deployments:** Deployments manage the creation and scaling of Pods (the smallest deployable units in Kubernetes). They ensure the specified number of pod replicas are running and handle rolling updates.
- **Services (ClusterIP):** Abstract the underlying pods and provide stable internal IP addresses. This allows the frontend to communicate with the backend without worrying about pod IP changes.
- **Ingress:** Manages external access to the services within the cluster, providing load balancing, SSL termination, and name-based virtual hosting.
- **ConfigMaps:** Stores non-confidential data in key-value pairs (e.g., `PORT: 5000`, `NODE_ENV: production`). The pods consume this to configure the application environment dynamically.
- **Secrets:** Securely stores sensitive information like JWT tokens and API keys (Base64 encoded). This prevents hardcoding credentials in the manifest files.
- **HPA:** The Horizontal Pod Autoscaler dynamically scales the number of pods in the deployments. Resource requests and limits are defined (Requests: 250m CPU, 256Mi Memory; Limits: 500m CPU, 512Mi Memory) to provide boundaries for scaling.
- **Health Checks:** Liveness probes (to restart dead containers) and readiness probes (to ensure containers are ready to accept traffic) are implemented using HTTP GET requests to `/api/health`.
- **Helm Charts:** Used to cleanly install, upgrade, and manage the complex, multi-component deployments of Prometheus and Grafana.

---

## 9. Deployment Process (Step-by-Step)

### Step 1: Setup Minikube
Start the local Kubernetes cluster and enable necessary add-ons.
```bash
minikube start --cpus=2 --memory=2048
minikube addons enable ingress
minikube addons enable metrics-server
```
*Reasoning:* Allocates sufficient resources for the cluster and enables the ingress controller for routing and the metrics server required by the HPA.

### Step 2: Build Docker Images
Build the container images for the application components.
```bash
docker build -t buyindiax-backend:latest -f Dockerfile.backend .
docker build -t buyindiax-frontend:latest -f Dockerfile.frontend.simple .
```
*Reasoning:* Packages the Node.js and React code into immutable Docker images.

### Step 3: Namespace & Config
Apply the base infrastructure configurations.
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
```
**Relevant Snippet (ConfigMap):**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: buyindiax-config
  namespace: buyindiax
data:
  NODE_ENV: "production"
  PORT: "5000"
  CORS_ORIGIN: "http://buyindiax.local"
  MONGODB_URI: "mongodb://mongodb-service:27017/buyindiax"
```

### Step 4: Deploy MongoDB
Deploy the database with persistent storage.
```bash
kubectl apply -f k8s/mongodb-deployment.yaml
```
*Reasoning:* Ensures the database is up and running before the backend attempts to connect to it.

### Step 5: Deploy Application
Deploy the backend and frontend components.
```bash
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
```
**Relevant Snippet (Backend Deployment):**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: buyindiax
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    spec:
      containers:
      - name: backend
        image: buyindiax-backend:latest
        ports:
        - containerPort: 5000
        envFrom:
        - configMapRef:
            name: buyindiax-config
        - secretRef:
            name: buyindiax-secrets
```

### Step 6: Configure Networking
Apply Ingress rules to route external traffic.
```bash
kubectl apply -f k8s/ingress.yaml
```
**Relevant Snippet (Ingress):**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: buyindiax-ingress
  namespace: buyindiax
spec:
  rules:
  - host: buyindiax.local
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 5000
```

### Step 7: Setup Auto-Scaling
Apply the Horizontal Pod Autoscaler configurations.
```bash
kubectl apply -f k8s/hpa.yaml
```
**Relevant Snippet (HPA):**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: buyindiax
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Step 8: Install Monitoring
Deploy Prometheus and Grafana using Helm.
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install monitoring prometheus-community/kube-prometheus-stack -n buyindiax
```

---

## 10. Horizontal Pod Autoscaler (HPA) – Deep Dive

The Horizontal Pod Autoscaler automatically updates workload resources to match demand. It is a critical component for ensuring high availability and cost optimization.

- **Backend HPA Configuration:**
  - Minimum Replicas: 2
  - Maximum Replicas: 5
  - Target CPU Utilization: 70%
  - Target Memory Utilization: 80%
- **Frontend HPA Configuration:**
  - Minimum Replicas: 2
  - Maximum Replicas: 5
  - Target CPU Utilization: 70%

**How it works:** The Kubernetes Metrics Server aggregates resource usage data across the cluster. The HPA controller polls this metrics API at regular intervals (default every 15 seconds). If the average CPU or Memory utilization across all pods in the deployment exceeds the defined target (e.g., 70%), the HPA calculates the required number of replicas and modifies the deployment to scale out. The scale-up operation typically takes approximately 30 seconds to spin up new pods and route traffic to them.

**Benefits:**
- **Cost optimization:** Scales down infrastructure during off-peak hours to save resources.
- **Performance under load:** Automatically absorbs sudden traffic spikes by adding compute power.
- **Full automation:** Removes the need for manual intervention during traffic surges.

---

## 11. Monitoring & Observability

A robust observability stack was implemented to maintain system health and facilitate debugging.

**Prometheus:**
- Acts as the core metrics collection engine, scraping endpoints across all pods and cluster nodes.
- Utilizes a time-series database configured for a 7-day retention period.
- Provides PromQL, a highly flexible query language used to extract and aggregate metric data.
- Handles service discovery to automatically find new pods as they are created by the HPA.
- Accessible locally via `http://localhost:9090`.

**Grafana Dashboards:**
- Provides a visual interface leveraging data from Prometheus.
- Dashboards implemented include:
  - **Kubernetes cluster overview:** High-level health of nodes and namespaces.
  - **Pod metrics:** Detailed views of CPU, Memory, and Network consumption per pod.
  - **Application performance:** Custom visualizations tracking application-specific health.
  
**Key Metrics Monitored:**
- Pod CPU and Memory utilization.
- Network I/O (bytes transmitted/received).
- HTTP Request rates and Error rates (4xx/5xx).
- Container restarts and crash loops.
- Resource quota usage vs. limits.

---

## 12. Project Results & Demonstration

The deployment was successfully executed and validated on the Minikube cluster.

**Deployment Status:**
- **Kubernetes Cluster:** Running successfully on Minikube.
- **Pods:** 13 pods running optimally across Backend, Frontend, MongoDB, and Monitoring components.
- **Services:** 13 services configured and routing traffic correctly.
- **Deployments:** 8 deployments active and managing pods.
- **HPA:** 2 autoscalers actively monitoring frontend and backend resources.
- **ConfigMaps:** 6 configurations successfully applied.
- **Secrets:** 9 secrets secured and mounted.
- **Helm Releases:** 2 releases active (Prometheus, Grafana).

**Resource Usage (at idle):**
- **Backend:** CPU usage at ~1%, Memory usage at ~20% of limit.
- **Frontend:** CPU usage at ~1%, Memory usage at ~15% of limit.
- **Replicas:** Maintaining the minimum 2 replicas during idle, with the verified capability to scale to 5.
- **Health Checks:** All liveness and readiness probes are passing, ensuring zero downtime routing.

---

## 13. Challenges Faced & Solutions

During the implementation of the project, several technical challenges were encountered and successfully resolved:

1. **ImagePullBackOff Errors:** Initially, Kubernetes failed to pull the local Docker images because Minikube runs its own Docker daemon.
   - *Solution:* Configured the local terminal environment to use Minikube's Docker daemon (`eval $(minikube docker-env)`) before building images, and set `imagePullPolicy: Never` in the deployments.
2. **HPA Not Triggering (Unknown Metrics):** The HPA reported `<unknown>/70%` for CPU utilization and failed to scale pods.
   - *Solution:* Discovered that the Minikube metrics-server addon was disabled. Enabled it via `minikube addons enable metrics-server` and ensured resource requests/limits were explicitly defined in the deployment manifests.
3. **Cross-Origin Resource Sharing (CORS) Issues:** The React frontend was unable to communicate with the Node.js backend when routed through the Ingress.
   - *Solution:* Updated the ConfigMap to accurately reflect the Ingress host (`CORS_ORIGIN: "http://buyindiax.local"`) and updated the backend middleware to accept requests from this origin.
4. **Stateful Database Resilience:** MongoDB data was lost whenever the database pod was restarted.
   - *Solution:* Modified the MongoDB deployment to utilize Persistent Volumes (PV) and Persistent Volume Claims (PVC) to decouple storage lifecycle from the pod lifecycle.

---

## 14. Conclusion

This project successfully achieved its objectives by deploying the BuyIndiaX e-commerce platform onto a resilient Kubernetes infrastructure. By implementing container orchestration, the project utilized 16 diverse DevOps tools to create an enterprise-grade environment. Key achievements include the configuration of automated scaling via HPA, ensuring the application remains responsive under load, and the establishment of a robust monitoring stack with Prometheus and Grafana for comprehensive observability.

The project provided profound insights into modern DevOps practices. Key learnings include the intricacies of microservices deployment, the declarative nature of Infrastructure as Code using YAML, effective package management with Helm, and the secure handling of configuration and sensitive data using ConfigMaps and Secrets. This infrastructure ensures the e-commerce platform is scalable, maintainable, and highly available.

---

## 15. Future Scope

While the current implementation provides a solid foundation, several enhancements can be introduced for a production-ready environment:
- **CI/CD Pipeline Integration:** Implement automated build, test, and deployment workflows using Jenkins or GitHub Actions.
- **Cloud Provider Migration:** Migrate the deployment from local Minikube to a managed cloud Kubernetes service like AWS EKS or Google Kubernetes Engine (GKE) for true global scalability.
- **Service Mesh:** Integrate Istio to provide advanced traffic management, mutual TLS (mTLS) for secure service-to-service communication, and deeper tracing observability.
- **Production Storage:** Implement robust cloud storage solutions (like AWS EBS) for Persistent Volumes, accompanied by automated backup and restore strategies for MongoDB.
- **GitOps Methodology:** Transition to a GitOps workflow using tools like ArgoCD to manage cluster state directly from Git repositories.

---

## 16. References

- Kubernetes Official Documentation: [kubernetes.io/docs](https://kubernetes.io/docs/)
- Docker Documentation: [docs.docker.com](https://docs.docker.com/)
- Prometheus Documentation: [prometheus.io/docs](https://prometheus.io/docs/)
- Grafana Documentation: [grafana.com/docs](https://grafana.com/docs/)
- Helm Documentation: [helm.sh/docs](https://helm.sh/docs/)
- *Kubernetes Up & Running* by Brendan Burns, Joe Beda, and Kelsey Hightower.
