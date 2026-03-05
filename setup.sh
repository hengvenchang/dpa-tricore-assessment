#!/bin/bash

echo "🚀 Setting up DPA Tricore Assessment API..."
echo ""

# Step 1: Start Docker containers
echo "📦 Starting PostgreSQL database..."
docker-compose down -v 2>/dev/null
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
for i in {1..30}; do
  if docker exec dpa-tricore-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ Database is ready!"
    break
  fi
  echo "   Attempt $i/30..."
  sleep 2
done

# Step 2: Run Prisma migrations
echo ""
echo "🔧 Running Prisma migrations..."
npx prisma migrate dev --name init --skip-generate

# Step 3: Generate Prisma Client
echo ""
echo "📝 Generating Prisma Client..."
npx prisma generate

echo ""
echo "✨ Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  npm run start:dev"
echo ""
echo "API will be available at http://localhost:3000"