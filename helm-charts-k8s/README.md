# Ostad-Helm-Practice: Student Info App with Kubernetes, Helm, MongoDB, and Monitoring

## 📋 Assignment Overview

This project demonstrates a complete microservices application deployment using:
- **Kubernetes** (kubeadm) on AWS EC2
- **Helm** for package management
- **Prometheus + Grafana** for monitoring

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Ostad UI      │    │  Ostad Server   │    │     MongoDB     │
│   (React)       │◄──►│   (Express.js)  │◄──►│   (Database)    │
│ NodePort: 30060 │    │ NodePort: 30070 │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Mongo Express  │
                    │   (Admin UI)    │
                    │ NodePort: 30090 │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Monitoring    │
                    │   Prometheus    │
                    │ NodePort: 30100 │
                    │        +        │
                    │    Grafana      │
                    │ NodePort: 30200 │
                    └─────────────────┘
```

## 🚀 PART 1: Infrastructure Setup

### 1.1 AWS EC2 Instance Setup

#### Create VPC and Networking
```bash
# VPC Configuration
VPC Name: k8s-vpc
IPv4 CIDR: 10.0.0.0/16

# Subnet Configuration  
Subnet Name: k8s-subnet
AZ: ap-southeast-1a (Singapore)
IPv4 CIDR: 10.0.1.0/24

# Internet Gateway
Name: k8s-internet-gateway
Attach to: k8s-vpc

# Route Table
Add route: 0.0.0.0/0 → k8s-igw
Associate with: k8s-subnet
```

#### Security Group Configuration
```bash
# Security Group: k8s-sg
Inbound Rules:
├── SSH (22) - My IP
├── Kubernetes API (6443) - 10.0.0.0/16
├── etcd (2379-2380) - 10.0.0.0/16
├── Kubelet (10250-10255) - 10.0.0.0/16
├── NodePort (30000-32767) - 10.0.0.0/16
├── NodePort Access (30000-32767) - 0.0.0.0/0
└── ICMP (All) - 10.0.0.0/16
```

#### Launch EC2 Instances
```bash
# Control Plane Node
Instance Name: k8s-control-plane
AMI: Ubuntu Server 24.04 LTS
Instance Type: t3.medium
VPC: k8s-vpc
Subnet: k8s-subnet
Security Group: k8s-security-group

# Worker Node
Instance Name: k8s-worker-1
AMI: Ubuntu Server 24.04 LTS
Instance Type: t3.medium
VPC: k8s-vpc
Subnet: k8s-subnet
Security Group: k8s-security-group
```

### 1.2 Kubernetes Cluster Setup

#### Install Kubernetes Components
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# System Update & Upgrade
sudo apt update && sudo apt upgrade -y

# Install Dependencies
sudo apt install apt-transport-https curl -y;
sudo apt install containerd -y;

# Containerd systemd cgroup config
sudo mkdir -p /etc/containerd;
containerd config default | sudo tee /etc/containerd/config.toml > /dev/null;
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml;
sudo systemctl restart containerd;

# Install Kubernetes (Kubelet, Kubeadm, Kubectl)
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg;
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list;
sudo apt update;
sudo apt install -y kubelet kubeadm kubectl;
sudo apt-mark hold kubelet kubeadm kubectl;

# Load necessary kernel modules
sudo modprobe overlay;
sudo modprobe br_netfilter;

# Networking configuration IP Forwarding
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF
sudo sysctl --system;
```

#### Initialize Control Plane
```bash
# On Control Plane Node
sudo kubeadm init --pod-network-cidr=10.244.0.0/16

# Setup kubeconfig
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Install CNI (Flannel)
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml;
```

#### Join Worker Node
```bash
# On Worker Node (use the join command from control plane init output)
sudo kubeadm join <CONTROL_PLANE_IP>:6443 --token <TOKEN> --discovery-token-ca-cert-hash <HASH>
```

