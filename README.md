# Raj Coaching Center - Student Management Platform

A modern, mobile-first coaching center management system built with Next.js 14, PostgreSQL, and Google OAuth authentication.

## Features

### For Admins
- **Class Management**: Create and manage classes (9th-12th grade, extensible)
- **Subject & Chapter Organization**: Full CRUD operations for subjects and chapters
- **Resource Management**: Upload Google Drive links for:
  - Notes
  - Homework assignments
  - Test papers
  - Reference materials
- **Email Whitelist**: Control access by authorizing student/admin emails
- **Student Overview**: View all registered students and their class assignments

### For Students
- **Class-Based Access**: Automatic access to assigned class materials
- **Subject Navigation**: Browse subjects and chapters
- **Resource Access**: Direct links to Google Drive materials
- **Mobile-Optimized**: Responsive design with mobile-first approach

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Authentication**: NextAuth.js with Google OAuth
- **UI**: TailwindCSS + shadcn/ui
- **Icons**: Lucide React
- **Deployment**: Docker + Google Cloud Run

## Prerequisites

- Node.js 18+ (or use Docker)
- PostgreSQL database (Supabase recommended)
- Google OAuth credentials

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd raj_coaching
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-random-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Admin Email (comma-separated for multiple admins)
ADMIN_EMAILS="admin@example.com"
```

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Client Secret to `.env`

### 4. Set Up Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma db push

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 5. Seed Initial Admin

Before starting, add your admin email to the database:

```bash
npx prisma studio
```

In Prisma Studio:
1. Open `AuthorizedEmail` table
2. Add a new record:
   - email: your-admin@gmail.com
   - role: ADMIN
   - classId: leave empty

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and sign in with your authorized Google account.

## Docker Deployment

### Build Docker Image

```bash
docker build -t raj-coaching .
```

### Run with Docker

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e GOOGLE_CLIENT_ID="your-client-id" \
  -e GOOGLE_CLIENT_SECRET="your-client-secret" \
  raj-coaching
```

## Deploy to Google Cloud Run

### 1. Build and Push to Google Container Registry

```bash
# Set your project ID
export PROJECT_ID="your-gcp-project-id"

# Build and tag
docker build -t gcr.io/$PROJECT_ID/raj-coaching .

# Push to GCR
docker push gcr.io/$PROJECT_ID/raj-coaching
```

### 2. Deploy to Cloud Run

```bash
gcloud run deploy raj-coaching \
  --image gcr.io/$PROJECT_ID/raj-coaching \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "DATABASE_URL=your-db-url,NEXTAUTH_URL=https://your-domain.com,NEXTAUTH_SECRET=your-secret,GOOGLE_CLIENT_ID=your-client-id,GOOGLE_CLIENT_SECRET=your-client-secret"
```

### 3. Update Google OAuth Redirect URI

Add your Cloud Run URL to authorized redirect URIs:
- `https://your-app-url.run.app/api/auth/callback/google`

## Usage Guide

### Admin Workflow

1. **Sign in** with authorized admin Google account
2. **Create Classes**: Add 9th, 10th, 11th, 12th (or custom)
3. **Add Subjects**: Create subjects for each class
4. **Add Chapters**: Organize content into chapters
5. **Authorize Students**: Add student emails and assign to classes
6. **Upload Resources**: Add Google Drive links with titles and descriptions

### Student Workflow

1. **Sign in** with authorized Google account
2. **Browse Subjects**: View all subjects for your class
3. **Select Chapter**: Choose a chapter to see materials
4. **Access Resources**: Click links to open in Google Drive

## Database Schema

- **User**: Stores user information and role
- **AuthorizedEmail**: Email whitelist for access control
- **Class**: Class definitions (9th-12th, etc.)
- **Subject**: Subjects within each class
- **Chapter**: Chapters within each subject
- **Resource**: Study materials (notes, homework, tests, etc.)

## API Routes

### Admin Routes
- `GET/POST /api/admin/classes` - Manage classes
- `GET/POST /api/admin/subjects` - Manage subjects
- `GET/POST /api/admin/chapters` - Manage chapters
- `GET/POST /api/admin/resources` - Manage resources
- `GET/POST /api/admin/emails` - Manage authorized emails

### Student Routes
- `GET /api/student/classes` - Get student's class info
- `GET /api/student/resources` - Get resources by subject/chapter

## Security Features

- Google OAuth authentication
- Email whitelist authorization
- Role-based access control (Admin/Student)
- Server-side session validation
- Protected API routes

## Performance Optimizations

- Server-side rendering (SSR) for fast initial loads
- Optimistic UI updates
- Efficient database queries with Prisma
- Mobile-first responsive design
- Docker containerization for consistent deployment

## Troubleshooting

### "Unauthorized" Error
- Ensure your email is in the `AuthorizedEmail` table
- Check that role is set correctly (ADMIN or STUDENT)

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure database is accessible from your network
- Run `npx prisma db push` to sync schema

### OAuth Errors
- Verify redirect URIs match exactly
- Check Google OAuth credentials are correct
- Ensure Google+ API is enabled

## Future Enhancements (v2)

- Fee tracking and reminders
- Automated email notifications
- Student analytics dashboard
- Attendance tracking
- Parent portal
- Mobile app (React Native)

## Support

For issues or questions, contact the administrator.

## License

Private - All Rights Reserved
