# Kubernetes Deployment Guide

## Overview

This directory contains Kubernetes manifests for deploying the Glovo Dish Scraper API to production clusters.

## Files

- **manifests.yaml** - Main Kubernetes resources (Namespace, ConfigMap, Deployment, Service, HPA, RBAC)
- **network-policy.yaml** - Network security policies
- **ingress.yaml** - Nginx ingress controller and load balancing configuration

## Prerequisites

- Kubernetes cluster (1.20+)
- kubectl configured
- Persistent Volume provisioner (if using dynamic provisioning)
- Enough resources: 2+ CPU, 2Gi RAM

## Quick Start

### 1. Create Namespace and Resources

```bash
# Apply all manifests
kubectl apply -f manifests.yaml

# Apply network policies
kubectl apply -f network-policy.yaml

# Apply ingress configuration
kubectl apply -f ingress.yaml
```

### 2. Verify Deployment

```bash
# Check namespace
kubectl get ns glovo-scraper

# Check deployments
kubectl get deployments -n glovo-scraper

# Check pods
kubectl get pods -n glovo-scraper

# Check services
kubectl get svc -n glovo-scraper

# Check HPA status
kubectl get hpa -n glovo-scraper
```

### 3. Access the Application

```bash
# Get service IP/hostname
kubectl get svc glovo-scraper-api -n glovo-scraper

# Port forward for local access
kubectl port-forward svc/glovo-scraper-api 3000:80 -n glovo-scraper

# Access API
curl http://localhost:3000/api-docs
```

## Configuration

### Environment Variables

Edit `manifests.yaml` ConfigMap section to modify:

```yaml
data:
  NODE_ENV: "production"
  PORT: "3000"
  GLOVO_BASE_URL: "https://glovoapp.com"
  DEFAULT_LOCATION: "Casablanca, Morocco"
  HEADLESS_BROWSER: "false"
  BROWSER_TIMEOUT: "30000"
  SCROLL_ATTEMPTS: "20"
```

### Resource Scaling

Adjust replica counts and HPA settings in `manifests.yaml`:

```yaml
spec:
  replicas: 2        # Initial replicas
  minReplicas: 2     # HPA minimum
  maxReplicas: 5     # HPA maximum
```

### Storage

The deployment includes two PersistentVolumeClaims:
- **glovo-scraper-data-pvc** (1Gi) - For scraped data
- **glovo-scraper-screenshots-pvc** (500Mi) - For screenshots

Modify sizes in `manifests.yaml` if needed.

## Monitoring

### Health Checks

Liveness probe checks `/api/stores` endpoint every 30s
Readiness probe checks `/api-docs` endpoint every 10s

### Horizontal Pod Autoscaler

Automatically scales based on:
- CPU utilization > 70%
- Memory utilization > 80%

View HPA metrics:
```bash
kubectl get hpa -n glovo-scraper -w
kubectl describe hpa glovo-scraper-hpa -n glovo-scraper
```

### Pod Disruption Budget

Ensures minimum availability during cluster maintenance:
```bash
kubectl get pdb -n glovo-scraper
```

## Logging & Debugging

### View Logs

```bash
# View deployment logs
kubectl logs deployment/glovo-scraper-api -n glovo-scraper

# Follow logs
kubectl logs -f deployment/glovo-scraper-api -n glovo-scraper

# View specific pod logs
kubectl logs pod/glovo-scraper-api-xxxxx -n glovo-scraper
```

### Debug Pod

```bash
# Execute shell in pod
kubectl exec -it pod/glovo-scraper-api-xxxxx -n glovo-scraper -- /bin/sh

# Get pod details
kubectl describe pod/glovo-scraper-api-xxxxx -n glovo-scraper
```

### Events

```bash
# Get namespace events
kubectl get events -n glovo-scraper --sort-by='.lastTimestamp'

# Watch events
kubectl get events -n glovo-scraper -w
```

## Cleanup

### Delete All Resources

```bash
# Delete ingress
kubectl delete -f ingress.yaml

# Delete network policies
kubectl delete -f network-policy.yaml

# Delete manifests (includes namespace)
kubectl delete -f manifests.yaml
```