#### Verify Cluster
```bash
# On Control Plane
kubectl get nodes
kubectl get pods --all-namespaces
```

## 📦 PART 2: Helm Setup & Application Deployment

### 2.1 Install Helm
```bash
# Install Helm
curl https://baltocdn.com/helm/signing.asc | gpg --dearmor | sudo tee /usr/share/keyrings/helm.gpg > /dev/null
sudo apt-get install apt-transport-https --yes;
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/helm.gpg] https://baltocdn.com/helm/stable/debian/ all main" | sudo tee /etc/apt/sources.list.d/helm-stable-debian.list
sudo apt-get update
sudo apt-get install helm
```

### 2.2 Create Helm Charts Structure
```bash
# Create charts directory
mkdir -p helm-charts-k8s
cd helm-charts-k8s

# Create individual charts
helm create ostad-server
helm create ostad-ui
helm create mongo
helm create mongo-express
helm create ostad-stack
```

### 2.3 Umbrella Chart Benefits

#### Why Use Umbrella Chart?
- **Centralized Management**: All components managed from one place
- **Shared Configuration**: ConfigMaps and Secrets centralized
- **Simplified Deployment**: Single command to deploy entire application
- **Dependency Management**: Automatic ordering of deployments
- **Consistent Naming**: Unified naming across all components

### Centralized Values Setup

**Umbrella Chart Values:**
```yaml
# ostad-stack/Chart.yaml
dependencies:
  - name: mongo
    version: 0.1.0
    repository: "file://../mongo"
  - name: mongo-express
    version: 0.1.0
    repository: "file://../mongo-express"
  - name: ostad-server
    version: 0.1.0
    repository: "file://../ostad-server"
  - name: ostad-ui
    version: 0.1.0
    repository: "file://../ostad-ui"

# ostad-stack/values.yaml
mongo:
  nameOverride: "mongo"
  fullnameOverride: "mongo"
  image:
    repository: mongo
    tag: "latest"
  service:
    type: ClusterIP
    port: 27017
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 300m
      memory: 256Mi
  volumes:
    - name: mongo-persistent-storage
      persistentVolumeClaim:
        claimName: mongo-pvc
  volumeMounts:
    - name: mongo-persistent-storage
      mountPath: /data/db
  env:
    - name: MONGO_INITDB_ROOT_USERNAME
      valueFrom:
        secretKeyRef:
          name: mongo-secret
          key: MONGO_USER
    - name: MONGO_INITDB_ROOT_PASSWORD
      valueFrom:
        secretKeyRef:
          name: mongo-secret
          key: MONGO_PASS

mongo-express:
  nameOverride: "mongo-express"
  fullnameOverride: "mongo-express"
  image:
    repository: mongo-express
    tag: "latest"
  service:
    type: NodePort
    port: 8081
    nodePort: 30090
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 100m
      memory: 128Mi
  env:
    - name: ME_CONFIG_MONGODB_ADMINUSERNAME
      valueFrom:
        secretKeyRef:
          name: mongo-secret
          key: MONGO_USER
    - name: ME_CONFIG_MONGODB_ADMINPASSWORD
      valueFrom:
        secretKeyRef:
          name: mongo-secret
          key: MONGO_PASS
    - name: ME_CONFIG_MONGODB_SERVER
      valueFrom:
        configMapKeyRef:
          name: mongo-config
          key: MONGO_SERVER
    - name: ME_CONFIG_SITE_BASEURL
      valueFrom:
        configMapKeyRef:
          name: mongo-config
          key: ME_BASEURL

ostad-server:
  nameOverride: "ostad-server"
  fullnameOverride: "ostad-server"
  image:
    repository: aureri/ostad-server
    tag: "latest"
    pullPolicy: Always
  service:
    type: NodePort
    port: 5050
    nodePort: 30070
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 100m
      memory: 128Mi
  envFrom:
    - configMapRef:
        name: mongo-config

ostad-ui:
  nameOverride: "ostad-ui"
  fullnameOverride: "ostad-ui"
  image:
    repository: aureri/ostad-ui
    tag: "latest"
    pullPolicy: Always
  service:
    type: NodePort
    port: 5173
    nodePort: 30060
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 100m
      memory: 128Mi
  env:
    - name: VITE_API_HOST
      valueFrom:
        configMapKeyRef:
          name: vite-config
          key: VITE_API_HOST
    - name: VITE_API_PORT
      valueFrom:
        configMapKeyRef:
          name: vite-config
          key: VITE_API_PORT
```

