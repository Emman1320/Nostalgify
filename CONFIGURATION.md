# Configuration Guide

This document lists all required GitHub Secrets and environment variables needed to configure and deploy the application.

## GitHub Repository Secrets

Configure these in your GitHub repository under **Settings → Secrets and variables → Actions → Secrets**.

### Required Secrets

| Secret Name | Description | Example | Notes |
|------------|-------------|---------|-------|
| `APP_DOMAIN` | Your public domain name where the app will be hosted | `bingo.example.com` | Must point to your EC2 instance's public IP via DNS A record |
| `LETSENCRYPT_EMAIL` | Email address for Let's Encrypt certificate notifications | `admin@example.com` | Used for SSL certificate registration |
| `EC2_HOST` | Public IP address or DNS hostname of your EC2 instance | `54.123.45.67` or `ec2-54-123-45-67.compute-1.amazonaws.com` | The EC2 instance where the app will be deployed |
| `EC2_USER` | SSH username for the EC2 instance | `ubuntu` | Typically `ubuntu` for Ubuntu AMIs, `ec2-user` for Amazon Linux |
| `EC2_SSH_PRIVATE_KEY` | Private SSH key content for accessing EC2 | `-----BEGIN OPENSSH PRIVATE KEY-----...` | Full private key content (not just the path) |
| `EC2_APP_DIR` | Directory path on EC2 where the app will be deployed | `/opt/bingo-revamp` | Directory will be created if it doesn't exist |
| `GHCR_USERNAME` | GitHub username that owns the token | `your-username` | Used to authenticate with GitHub Container Registry |
| `GHCR_READ_TOKEN` | GitHub Personal Access Token (PAT) with `read:packages` permission | `ghp_xxxxxxxxxxxx` | Token must have `read:packages` scope to pull images |

### How to Get/Set Each Secret

1. **APP_DOMAIN**: 
   - Your domain name (e.g., `bingo.example.com`)
   - Must have DNS A record pointing to EC2 public IP before first deployment

2. **LETSENCRYPT_EMAIL**: 
   - Any valid email address
   - Used for certificate expiration notifications

3. **EC2_HOST**: 
   - Find in AWS Console → EC2 → Instances → Public IPv4 address
   - Or use the public DNS name

4. **EC2_USER**: 
   - `ubuntu` for Ubuntu AMIs
   - `ec2-user` for Amazon Linux AMIs
   - Check your AMI documentation

5. **EC2_SSH_PRIVATE_KEY**: 
   - The private key (.pem file) you downloaded when creating the EC2 instance
   - Copy the entire file contents including `-----BEGIN` and `-----END` lines
   - If you lost it, you'll need to create a new key pair and attach it

6. **EC2_APP_DIR**: 
   - Choose any directory path (e.g., `/opt/bingo-revamp`, `/home/ubuntu/app`)
   - Ensure the user has write permissions

7. **GHCR_USERNAME**: 
   - Your GitHub username

8. **GHCR_READ_TOKEN**: 
   - Create at: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Required scopes: `read:packages`
   - Save the token immediately (you won't see it again)

## Environment Variables (Auto-Generated on EC2)

These are automatically created in the `.env` file on the EC2 instance during deployment. You don't need to set them manually, but here's what gets configured:

| Variable | Description | Default/Value |
|----------|-------------|--------------|
| `APP_DOMAIN` | Domain name for the application | From `APP_DOMAIN` secret |
| `LETSENCRYPT_EMAIL` | Email for Let's Encrypt | From `LETSENCRYPT_EMAIL` secret |
| `BACKEND_IMAGE` | Docker image for backend | `ghcr.io/{owner}/bingo-revamp-backend:{sha}` |
| `NGINX_IMAGE` | Docker image for nginx | `ghcr.io/{owner}/bingo-revamp-nginx:{sha}` |
| `PORT` | Backend HTTP API port | `8000` |
| `SOCKET_PORT` | Socket.IO port | `5000` |
| `VALKEY_URL` | Valkey (Redis) connection URL | `redis://valkey:6379` |
| `CORS_ORIGIN` | Allowed CORS origin | `https://{APP_DOMAIN}` |

## Backend Environment Variables

The backend container uses these environment variables (set automatically via docker-compose):

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` |
| `PORT` | HTTP API port | `8000` |
| `SOCKET_PORT` | Socket.IO port | `5000` |
| `SOCKET_PATH` | Socket.IO path | `/socket.io` |
| `VALKEY_URL` | Valkey connection string | `redis://valkey:6379` |
| `CORS_ORIGIN` | Allowed CORS origin | `https://{APP_DOMAIN}` |

## Frontend Build Variables

The frontend is built into the nginx image with these build-time variables (configured in `deploy/nginx/Dockerfile`):

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_BACKEND_URL` | Backend API base URL | `/api` |
| `REACT_APP_WEB_SOCKET_URL` | WebSocket server URL | (empty, uses same origin) |
| `REACT_APP_WEB_SOCKET_PATH` | WebSocket path | `/socket.io` |

## Pre-Deployment Checklist

Before running your first deployment:

- [ ] All 8 GitHub Secrets are configured
- [ ] EC2 instance is running and accessible via SSH
- [ ] Docker and Docker Compose are installed on EC2
- [ ] EC2 security group allows:
  - Port 22 (SSH) from your IP
  - Port 80 (HTTP) from anywhere (0.0.0.0/0)
  - Port 443 (HTTPS) from anywhere (0.0.0.0/0)
- [ ] DNS A record points `APP_DOMAIN` to EC2 public IP
- [ ] GitHub repository has GitHub Actions enabled
- [ ] GitHub Container Registry (GHCR) is accessible (public or you have access)

## Testing Your Configuration

1. **Test SSH access**:
   ```bash
   ssh -i your-key.pem EC2_USER@EC2_HOST
   ```

2. **Test DNS resolution**:
   ```bash
   nslookup APP_DOMAIN
   # Should return your EC2 public IP
   ```

3. **Verify GitHub token**:
   ```bash
   echo "GHCR_READ_TOKEN" | docker login ghcr.io -u "GHCR_USERNAME" --password-stdin
   ```

## Troubleshooting

### Common Issues

1. **"Permission denied (publickey)"**: 
   - Check `EC2_SSH_PRIVATE_KEY` secret format (must include BEGIN/END lines)
   - Verify `EC2_USER` matches your AMI

2. **"Cannot pull image"**: 
   - Verify `GHCR_READ_TOKEN` has `read:packages` scope
   - Check image names match your repository owner

3. **"DNS resolution failed"**: 
   - Ensure DNS A record is set and propagated (can take up to 48 hours)
   - Verify `APP_DOMAIN` matches your DNS record exactly

4. **"Port already in use"**: 
   - Check if another service is using ports 80/443
   - Stop conflicting services or change ports in docker-compose
