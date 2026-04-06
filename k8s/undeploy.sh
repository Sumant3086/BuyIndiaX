#!/bin/bash

# BuyIndiaX Kubernetes Undeployment Script
# This script removes all BuyIndiaX resources from Kubernetes

set -e

echo "🗑️  Removing BuyIndiaX from Kubernetes..."

# Delete all resources in reverse order
kubectl delete -f ingress.yaml --ignore-not-found=true
kubectl delete -f monitoring/grafana-deployment.yaml --ignore-not-found=true
kubectl delete -f monitoring/prometheus-deployment.yaml --ignore-not-found=true
kubectl delete -f monitoring/prometheus-config.yaml --ignore-not-found=true
kubectl delete -f hpa.yaml --ignore-not-found=true
kubectl delete -f app-deployment.yaml --ignore-not-found=true
kubectl delete -f mongodb-deployment.yaml --ignore-not-found=true
kubectl delete -f mongodb-pvc.yaml --ignore-not-found=true
kubectl delete -f secrets.yaml --ignore-not-found=true

# Optionally delete namespace (this will delete everything)
read -p "Do you want to delete the entire namespace? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    kubectl delete namespace buyindiax
    echo "✅ Namespace deleted"
else
    echo "✅ Resources deleted (namespace preserved)"
fi

echo "🎉 Cleanup completed!"
