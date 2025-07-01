# Kubernetes Deployment: Full-Stack Student Mangement Application

**Repo:** [Ostad-Docker](https://github.com/doas-ice/Ostad-Docker)  

## Components:
- `ostad-server` – Node.js backend
- `ostad-ui` – Vite frontend
- `mongo` – MongoDB
- `mongo-express` – MongoDB admin panel

---

## Cluster Setup

| Component       | Details                                             |
|----------------|-----------------------------------------------------|
| **Control Plane** | Host machine running **Arch Linux**, provisioned using `kubeadm`, uses `etcd` for storing state |
| **Worker Node**  | KVM virtual machine running **Ubuntu Server**, joined via `libvirt` network |
| **Networking**   | [Flannel](https://github.com/flannel-io/flannel) CNI for Pod networking |
| **Ingress Controller** | [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/) |
| **Load Balancer** | [MetalLB](https://metallb.universe.tf/) in Layer 2 mode with IP pool `192.168.1.99/32` |

---

## YAML Manifests:
- `Deployments` – [deployments](https://github.com/doas-ice/Ostad-Docker/tree/main/k8s/deployments)
- `Services` – [services](https://github.com/doas-ice/Ostad-Docker/tree/main/k8s/services)
- `Config Maps` – [configs](https://github.com/doas-ice/Ostad-Docker/tree/main/k8s/configs)
- `Secrects` – [secrets](https://github.com/doas-ice/Ostad-Docker/tree/main/k8s/secrets)
- `Persistent Volume Claims` - [volumes](https://github.com/doas-ice/Ostad-Docker/tree/main/k8s/volumes)
- `Namespace` - [namespace.yaml](https://github.com/doas-ice/Ostad-Docker/blob/main/k8s/namespace.yaml)
- `Ingress` - [ingress.yaml](https://github.com/doas-ice/Ostad-Docker/blob/main/k8s/ingress.yaml)
- `MetalLB` - [metallb.yaml](https://github.com/doas-ice/Ostad-Docker/blob/main/k8s/metallb.yaml)


## Directory Structure

```
k8s/
├── deployments/
│   ├── mongo-express.yaml
│   ├── mongo.yaml
│   ├── ostad-server.yaml
│   └── ostad-ui.yaml
│
├── services/
│   ├── mongo-express.yaml
│   ├── mongo.yaml
│   ├── ostad-server.yaml
│   └── ostad-ui.yaml
│
├── volumes/
│   ├── 01-mongo-pv.yaml
│   └── 02-mongo-pvc.yaml
│
├── configs/
│   ├── mongo-configs.yaml
│   └── vite-configs.yaml
│
├── secrets/
│   └── mongo-secrets.yaml
│
├── ingress.yaml
├── metallb.yaml
└── namespace.yaml
````

## Setup and Deployment

**IP and Ports**
- Control Plane IP: `192.168.1.69`
- Worker Node (KVM) IP: `192.168.1.96`
- Pod Network CIDR: `10.69.0.0/16`
- OstadUI NodePort: `30000` (Optional)
- Mongo Express NodePort: `30081` (Optional)
- LoadBalancer External IP: `192.168.1.99`
  
---

**Cluster and Nodes Setup**  

![image](https://github.com/user-attachments/assets/afd22997-9a2f-48e4-966a-383bbd7d6520)

---

**Namespace `mohammad-ullah`**  

![image](https://github.com/user-attachments/assets/28346e22-e057-46f3-978a-d9f3fab737c9)

---

**Pods, Deployments, Services inside namespace `mohammad-ullah`**  

![image](https://github.com/user-attachments/assets/af793273-2acc-4d7d-9a1c-834aca31572b)

---

**Running Deployments**  

![image](https://github.com/user-attachments/assets/79af5f0e-f186-44e6-a993-b4f16878f68d)

---

**Services with NodePort and LoadBalancer**  

![image](https://github.com/user-attachments/assets/84300366-0314-4cb2-921a-8963d21a6443)

---

**Frontend accessed using NodePort (30000) `<Node-IP>:NodePort`**  

![image](https://github.com/user-attachments/assets/4212a4dc-8640-4416-9d9d-518cd31d623c)

---

**`/etc/hosts` config**  

```bash
192.168.1.99 app.local # Host for Frontend and Mongo Express
192.168.1.99 ostad-server # Host for Backend
```
---

**Ingress config**  

- `nginx.ingress.kubernetes.io/ssl-redirect: "true"` annotation to force HTTPS
- HTTPS Setup done using TLS for hosts `app.local` and `ostad-server` with Certificate and Keys stored in k8s secret `app-local-tls`

```yaml
  tls:
    - hosts:
        - app.local
        - ostad-server
      secretName: app-local-tls
```
  
- Host `app.local/` is forwarded to ostad-ui port 5173, `app.local/admin/` is forwarded to mongo-express port 8081
- Host `ostad-server` is forwarded to ostad-server backend port 5050, this is to allow access within frontend when accessing from a web browser

---

**Frontend accessed using `app.local` with HTTPS**  

![image](https://github.com/user-attachments/assets/94655020-fd08-496e-84c4-2552b63d45a0)

---

**Mongo Express accessed using `app.local/admin/` with HTTPS**   

![image](https://github.com/user-attachments/assets/f2956f1d-d5cf-44bb-b8c2-0350e4fa97c1)

---

**Backend API Request from Frontend using host `ostad-server` with HTTPS**  

![image](https://github.com/user-attachments/assets/ae03101d-1653-4de0-9e04-b5db5e8bac21)

---

## Bonus Features

### Resource Limits  

*Each Deployment is configured with approximated resource limits*  

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "250m"
  limits:
    memory: "256Mi"
    cpu: "500m"
```

---

### Secrets and ConfigMaps

*Used Config Maps and Secrets to increase portability and security*  

1. Config Maps to specify:
  - MongoDB server name
  - Mongo Express Base URL (`/admin/` otherwise Mongo Express can't be accessed using path based routing)
  - Backend hostname and port when accessing from frontend (otherwise we get `host not found` error)

```yaml
# mongo-configs.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mongo-config
  namespace: mohammad-ullah
data:
  MONGO_SERVER: "mongo"
  ME_BASEURL: "/admin/"

# vite-configs.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: vite-config
  namespace: mohammad-ullah
data:
  VITE_API_HOST: "https://ostad-server"
  VITE_API_PORT: ""
```

2. Secrets to store:
  - MongoDB username and password (Opaque type, Base64 encoded)
  - HTTPS/TLS certificate and keys

    
![image](https://github.com/user-attachments/assets/7d180c6d-9ae1-4c37-b69e-d5e8161438db)

---

### Persistent Volume for Mongo

*First Created a persistent volume (4Gi) inside the cluster `/mnt/data/mongo` and then a persistent volume claim with initial allocation of 2Gi and allocation limit of 3Gi to the volume


```yaml
# mongo-pv.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mongo-pv
spec:
  capacity:
    storage: 4Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: "/mnt/data/mongo"
  persistentVolumeReclaimPolicy: Retain

# mongo-pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongo-pvc
  namespace: mohammad-ullah
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 2Gi
    limits:
      storage: 3Gi
```

---

### Why MetalLB is Essential

* Kubernetes on bare-metal doesn’t support cloud LoadBalancer services.
* Without MetalLB, services marked `type: LoadBalancer` would remain with `EXTERNAL-IP: <pending>`, making browser access impossible.
* Using NodePort instead of LoadBalancer requires specifying the port alongside the hostname, which seems impractical.
* MetalLB solves this by assigning IPs from a predefined range on the local network (e.g. `192.168.1.99`).

---

## Source Code Modifications

* `ostad-ui` frontend was originally hardcoded to connect to backend at `localhost:5050`
* Updated to:

  ```js
  VITE_SERVER_URL=http://ostad-server
  ```
* Passed via `configMap`
* `ostad-ui` frontend didn't allow hostmapping `app.local`
* Added the following to `vite.config.js`

    ```js
        allowedHosts: ['app.local'],
    ```


