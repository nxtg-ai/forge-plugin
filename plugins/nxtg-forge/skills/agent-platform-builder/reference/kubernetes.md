# Kubernetes Reference

Deployment + Service + HPA for a stateless API. Secrets go in `Secret`,
non-sensitive config in `ConfigMap`.

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-deployment
  labels: { app: api }
spec:
  replicas: 3
  selector:
    matchLabels: { app: api }
  template:
    metadata:
      labels: { app: api }
    spec:
      containers:
      - name: api
        image: ghcr.io/org/api:latest    # pin a digest/tag in prod, not :latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef: { name: api-secrets, key: database-url }
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef: { name: api-config, key: redis-url }
        resources:
          requests: { memory: "256Mi", cpu: "250m" }
          limits:   { memory: "512Mi", cpu: "500m" }
        livenessProbe:
          httpGet: { path: /health, port: 8000 }
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet: { path: /ready, port: 8000 }
          initialDelaySeconds: 5
          periodSeconds: 5
---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  selector: { app: api }
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: ClusterIP
---
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-deployment
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target: { type: Utilization, averageUtilization: 70 }
```

## Non-obvious traps

- **`liveness` vs `readiness` are not interchangeable.** A too-aggressive
  liveness probe (short `initialDelaySeconds` on a slow-booting app) makes the
  kubelet kill+restart the pod mid-startup → CrashLoopBackOff that looks like an
  app bug but is a probe-timing bug. Readiness gates traffic; liveness kills.
- **HPA on CPU `Utilization` requires resource `requests` to be set** — the
  percentage is computed against the request. No `requests.cpu` → HPA reports
  `<unknown>/70%` and never scales. The `requests` block above is load-bearing.
- **`image: :latest`** defeats rollbacks and makes `kubectl rollout undo`
  meaningless (both revisions point at the same mutable tag). Pin an immutable
  tag or digest in production.
- **`type: ClusterIP`** is internal-only. External access needs an `Ingress`
  (or `type: LoadBalancer` / NodePort) in front — the Service alone is not
  reachable from outside the cluster.
