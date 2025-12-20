# Deployment Guide for Google Cloud Run

This guide will help you deploy the Raj Coaching Center application to Google Cloud Run.

## Prerequisites

1. Google Cloud account with billing enabled
2. `gcloud` CLI installed and configured
3. Docker installed locally
4. PostgreSQL database (Supabase recommended)

## Step 1: Set Up Supabase Database

1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for the database to be provisioned
3. Go to Settings → Database
4. Copy the connection string (URI format)
5. Save it for later use

## Step 2: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: Web application
   - Name: Raj Coaching Center
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for local dev)
     - `https://YOUR-APP-URL.run.app/api/auth/callback/google` (add after deployment)
5. Copy Client ID and Client Secret

## Step 3: Configure Google Cloud Project

```bash
# Set your project ID
export PROJECT_ID="your-gcp-project-id"

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

## Step 4: Build and Push Docker Image

```bash
# Navigate to project directory
cd /Users/a38371/Desktop/raj_coaching

# Build the Docker image
docker build -t gcr.io/$PROJECT_ID/raj-coaching:latest .

# Authenticate Docker with GCR
gcloud auth configure-docker

# Push the image
docker push gcr.io/$PROJECT_ID/raj-coaching:latest
```

## Step 5: Generate NextAuth Secret

```bash
# Generate a random secret
openssl rand -base64 32
```

Save this secret for the next step.

## Step 6: Deploy to Cloud Run

```bash
# Deploy the service
gcloud run deploy raj-coaching \
  --image gcr.io/$PROJECT_ID/raj-coaching:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "\
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres,\
NEXTAUTH_URL=https://raj-coaching-[HASH].run.app,\
NEXTAUTH_SECRET=[YOUR-GENERATED-SECRET],\
GOOGLE_CLIENT_ID=[YOUR-CLIENT-ID].apps.googleusercontent.com,\
GOOGLE_CLIENT_SECRET=[YOUR-CLIENT-SECRET]"
```

**Important:** Replace the placeholders with your actual values.

## Step 7: Update Google OAuth Redirect URI

1. Go back to Google Cloud Console → APIs & Services → Credentials
2. Click on your OAuth 2.0 Client ID
3. Add the new authorized redirect URI:
   - `https://raj-coaching-[YOUR-HASH].run.app/api/auth/callback/google`
4. Save changes

## Step 8: Initialize Database

1. Run Prisma migrations:
```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="your-supabase-connection-string"

# Push schema to database
npx prisma db push
```

2. Add your admin email:
```bash
# Open Prisma Studio
npx prisma studio
```

In Prisma Studio:
- Open `AuthorizedEmail` table
- Add a new record:
  - email: your-admin@gmail.com
  - role: ADMIN
  - classId: leave empty

## Step 9: Test Your Deployment

1. Visit your Cloud Run URL: `https://raj-coaching-[HASH].run.app`
2. Click "Sign in with Google"
3. Sign in with your authorized admin email
4. You should be redirected to the admin dashboard

## Step 10: Set Up Custom Domain (Optional)

1. Go to Cloud Run console
2. Select your service
3. Click "Manage Custom Domains"
4. Follow the instructions to add your domain
5. Update `NEXTAUTH_URL` environment variable with your custom domain
6. Update Google OAuth redirect URI with your custom domain

## Monitoring and Logs

View logs:
```bash
gcloud run services logs read raj-coaching --region us-central1
```

View metrics in Cloud Console:
- Go to Cloud Run → raj-coaching → Metrics

## Updating the Application

To deploy updates:

```bash
# Build new image
docker build -t gcr.io/$PROJECT_ID/raj-coaching:latest .

# Push to registry
docker push gcr.io/$PROJECT_ID/raj-coaching:latest

# Deploy update
gcloud run deploy raj-coaching \
  --image gcr.io/$PROJECT_ID/raj-coaching:latest \
  --platform managed \
  --region us-central1
```

## Cost Optimization

Cloud Run pricing is based on:
- Request count
- CPU and memory usage
- Execution time

For 50-100 users:
- Expected cost: $5-20/month
- Free tier includes: 2 million requests/month

To optimize costs:
- Set `--min-instances 0` (cold starts acceptable)
- Use `--memory 512Mi` (sufficient for this app)
- Monitor usage in Cloud Console

## Troubleshooting

### "Unauthorized" Error
- Verify email is in `AuthorizedEmail` table
- Check role is set correctly (ADMIN or STUDENT)

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Check Supabase database is running
- Ensure connection string includes password

### OAuth Error
- Verify redirect URIs match exactly
- Check Google OAuth credentials are correct
- Ensure Google+ API is enabled

### Build Fails
- Check Dockerfile syntax
- Verify all dependencies in package.json
- Ensure Node.js version compatibility

## Security Checklist

- ✅ NEXTAUTH_SECRET is random and secure
- ✅ Database credentials are not exposed
- ✅ Google OAuth credentials are secure
- ✅ HTTPS is enforced (automatic with Cloud Run)
- ✅ Email whitelist is configured
- ✅ Environment variables are set in Cloud Run (not in code)

## Support

For issues:
1. Check Cloud Run logs
2. Verify environment variables
3. Test database connection
4. Review Google OAuth setup

## Backup Strategy

1. **Database Backups:**
   - Supabase provides automatic daily backups
   - Export data regularly via Prisma Studio

2. **Code Backups:**
   - Use Git for version control
   - Push to GitHub/GitLab regularly

## Next Steps

After successful deployment:
1. Add student emails to authorized list
2. Create classes (9th-12th)
3. Add subjects and chapters
4. Upload study materials
5. Share the URL with students