#### Deploy with Umbrella Chart
```bash
# Apply required ConfigMaps, Secrets & Volumes
kubectl create namespace mohammad-ullah
kubectl apply -Rf ../k8s/configs
kubectl apply -Rf ../k8s/secrets
kubectl apply -Rf ../k8s/volumes

# Install the complete application stack
helm dependency update ostad-stack/
helm install ostad-stack ostad-stack/ --namespace mohammad-ullah --create-namespace
```

### 2.4 Verify Deployment
```bash
# Check all resources
kubectl get all -n mohammad-ullah

# Check services
kubectl get svc -n mohammad-ullah

# Check pods
kubectl get pods -n mohammad-ullah

# Check logs
kubectl logs -n mohammad-ullah -l app.kubernetes.io/name=ostad-server
```

## 📊 PART 3: Monitoring Setup

### 3.1 Install Prometheus Stack
```bash
# Add Prometheus repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install monitoring stack
helm install monitor prometheus-community/kube-prometheus-stack \
    --namespace monitoring \
    --create-namespace \
    -f monitoring-values.yaml
```

### 3.2 Expose Grafana
- Grafana is exposed through NodePort 30200

### 3.3 Access Monitoring
```bash
# Grafana Access
URL: http://<NODE_IP>:30200
Username: admin
Password: prom-operator
```

## 🧪 PART 4: Testing & Validation

### 4.1 Test API Endpoints
```bash
# Add a student
curl -X POST http://<NODE_IP>:30070/student \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","age":25}'

# Get all students
curl -X GET http://<NODE_IP>:30070/student
```

### 4.2 Test Frontend
```bash
# Access UI
http://<NODE_IP>:30060
```

### 4.3 Test Mongo Express
```bash
# Access Mongo Express
http://<NODE_IP>:30090
```

### 4.4 Verify Monitoring
```bash
# Access Prometheus
http://<NODE_IP>:30100

# Access Grafana
http://<NODE_IP>:30200
```

## 📋 DevOps Questions & Answers

### 1. What is the role of kubeadm?
**Answer**: kubeadm is a tool that provides a simple way to bootstrap a Kubernetes cluster. It handles the initialization of the control plane, joining worker nodes, and setting up the cluster's basic components like etcd, API server, controller manager, and scheduler.

### 2. What are the differences between kubeadm and minikube?
**Answer**: 
- **kubeadm**: Production-ready tool for creating multi-node clusters, requires manual setup of networking and storage
- **minikube**: Development tool for single-node local clusters, includes built-in add-ons and simplified setup

### 3. What is a Kubernetes pod?
**Answer**: A pod is the smallest deployable unit in Kubernetes. It contains one or more containers that share the same network namespace, storage, and lifecycle.

### 4. What is the use of a Deployment object?
**Answer**: A Deployment provides declarative updates for pods and ReplicaSets. It ensures a specified number of pods are running and handles rolling updates and rollbacks.

### 5. What is the purpose of a Service in K8s?
**Answer**: A Service provides a stable IP address and DNS name for a set of pods, enabling load balancing and service discovery within the cluster.

### 6. What is a NodePort service?
**Answer**: NodePort exposes the service on each node's IP at a static port (30000-32767), making it accessible from outside the cluster.

