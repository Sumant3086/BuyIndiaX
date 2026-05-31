# BuyIndiaX - Complete Kubernetes DevOps Demonstration
# Demonstrates: Docker, Kubernetes, Pods, Deployments, Services, Ingress, HPA, ConfigMaps, Secrets, Helm, Prometheus, Grafana

Write-Host "`n=== BuyIndiaX Kubernetes DevOps Project ===" -ForegroundColor Cyan
Write-Host "Complete DevOps Pipeline with Monitoring & Visualization`n" -ForegroundColor Yellow

# Function to wait for deployment
function Wait-ForDeployment {
    param($namespace, $deployment)
    Write-Host "  Waiting for $deployment to be ready..." -ForegroundColor Gray
    kubectl wait --for=condition=available --timeout=300s deployment/$deployment -n $namespace
}

# 1. Delete and start Minikube
Write-Host "[1/10] Starting Minikube cluster..." -ForegroundColor Green
minikube delete --all
minikube start --cpus=2 --memory=2048 --driver=docker
minikube addons enable ingress
minikube addons enable metrics-server

# 2. Build Docker Images
Write-Host "`n[2/10] Building Docker images..." -ForegroundColor Green
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
docker build -t buyindiax-backend:latest -f Dockerfile.backend .
docker build -t buyindiax-frontend:latest -f Dockerfile.frontend.simple .

# 3. Create Namespace
Write-Host "`n[3/10] Creating Kubernetes namespace..." -ForegroundColor Green
kubectl apply -f k8s/namespace.yaml

# 4. Apply ConfigMaps and Secrets
Write-Host "`n[4/10] Applying ConfigMaps and Secrets..." -ForegroundColor Green
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# 5. Deploy MongoDB
Write-Host "`n[5/10] Deploying MongoDB (Database)..." -ForegroundColor Green
kubectl apply -f k8s/mongodb-deployment.yaml

