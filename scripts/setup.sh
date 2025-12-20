#!/bin/bash

echo "🚀 Setting up Raj Coaching Center..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual credentials before continuing."
    echo "   Required: DATABASE_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET"
    exit 0
fi

echo "✅ .env file found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma Client"
    exit 1
fi

echo "✅ Prisma Client generated"

# Push database schema
echo "🗄️  Pushing database schema..."
npx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ Failed to push database schema"
    echo "   Please check your DATABASE_URL in .env"
    exit 1
fi

echo "✅ Database schema pushed"

echo ""
echo "✨ Setup complete! Next steps:"
echo ""
echo "1. Add your admin email to the database:"
echo "   npx prisma studio"
echo "   Then add a record to AuthorizedEmail table with:"
echo "   - email: your-admin@gmail.com"
echo "   - role: ADMIN"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Visit http://localhost:3000 and sign in with your Google account"
echo ""