### 7. What is a ConfigMap?
**Answer**: A ConfigMap stores non-confidential configuration data in key-value pairs, allowing applications to be configured without rebuilding container images.

### 8. What is a Secret in Kubernetes?
**Answer**: A Secret stores sensitive data like passwords, tokens, and keys in base64-encoded format, providing a secure way to manage sensitive information.

### 9. Why do we use Helm?
**Answer**: Helm is a package manager for Kubernetes that simplifies the deployment and management of complex applications by packaging them into charts with templated manifests.

### 10. How is a Helm chart structured?
**Answer**: A Helm chart contains:
- `Chart.yaml`: Chart metadata
- `values.yaml`: Default configuration values
- `templates/`: Kubernetes manifest templates
- `charts/`: Dependent charts

### 11. How can we roll back a Helm release?
**Answer**: Use `helm rollback <release-name> <revision-number>` or `helm rollback <release-name>` to rollback to the previous revision.

### 12. How do you inspect a running pod's logs?
**Answer**: Use `kubectl logs <pod-name>` or `kubectl logs -f <pod-name>` for follow mode.

### 13. What is the purpose of Prometheus?
**Answer**: Prometheus is a monitoring and alerting toolkit that collects metrics from targets, stores them, and provides querying capabilities.

### 14. How does Prometheus collect metrics?
**Answer**: Prometheus scrapes metrics from HTTP endpoints on targets, typically `/metrics`, at regular intervals.

### 15. What is a Grafana dashboard panel?
**Answer**: A panel is a visualization component in Grafana that displays data in various formats like graphs, tables, or gauges.

### 16. What's the default port of Prometheus and Grafana?
**Answer**: Prometheus: 9090, Grafana: 3000

### 17. What is kubectl describe pod used for?
**Answer**: `kubectl describe pod` provides detailed information about a pod including events, status, and configuration details.

### 18. What happens if you delete a pod manually?
**Answer**: If the pod is managed by a Deployment, it will be automatically recreated. If not managed, it will be permanently deleted.

### 19. Why use separate namespaces in K8s?
**Answer**: Namespaces provide a way to divide cluster resources between multiple users, teams, or applications, enabling better organization and resource management.

### 20. How can you scale a deployment in Kubernetes?
**Answer**: Use `kubectl scale deployment <name> --replicas=<number>` or `kubectl edit deployment <name>` to modify the replica count.

## 🔧 Troubleshooting

### 1. mongo-express cant connect to mongodb
**What happened**  
I noticed DNS resolution inside the cluster was failing—pods couldn’t reach CoreDNS and queries were timing out. Even though UDP port 8472 was open, packet captures showed repeated **“UDP: bad checksum”** errors on the Flannel VXLAN interface (`flannel.1`).

**Why it broke**  
Linux was offloading checksum calculation to the NIC. In VXLAN this often yields malformed packets that get dropped—especially in virtualized environments like AWS or VMware.

**How I fixed it**  
On **every node**, I disabled checksum offloading for `flannel.1` using:
```bash
sudo ethtool -K flannel.1 tx-checksum-ip-generic off
```
On **control node**
```bash
kubectl -n kube-flannel rollout restart daemonset kube-flannel-ds
kubectl -n kube-system rollout restart deployment coredns
```

## 📁 Project Structure

```
Ostad-Docker/
├── helm-charts-k8s/
│   ├── ostad-server/
│   ├── ostad-ui/
│   ├── mongo/
│   ├── mongo-express/
│   ├── ostad-stack/
│   └── monitoring-values.yaml
├── README.md
```

## 🎯 Success Criteria

- ✅ Kubernetes cluster running with 2 nodes
- ✅ All application components deployed via Helm
- ✅ Application accessible via NodePort services
- ✅ MongoDB data persistence working
- ✅ Monitoring stack operational
- ✅ API endpoints functional
- ✅ Frontend application working
- ✅ Documentation complete

