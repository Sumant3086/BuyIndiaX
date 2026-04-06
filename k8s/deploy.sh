#!/bin/bash

# BuyIndiaX Kubernetes Deployment Script
# This script deploys the entire application to Kubernetes cluster

set -e  # Exit on any error

echo "🚀 Starting BuyIndiaX Kubernetes Deployment..."

# Step 1: Create namespace
echo "📦 Creating namespace..."
kubectl apply -f namespace.yaml

# Step 2: Create secrets (IMPORTANT: Update secrets.yaml with your actual credentials first!)
echo "🔐 Creating secrets..."
kubectl apply -f secrets.yaml

# Step 3: Create persistent volume for MongoDB
echo "💾 Creating persistent volume..."
kubectl apply -f mongodb-pvc.yaml

# Step 4: Deploy MongoDB
echo "🗄️  Deploying MongoDB..."
kubectl apply -f mongodb-deployment.yaml

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
kubectl wait --for=condition=ready pod -l app=mongodb -n buyindiax --timeout=300s

# Step 5: Deploy application
echo "🌐 Deploying BuyIndiaX application..."
kubectl apply -f app-deployment.yaml

# Step 6: Create Horizontal Pod Autoscaler
echo "📈 Setting up autoscaling..."
kubectl apply -f hpa.yaml

# Step 7: Deploy monitoring (Prometheus & Grafana)
echo "📊 Deploying monitoring stack..."
kubectl apply -f monitoring/prometheus-config.yaml
kubectl apply -f monitoring/prometheus-deployment.yaml
kubectl apply -f monitoring/grafana-deployment.yaml

# Step 8: Create ingress (optional - requires ingress controller)
echo "🌍 Creating ingress..."
kubectl apply -f ingress.yaml || echo "⚠️  Ingress creation failed (ingress controller may not be installed)"

# Wait for application to be ready
echo "⏳ Waiting for application to be ready..."
kubectl wait --for=condition=ready pod -l app=buyindiax-app -n buyindiax --timeout=300s

# Display deployment status
echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Deployment Status:"
kubectl get all -n buyindiax
echo ""
echo "🔗 Access URLs:"
echo "   Application: http://$(kubectl get svc buyindiax-service -n buyindiax -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"
echo "   Grafana: http://$(kubectl get svc grafana -n buyindiax -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):3000"
echo "   Prometheus: kubectl port-forward svc/prometheus 9090:9090 -n buyindiax"
echo ""
echo "📝 Grafana Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "🎉 BuyIndiaX is now running on Kubernetes!"