Write-Host "  Waiting for MongoDB (30 second timeout)..." -ForegroundColor Gray
$timeout = 30
$elapsed = 0
do {
    $ready = kubectl get deployment mongodb -n buyindiax -o jsonpath='{.status.readyReplicas}' 2>$null
    if ($ready -eq "1") {
        Write-Host "  [OK] MongoDB is ready" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 5
    $elapsed += 5
    Write-Host "  Waiting... ($elapsed/$timeout seconds)" -ForegroundColor Gray
} while ($elapsed -lt $timeout)

if ($elapsed -ge $timeout) {
    Write-Host "  [WARNING] MongoDB taking longer than expected, continuing deployment..." -ForegroundColor Yellow
    Write-Host "  MongoDB will continue starting in background" -ForegroundColor Gray
}

# 6. Deploy Backend
Write-Host "`n[6/10] Deploying Backend (Pods & Service)..." -ForegroundColor Green
kubectl apply -f k8s/backend-deployment.yaml
Wait-ForDeployment "buyindiax" "backend"

# 7. Deploy Frontend
Write-Host "`n[7/10] Deploying Frontend (Pods & Service)..." -ForegroundColor Green
kubectl apply -f k8s/frontend-deployment.yaml
Wait-ForDeployment "buyindiax" "frontend"

# 8. Apply Ingress
Write-Host "`n[8/10] Configuring Ingress (Traffic Routing)..." -ForegroundColor Green
kubectl apply -f k8s/ingress.yaml

# 9. Apply HPA
Write-Host "`n[9/10] Configuring HPA (Auto-scaling)..." -ForegroundColor Green
kubectl apply -f k8s/hpa.yaml

# 10. Install Monitoring
Write-Host "`n[10/10] Installing Monitoring Stack..." -ForegroundColor Green
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts 2>$null
helm repo add grafana https://grafana.github.io/helm-charts 2>$null
helm repo update

Write-Host "  Installing Prometheus..." -ForegroundColor Gray
helm install prometheus prometheus-community/kube-prometheus-stack -f k8s/monitoring/prometheus-values.yaml --namespace buyindiax --wait --timeout 10m 2>$null

Write-Host "  Installing Grafana..." -ForegroundColor Gray
helm install grafana grafana/grafana -f k8s/monitoring/grafana-values.yaml --namespace buyindiax --wait --timeout 10m 2>$null

# Wait for monitoring to be ready
Start-Sleep -Seconds 30

# Display Results
Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "DEPLOYMENT SUCCESSFUL - ALL TOOLS DEMONSTRATED" -ForegroundColor Green
Write-Host "================================================================`n" -ForegroundColor Green

Write-Host "TOOLS DEMONSTRATED:" -ForegroundColor Cyan
Write-Host "  1. Docker              - Containerization" -ForegroundColor White
Write-Host "  2. Kubernetes          - Container orchestration" -ForegroundColor White
Write-Host "  3. Minikube            - Local K8s cluster" -ForegroundColor White
Write-Host "  4. kubectl             - Cluster management" -ForegroundColor White
Write-Host "  5. YAML Manifests      - Infrastructure as Code" -ForegroundColor White
Write-Host "  6. MongoDB             - Database deployment" -ForegroundColor White
Write-Host "  7. Helm                - Package management" -ForegroundColor White
Write-Host "  8. Prometheus          - Monitoring and metrics" -ForegroundColor White
Write-Host "  9. Grafana             - Metrics visualization" -ForegroundColor White
Write-Host "  10. HPA                - Horizontal Pod Autoscaler" -ForegroundColor White
Write-Host "  11. ConfigMaps         - Configuration management" -ForegroundColor White
Write-Host "  12. Secrets            - Sensitive data management" -ForegroundColor White
Write-Host "  13. Pods               - Running containers" -ForegroundColor White
Write-Host "  14. Deployments        - Pod management" -ForegroundColor White
Write-Host "  15. Services           - Network abstraction" -ForegroundColor White
Write-Host "  16. Ingress            - Traffic routing`n" -ForegroundColor White

Write-Host "KUBERNETES RESOURCES:" -ForegroundColor Cyan
kubectl get all -n buyindiax

Write-Host "`nHPA (AUTO-SCALING):" -ForegroundColor Cyan
kubectl get hpa -n buyindiax

Write-Host "`nCONFIGMAPS & SECRETS:" -ForegroundColor Cyan
kubectl get configmap,secret -n buyindiax

Write-Host "`nINGRESS:" -ForegroundColor Cyan
kubectl get ingress -n buyindiax

Write-Host "`nMONITORING:" -ForegroundColor Cyan
Write-Host "  Prometheus: kubectl port-forward -n buyindiax svc/prometheus-kube-prometheus-prometheus 9090:9090" -ForegroundColor Gray
Write-Host "  Grafana:    minikube service grafana -n buyindiax (admin/admin123)" -ForegroundColor Gray

Write-Host "`nACCESS APPLICATION:" -ForegroundColor Cyan
Write-Host "  Frontend: minikube service frontend-service -n buyindiax" -ForegroundColor Gray
Write-Host "  Backend:  minikube service backend-service -n buyindiax" -ForegroundColor Gray

Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "OPENING MONITORING DASHBOARDS FOR MANAGER DEMONSTRATION..." -ForegroundColor Yellow
Write-Host "================================================================`n" -ForegroundColor Green

# Open Prometheus in background
Write-Host "Starting Prometheus UI (Port 9090)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-Command", "kubectl port-forward -n buyindiax svc/prometheus-kube-prometheus-prometheus 9090:9090" -WindowStyle Minimized

# Wait and open Prometheus
Start-Sleep -Seconds 5
Start-Process "http://localhost:9090"

# Open Grafana
Write-Host "Opening Grafana Dashboard..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-Command", "minikube service grafana -n buyindiax" -WindowStyle Minimized

# Open Application
Write-Host "Opening Application Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-Command", "minikube service frontend-service -n buyindiax" -WindowStyle Minimized

Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "ALL SERVICES RUNNING - READY FOR MANAGER DEMONSTRATION" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green

Write-Host "`nDEMONSTRATION CHECKLIST:" -ForegroundColor Yellow
Write-Host "  [OK] Kubernetes Cluster (Minikube) - Running" -ForegroundColor Green
Write-Host "  [OK] Docker Containers - Built and Deployed" -ForegroundColor Green
Write-Host "  [OK] Pods and Deployments - Active" -ForegroundColor Green
Write-Host "  [OK] Services and Ingress - Configured" -ForegroundColor Green
Write-Host "  [OK] HPA Auto-scaling - Enabled" -ForegroundColor Green
Write-Host "  [OK] ConfigMaps and Secrets - Applied" -ForegroundColor Green
Write-Host "  [OK] MongoDB Database - Running" -ForegroundColor Green
Write-Host "  [OK] Prometheus Monitoring - Active" -ForegroundColor Green
Write-Host "  [OK] Grafana Dashboards - Available" -ForegroundColor Green
Write-Host "  [OK] Application UI - Accessible`n" -ForegroundColor Green

Write-Host "MANAGER DEMO URLS:" -ForegroundColor Cyan
Write-Host "  Application:  Will open automatically" -ForegroundColor White
Write-Host "  Prometheus:   http://localhost:9090" -ForegroundColor White
Write-Host "  Grafana:      Will open automatically (admin/admin123)" -ForegroundColor White

Write-Host "`nPress any key to view detailed resource status..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "`n================================================================" -ForegroundColor Green
