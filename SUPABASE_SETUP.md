# Supabase Setup Guide for Raj Coaching Center

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - **Name**: raj-coaching
   - **Database Password**: (create a strong password and save it)
   - **Region**: Choose closest to your users (e.g., Mumbai for India)
5. Click "Create new project" and wait for setup to complete

## Step 2: Get Database Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string** section
3. Select **URI** tab
4. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)
5. Replace `[YOUR-PASSWORD]` with your actual database password

## Step 3: Run SQL to Create Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the following SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create User table
CREATE TABLE "User" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    "emailVerified" TIMESTAMP(3),
    image TEXT,
    role TEXT NOT NULL DEFAULT 'STUDENT',
    "classId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Class table
CREATE TABLE "Class" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    name TEXT NOT NULL UNIQUE,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Subject table
CREATE TABLE "Subject" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    name TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subject_classId_name_key" UNIQUE ("classId", name)
);

-- Create Chapter table
CREATE TABLE "Chapter" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    name TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chapter_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Chapter_subjectId_name_key" UNIQUE ("subjectId", name)
);

-- Create Resource table
CREATE TABLE "Resource" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    link TEXT NOT NULL,
    "chapterId" TEXT,
    "subjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Resource_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Resource_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create AuthorizedEmail table
CREATE TABLE "AuthorizedEmail" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Account table (for NextAuth)
CREATE TABLE "Account" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "userId" TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Account_provider_providerAccountId_key" UNIQUE (provider, "providerAccountId")
);

-- Create Session table (for NextAuth)
CREATE TABLE "Session" (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "sessionToken" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    expires TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create VerificationToken table (for NextAuth)
CREATE TABLE "VerificationToken" (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VerificationToken_identifier_token_key" UNIQUE (identifier, token)
);

-- Add foreign key for User.classId
ALTER TABLE "User" ADD CONSTRAINT "User_classId_fkey" 
    FOREIGN KEY ("classId") REFERENCES "Class"(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for better performance
CREATE INDEX "User_email_idx" ON "User"(email);
CREATE INDEX "User_classId_idx" ON "User"("classId");
CREATE INDEX "Class_displayOrder_idx" ON "Class"("displayOrder");
CREATE INDEX "Subject_classId_idx" ON "Subject"("classId");
CREATE INDEX "Chapter_subjectId_idx" ON "Chapter"("subjectId");
CREATE INDEX "Resource_chapterId_idx" ON "Resource"("chapterId");
CREATE INDEX "Resource_subjectId_idx" ON "Resource"("subjectId");
CREATE INDEX "Resource_type_idx" ON "Resource"(type);
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- Create trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_class_updated_at BEFORE UPDATE ON "Class" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subject_updated_at BEFORE UPDATE ON "Subject" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chapter_updated_at BEFORE UPDATE ON "Chapter" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resource_updated_at BEFORE UPDATE ON "Resource" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

4. Click **Run** to execute the SQL
5. You should see "Success. No rows returned" message

## Step 4: Update Environment Variables

1. Copy your Supabase connection string
2. Update your `.env` file with:

```env
# Replace with your Supabase connection string
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# For Prisma migrations (direct connection, without pgbouncer)
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"
```

## Step 5: Update Prisma Schema

Your `prisma/schema.prisma` should have:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## Step 6: Push Schema to Supabase

Run in terminal:
```bash
npx prisma db push
npx prisma generate
```

## Step 7: Verify Tables

1. In Supabase dashboard, go to **Table Editor**
2. You should see all tables: User, Class, Subject, Chapter, Resource, AuthorizedEmail, Account, Session, VerificationToken

✅ **Supabase setup complete!**
