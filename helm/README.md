# Helm Chart for BuyIndiaX

Simplified Kubernetes deployment using Helm package manager.

## Prerequisites

### Install Helm
```bash
# Install Helm 3
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify installation
helm version
```

## Quick Start

### 1. Install Chart
```bash
# Install with default values
helm install buyindiax ./helm/buyindiax -n buyindiax --create-namespace

# Install with custom values
helm install buyindiax ./helm/buyindiax \
  --set secrets.jwtSecret="your-secret" \
  --set mongodb.auth.password="your-password" \
  -n buyindiax --create-namespace
```

### 2. Check Status
```bash
# Check release status
helm status buyindiax -n buyindiax

# List all releases
helm list -n buyindiax
```

### 3. Upgrade
```bash
# Upgrade with new values
helm upgrade buyindiax ./helm/buyindiax \
  --set app.replicaCount=5 \
  -n buyindiax
```

### 4. Uninstall
```bash
# Remove all resources
helm uninstall buyindiax -n buyindiax
```

## Configuration

### Override Values
Create a custom `values.yaml`:

```yaml
app:
  replicaCount: 5
  image:
    tag: v2.0.0

mongodb:
  auth:
    password: "secure-password"

secrets:
  jwtSecret: "production-secret"
```

Install with custom values:
```bash
helm install buyindiax ./helm/buyindiax -f custom-values.yaml -n buyindiax
```

## Common Commands

```bash
# Dry run (test without installing)
helm install buyindiax ./helm/buyindiax --dry-run --debug -n buyindiax

# Get values
helm get values buyindiax -n buyindiax

# Rollback
helm rollback buyindiax 1 -n buyindiax

# History
helm history buyindiax -n buyindiax
```

## Benefits of Helm

- ✅ Single command deployment
- ✅ Easy upgrades and rollbacks
- ✅ Version control
- ✅ Templating and reusability
- ✅ Dependency management

---

Made with ❤️ by Sumant
