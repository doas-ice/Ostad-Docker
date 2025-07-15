# Ostad Project: Full-Stack Student Management App

This repository demonstrates a complete DevOps journey for a Node.js/React full-stack application, progressing from local Docker Compose, to Kubernetes manifests with Ingress and HTTPS, and finally to production-grade deployment using Helm on AWS EC2.

---

## 🏗️ Project Structure

```
Ostad-Docker/
├── Ostadserver/         # Express.js backend
├── OstadUI/             # React + Vite frontend
├── docker-compose.yaml  # Local Docker Compose setup
├── Dockerfile-server    # Backend Dockerfile
├── Dockerfile-UI        # Frontend Dockerfile
├── k8s/                 # Raw Kubernetes manifests (YAML)
├── helm-charts-k8s/     # Helm charts for K8s deployment
└── readme.md            # (This file)
```

---

## 🚦 Timeline & Achievements

### 1. Local Development & Docker Compose

- **Built Docker images** for both backend (`Ostadserver`) and frontend (`OstadUI`).
- Used `docker-compose.yaml` to orchestrate multi-container local development, including MongoDB and Mongo Express.
- Enabled rapid local testing and development with a single command.

**To run locally:**
```bash
docker-compose up --build
```

---

### 2. Kubernetes Manifests: On-Prem/VM Cluster

- Authored raw Kubernetes YAML manifests for all components:
  - **Deployments** and **Services** for backend, frontend, MongoDB, and Mongo Express.
  - **ConfigMaps** and **Secrets** for environment configuration and sensitive data.
  - **Persistent Volumes** for MongoDB data durability.
  - **Ingress** with HTTPS (TLS) for secure, user-friendly access.
  - **Namespace** isolation for better resource management.
  - **MetalLB** for LoadBalancer support on bare-metal.
- Achieved production-like deployment on a self-hosted cluster (Kubeadm, Flannel CNI).

**See:** [`k8s/README.md`](k8s/README.md) for detailed setup, networking, and troubleshooting.

---

### 3. Helm Charts & AWS EC2 Production Deployment

- Modularized the application using **Helm charts** for each component.
- Created an **umbrella chart** (`ostad-stack`) for one-command deployment of the entire stack.
- Deployed to a Kubernetes cluster on AWS EC2, leveraging:
  - **Helm** for package management and upgrades.
  - **Prometheus + Grafana** for monitoring and observability.
  - **Centralized configuration** via Helm values and K8s ConfigMaps/Secrets.
- Exposed services via NodePort and LoadBalancer, with HTTPS Ingress for secure access.

**See:** [`helm-charts-k8s/README.md`](helm-charts-k8s/README.md) for AWS/Helm instructions, architecture, and monitoring setup.

---

## 🧩 Components

- **Backend:** Express.js API server (`Ostadserver`)
- **Frontend:** React + Vite SPA (`OstadUI`)
- **Database:** MongoDB
- **Admin UI:** Mongo Express
- **Monitoring:** Prometheus & Grafana (Helm deployment)

---

## 🚀 Quick Start

### Local (Docker Compose)
```bash
docker-compose up --build
```
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Kubernetes (Raw Manifests)
```bash
kubectl apply -Rf k8s/
```
- Access via Ingress (see `k8s/README.md` for hostnames and HTTPS setup)

### Kubernetes (Helm, AWS EC2)
```bash
# Prerequisites: K8s cluster, Helm, ConfigMaps/Secrets/Volumes applied
cd helm-charts-k8s
helm dependency update ostad-stack/
helm install ostad-stack ostad-stack/ --namespace mohammad-ullah --create-namespace
```
- Access via NodePort/LoadBalancer/Ingress (see `helm-charts-k8s/README.md`)

---

## 🔒 Security & Config

- All sensitive data (DB credentials, TLS certs) managed via Kubernetes Secrets.
- Configurable via environment variables, ConfigMaps, and Helm values.

---

## �� Monitoring

- Prometheus and Grafana deployed via Helm for cluster and app monitoring.
- See `helm-charts-k8s/README.md` for access details.

---

## 📚 Further Reading

- [k8s/README.md](k8s/README.md): Kubernetes manifests, networking, and troubleshooting
- [helm-charts-k8s/README.md](helm-charts-k8s/README.md): Helm, AWS, monitoring, and DevOps Q&A

---

## 🙋 Contact

For questions or support, please contact the maintainer or open an issue.

---

Happy DevOps-ing! 🚀
