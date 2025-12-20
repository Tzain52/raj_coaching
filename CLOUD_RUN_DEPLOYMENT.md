# Google Cloud Run Deployment Guide

## Prerequisites

1. Google Cloud account with billing enabled
2. Google Cloud CLI installed: https://cloud.google.com/sdk/docs/install
3. Docker installed on your machine
4. Supabase database set up (see SUPABASE_SETUP.md)

## Step 1: Set Up Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (or use existing)
gcloud projects create raj-coaching-prod --name="Raj Coaching Center"

# Set the project
gcloud config set project raj-coaching-prod

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

## Step 2: Set Up Environment Variables

Create a `.env.production` file with your production values:

```env
# Database (from Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="https://raj-coaching-prod-xxx.run.app"
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Node Environment
NODE_ENV="production"
```

## Step 3: Update Google OAuth Settings

1. Go to https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   - `https://raj-coaching-prod-xxx.run.app/api/auth/callback/google`
   - (Replace `xxx` with your actual Cloud Run URL after first deployment)

## Step 4: Build and Deploy

### Option A: Deploy with Cloud Build (Recommended)

```bash
# Build and deploy in one command
gcloud run deploy raj-coaching \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1" \
  --set-env-vars "DIRECT_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres" \
  --set-env-vars "NEXTAUTH_URL=https://raj-coaching-prod-xxx.run.app" \
  --set-env-vars "NEXTAUTH_SECRET=your-secret-key" \
  --set-env-vars "GOOGLE_CLIENT_ID=your-client-id" \
  --set-env-vars "GOOGLE_CLIENT_SECRET=your-client-secret" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10
```

### Option B: Deploy with Docker (Manual)

```bash
# Build Docker image
docker build -t gcr.io/raj-coaching-prod/raj-coaching:latest .

# Push to Google Container Registry
docker push gcr.io/raj-coaching-prod/raj-coaching:latest

# Deploy to Cloud Run
gcloud run deploy raj-coaching \
  --image gcr.io/raj-coaching-prod/raj-coaching:latest \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --memory 512Mi \
  --cpu 1
```

## Step 5: Set Up Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service raj-coaching \
  --domain rajcoaching.com \
  --region asia-south1
```

Follow the instructions to update your DNS records.

## Step 6: Set Up Secret Manager (Better Security)

Instead of passing env vars directly, use Secret Manager:

```bash
# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Create secrets
echo -n "your-database-url" | gcloud secrets create database-url --data-file=-
echo -n "your-nextauth-secret" | gcloud secrets create nextauth-secret --data-file=-
echo -n "your-google-client-id" | gcloud secrets create google-client-id --data-file=-
echo -n "your-google-client-secret" | gcloud secrets create google-client-secret --data-file=-

# Deploy with secrets
gcloud run deploy raj-coaching \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-secrets="DATABASE_URL=database-url:latest,NEXTAUTH_SECRET=nextauth-secret:latest,GOOGLE_CLIENT_ID=google-client-id:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest"
```

## Step 7: Monitor and Logs

```bash
# View logs
gcloud run services logs read raj-coaching --region asia-south1

# View service details
gcloud run services describe raj-coaching --region asia-south1

# List all services
gcloud run services list
```

## Step 8: Set Up CI/CD (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - id: auth
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Deploy to Cloud Run
        uses: google-github-actions/deploy-cloudrun@v1
        with:
          service: raj-coaching
          region: asia-south1
          source: ./
```

## Estimated Costs

- **Cloud Run**: ~$0-5/month (free tier covers most small apps)
- **Supabase**: Free tier (500MB database, 2GB bandwidth)
- **Total**: ~$0-5/month for small to medium usage

## Useful Commands

```bash
# Update service
gcloud run services update raj-coaching --region asia-south1

# Delete service
gcloud run services delete raj-coaching --region asia-south1

# View service URL
gcloud run services describe raj-coaching --region asia-south1 --format='value(status.url)'

# Scale to zero when idle (save costs)
gcloud run services update raj-coaching --min-instances 0 --region asia-south1
```

## Troubleshooting

### Issue: Build fails
- Check Dockerfile syntax
- Ensure all dependencies are in package.json
- Check build logs: `gcloud builds log [BUILD_ID]`

### Issue: Service crashes
- Check logs: `gcloud run services logs read raj-coaching`
- Verify environment variables are set correctly
- Check database connection string

### Issue: 502 Bad Gateway
- Increase memory: `--memory 1Gi`
- Increase timeout: `--timeout 600`
- Check if app is listening on PORT env variable

## Next Steps

1. Set up monitoring and alerts in Google Cloud Console
2. Configure custom domain
3. Set up automated backups for Supabase
4. Implement rate limiting
5. Add CDN for static assets

✅ **Your app is now live on Google Cloud Run!**