### Delete Specific Resources

```bash
# Delete deployment only
kubectl delete deployment glovo-scraper-api -n glovo-scraper

# Delete service
kubectl delete service glovo-scraper-api -n glovo-scraper

# Delete namespace
kubectl delete namespace glovo-scraper
```

## Security Best Practices

### Implemented

✅ Non-root user (UID 1000)
✅ Security context with dropped capabilities
✅ Network policies for pod communication
✅ RBAC with minimal permissions
✅ Resource limits and requests
✅ Health checks (liveness & readiness)
✅ Pod disruption budgets

### Recommended

1. **Secrets Management**
   ```bash
   # Create secret for environment variables
   kubectl create secret generic glovo-secrets \
     --from-literal=API_KEY=your-key \
     -n glovo-scraper
   ```

2. **Image Registry Authentication**
   ```bash
   kubectl create secret docker-registry regcred \
     --docker-server=<registry> \
     --docker-username=<username> \
     --docker-password=<password> \
     -n glovo-scraper
   ```

3. **TLS/SSL**
   - Set up Ingress with TLS
   - Use cert-manager for certificate management

4. **RBAC**
   - Review and restrict ClusterRole permissions
   - Use namespace-scoped roles

## Performance Tuning

### CPU/Memory

Current settings are conservative. Adjust based on testing:

```yaml
resources:
  requests:
    cpu: 500m      # Minimum guaranteed
    memory: 512Mi
  limits:
    cpu: 1000m     # Maximum allowed
    memory: 1Gi
```

### Concurrency

Modify Node.js worker count in deployment:
```yaml
env:
- name: NODE_WORKERS
  value: "4"
```

### Database Connections

If adding database, adjust connection pool:
```yaml
env:
- name: DB_POOL_SIZE
  value: "20"
```

## Troubleshooting

### Pod Won't Start

```bash
# Check pod status
kubectl describe pod <pod-name> -n glovo-scraper

# Check resource availability
kubectl top nodes
kubectl describe nodes
```

### High Memory Usage

```bash
# Check memory metrics
kubectl top pods -n glovo-scraper

# Check for memory leaks in logs
kubectl logs deployment/glovo-scraper-api -n glovo-scraper | grep -i memory
```

### HPA Not Scaling

```bash
# Check HPA status
kubectl describe hpa glovo-scraper-hpa -n glovo-scraper

# Verify metrics server is running
kubectl get deployment metrics-server -n kube-system
```

### Network Issues

```bash
# Test connectivity
kubectl exec -it pod/glovo-scraper-api-xxxxx -n glovo-scraper -- curl http://localhost:3000/api/stores

# Check network policies
kubectl get networkpolicies -n glovo-scraper
```

## CI/CD Integration

### GitLab CI Example

```yaml
deploy_k8s:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/glovo-scraper-api api=glovo-scraper-api:$CI_COMMIT_SHA -n glovo-scraper
    - kubectl rollout status deployment/glovo-scraper-api -n glovo-scraper
```

### GitHub Actions Example

```yaml
- name: Deploy to Kubernetes
  run: |
    kubectl set image deployment/glovo-scraper-api api=glovo-scraper-api:${{ github.sha }} -n glovo-scraper
    kubectl rollout status deployment/glovo-scraper-api -n glovo-scraper
```

## Advanced Topics

### Custom Metrics Autoscaling

For more sophisticated scaling based on request rate:

```bash
# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack

# Create PrometheusRule for custom metrics
kubectl apply -f prometheus-rules.yaml
```

### Service Mesh Integration

For advanced traffic management (optional):

```bash
# Install Istio
istioctl install --set profile=demo -y

# Apply Istio resources
kubectl apply -f istio-config.yaml
```

### Multi-Region Deployment

Use federated Kubernetes clusters for disaster recovery.

## Support

For issues or questions:
1. Check Kubernetes documentation: https://kubernetes.io/docs/
2. Review deployment events: `kubectl get events -n glovo-scraper`
3. Check pod logs: `kubectl logs -f deployment/glovo-scraper-api -n glovo-scraper`
4. Verify resource availability: `kubectl top nodes`