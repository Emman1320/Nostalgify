# Deployment

This repository now supports a Docker-based EC2 deployment with:

- Nginx serving the React build on `/`
- Nginx proxying the API on `/api`
- Nginx proxying Socket.IO on `/socket.io`
- HTTPS via Let's Encrypt and Certbot
- Manual GitHub Actions deployment through `workflow_dispatch`

## Architecture

The production stack uses one public origin:

- `https://your-domain.com/` for the frontend
- `https://your-domain.com/api/*` for Express
- `https://your-domain.com/socket.io/*` for Socket.IO

Containers:

- `nginx`: serves frontend and reverse-proxies traffic
- `backend`: runs the Express API and Socket.IO server
- `valkey`: Redis-compatible store required by the current backend runtime
- `certbot`: one-off container used to issue and renew certificates

## GitHub Secrets

Add these repository secrets before using the deploy workflow:

- `APP_DOMAIN`: your public DNS name, for example `bingo.example.com`
- `LETSENCRYPT_EMAIL`: email used for Let's Encrypt
- `EC2_HOST`: public IP or DNS of the EC2 instance
- `EC2_USER`: SSH user, commonly `ubuntu`
- `EC2_SSH_PRIVATE_KEY`: private key that can SSH into the instance
- `EC2_APP_DIR`: deployment directory on the server, for example `/opt/bingo-revamp`
- `GHCR_USERNAME`: GitHub username that owns a token with `read:packages`
- `GHCR_READ_TOKEN`: GitHub token or PAT with `read:packages`

## EC2 Setup

Use Ubuntu 22.04 or similar. On a `t3.micro`, keep the stack lean and avoid extra background services.

Install Docker and Compose plugin:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Open these security group ports:

- `22` from your admin IP
- `80` from the internet
- `443` from the internet

Point your DNS `A` record at the instance before the first deploy.

## First Deployment

The first deploy is still triggered from GitHub Actions. The deployment script will:

1. copy the Compose bundle to the EC2 host
2. pull the latest images from GHCR
3. start the stack on HTTP
4. request a Let's Encrypt certificate
5. restart Nginx with HTTPS enabled

After that, running the same manual deploy action replaces the containers with the new image tags.

## Manual SSL Renewal

Add a cron entry on the EC2 host so certificates renew automatically:

```bash
0 3 * * 1 cd /opt/bingo-revamp && ./deploy/ec2/renew-ssl.sh >> /var/log/bingo-renew.log 2>&1
```

Adjust the path if you use a different `EC2_APP_DIR`.

## Local Docker Run

You can also build and run the stack locally without HTTPS:

```bash
docker compose -f docker-compose.prod.yml up --build
```

If `APP_DOMAIN` is unset, Nginx stays in HTTP mode and serves the app on port `80`.
