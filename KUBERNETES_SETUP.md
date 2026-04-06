# 🚀 Kubernetes Deployment Guide for BuyIndiaX

Complete guide to deploy BuyIndiaX on Kubernetes with monitoring.

## 📋 Prerequisites

### Required Tools
1. **kubectl** - Kubernetes command-line tool
   ```bash
   # Install kubectl
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   chmod +x kubectl
   sudo mv kubectl /usr/local/bin/
   ```

2. **Kubernetes Cluster** - Choose one:
   - **Minikube** (Local development)
   - **AWS EKS** (Production)
   - **Google GKE** (Production)
   - **Azure AKS** (Production)

### Install Minikube (For Local Testing)
```bash
# Install Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start Minikube
minikube start --cpus=4 --memory=8192

# Enable addons
minikube addons enable ingress
minikube addons enable metrics-server
```

## 🔧 Configuration

### 1. Update Secrets
Edit `k8s/secrets.yaml` with your actual credentials:

```yaml
# MongoDB password
password: <base64-encoded-password>

# Application secrets
JWT_SECRET: "your-actual-jwt-secret"
RAZORPAY_KEY_ID: "your-razorpay-key"
RAZORPAY_KEY_SECRET: "your-razorpay-secret"
GOOGLE_API_KEY: "your-google-api-key"
EMAIL_USER: "your-email@gmail.com"
EMAIL_PASS: "your-email-app-password"
```

**Generate base64 password:**
```bash
echo -n 'your-password' | base64
```

### 2. Build and Push Docker Image
```bash
# Build Docker image
docker build -t sumant3086/buyindiax:latest .

# Push to Docker Hub
docker login
docker push sumant3086/buyindiax:latest
```

## 🚀 Deployment

### Quick Deploy (Automated)
```bash
cd k8s
chmod +x deploy.sh
./deploy.sh
```

### Manual Deploy (Step by Step)
```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Create secrets
kubectl apply -f k8s/secrets.yaml

# 3. Create persistent volume
kubectl apply -f k8s/mongodb-pvc.yaml

# 4. Deploy MongoDB
kubectl apply -f k8s/mongodb-deployment.yaml

# 5. Deploy application
kubectl apply -f k8s/app-deployment.yaml

# 6. Setup autoscaling
kubectl apply -f k8s/hpa.yaml

# 7. Deploy monitoring
kubectl apply -f k8s/monitoring/prometheus-config.yaml
kubectl apply -f k8s/monitoring/prometheus-deployment.yaml
kubectl apply -f k8s/monitoring/grafana-deployment.yaml

# 8. Create ingress
kubectl apply -f k8s/ingress.yaml
```

## 📊 Monitoring Setup

### Access Grafana Dashboard
```bash
# Get Grafana URL
kubectl get svc grafana -n buyindiax

# Or port-forward
kubectl port-forward svc/grafana 3000:3000 -n buyindiax
```

**Grafana Login:**
- URL: http://localhost:3000
- Username: `admin`
- Password: `admin123`

### Access Prometheus
```bash
# Port-forward Prometheus
kubectl port-forward svc/prometheus 9090:9090 -n buyindiax
```

**Prometheus URL:** http://localhost:9090

### Import Grafana Dashboards
1. Login to Grafana
2. Go to Dashboards → Import
3. Use these dashboard IDs:
   - **315** - Kubernetes cluster monitoring
   - **6417** - Kubernetes pod monitoring
   - **1860** - Node exporter full

## 🔍 Verify Deployment

### Check All Resources
```bash
kubectl get all -n buyindiax
```

### Check Pod Status
```bash
kubectl get pods -n buyindiax
```

### Check Logs
```bash
# Application logs
kubectl logs -f deployment/buyindiax-app -n buyindiax

# MongoDB logs
kubectl logs -f deployment/mongodb -n buyindiax
```

### Test Health Check
```bash
# Get service IP
kubectl get svc buyindiax-service -n buyindiax

# Test health endpoint
curl http://<SERVICE-IP>/api/health
```

## 📈 Scaling

### Manual Scaling
```bash
# Scale to 5 replicas
kubectl scale deployment buyindiax-app --replicas=5 -n buyindiax
```

### Auto-scaling (Already configured)
- Minimum pods: 3
- Maximum pods: 10
- Scales based on CPU (70%) and Memory (80%)

## 🔄 Updates

### Rolling Update
```bash
# Update image
kubectl set image deployment/buyindiax-app buyindiax=sumant3086/buyindiax:v2 -n buyindiax

# Check rollout status
kubectl rollout status deployment/buyindiax-app -n buyindiax
```

### Rollback
```bash
# Rollback to previous version
kubectl rollout undo deployment/buyindiax-app -n buyindiax
```

## 🗑️ Cleanup

### Remove All Resources
```bash
cd k8s
chmod +x undeploy.sh
./undeploy.sh
```

### Or manually:
```bash
kubectl delete namespace buyindiax
```

## 🌐 Production Deployment (AWS EKS)

### 1. Create EKS Cluster
```bash
# Install eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# Create cluster
eksctl create cluster \
  --name buyindiax-cluster \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 5 \
  --managed
```

### 2. Install Ingress Controller
```bash
# Install nginx ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/aws/deploy.yaml
```

### 3. Install Cert-Manager (SSL)
```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create Let's Encrypt issuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### 4. Deploy Application
```bash
cd k8s
./deploy.sh
```

### 5. Configure DNS
```bash
# Get load balancer URL
kubectl get ingress -n buyindiax

# Point your domain to the load balancer
# Create A record: buyindiax.com → <LOAD-BALANCER-IP>
```

## 🔒 Security Best Practices

1. **Update Secrets** - Never use default passwords in production
2. **Enable RBAC** - Use role-based access control
3. **Network Policies** - Restrict pod-to-pod communication
4. **Image Scanning** - Scan Docker images for vulnerabilities
5. **Resource Limits** - Set CPU/memory limits for all pods
6. **TLS/SSL** - Always use HTTPS in production

## 📞 Troubleshooting

### Pods Not Starting
```bash
# Check pod events
kubectl describe pod <POD-NAME> -n buyindiax

# Check logs
kubectl logs <POD-NAME> -n buyindiax
```

### Database Connection Issues
```bash
# Test MongoDB connection
kubectl exec -it deployment/mongodb -n buyindiax -- mongosh -u admin -p

# Check MongoDB logs
kubectl logs deployment/mongodb -n buyindiax
```

### Service Not Accessible
```bash
# Check service
kubectl get svc -n buyindiax

# Check endpoints
kubectl get endpoints -n buyindiax
```

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

## 🎉 Success!

Your BuyIndiaX application is now running on Kubernetes with:
- ✅ High availability (3+ replicas)
- ✅ Auto-scaling
- ✅ Monitoring (Prometheus + Grafana)
- ✅ Load balancing
- ✅ Health checks
- ✅ Persistent storage

---

Made with ❤️ by Sumant
