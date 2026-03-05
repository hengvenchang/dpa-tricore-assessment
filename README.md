# DPA Tricore Assessment - Customer Management API

REST API for managing customers with JWT authentication, built with NestJS, Prisma, and PostgreSQL.

## Tech Stack

- **NestJS** - Node.js framework
- **PostgreSQL** - Database (Docker)
- **Prisma** - ORM
- **JWT** - Authentication

## Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Configure .env file (see Environment Variables section below)

# 3. Start database
docker-compose up -d

# 4. Setup database
npx prisma migrate dev

# 5. Run application
npm run start:dev
```

API available at: **http://localhost:3000**

---

## 📡 API Endpoints

## 📡 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---|
| POST | `/auth/register` | Register a new user | ❌ |
| POST | `/auth/login` | Login and get JWT token | ❌ |

### Customer Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---|
| POST | `/customers` | Create a new customer | ✅ |
| GET | `/customers` | Get all customers (paginated) | ✅ |
| GET | `/customers/:id` | Get customer by ID (UUID) | ✅ |
| PUT | `/customers/:id` | Update customer (UUID) | ✅ |
| DELETE | `/customers/:id` | Delete customer (UUID) | ✅ |

## 📝 API Usage Examples

### 1. Register a New User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cheangvenheng@gmail.com",
    "password": "securepassword123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "5786fbdb-92a1-48c1-ab9c-243443169eab",
    "email": "cheangvenheng@gmail.com"
  }
}
```

### 2. Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cheangvenheng@gmail.com",
    "password": "securepassword123"
  }'
```

### 3. Create a Customer
```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Monika",
    "email": "monika@gmail.com"
  }'
```

### 4. Get All Customers
```bash
curl -X GET "http://localhost:3000/api/v1/customers?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Get Customer by ID
```bash
curl -X GET http://localhost:3000/api/v1/customers/5786fbdb-92a1-48c1-ab9c-243443169eab \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Update Customer
```bash
curl -X PUT http://localhost:3000/api/v1/customers/5786fbdb-92a1-48c1-ab9c-243443169eab \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Monika Updated",
    "email": "monika.updated@gmail.com"
  }'
```

### 7. Delete Customer
```bash
curl -X DELETE http://localhost:3000/api/v1/customers/5786fbdb-92a1-48c1-ab9c-243443169eab \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**⚠️ Note**: Customer IDs must be valid UUIDs. Non-UUID values will return a 400 Bad Request error.

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following:

```env
# Database Configuration
DATABASE_URL="postgresql://tricore_user:tricore_password@localhost:5432/dpa_tricore?schema=public"

# JWT Configuration
JWT_SECRET="your-secret-key-change-this-in-production"

# Environment
NODE_ENV="development"

# API Configuration (optional)
API_VERSION="v1"
API_PORT="3000"
```

### Database Connection Details (from docker-compose.yml)
- **Host**: localhost
- **Port**: 5432
- **Username**: tricore_user
- **Password**: tricore_password
- **Database**: dpa_tricore

## 🏗️ Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── register.dto.ts
│   │   └── auth-response.dto.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   └── strategies/
│       └── jwt.strategy.ts
├── customers/               # Customers module
│   ├── customers.controller.ts
│   ├── customers.service.ts
│   ├── customers.module.ts
│   └── dto/
│       ├── create-customer.dto.ts
│       ├── update-customer.dto.ts
│       └── customer-response.dto.ts
├── prisma/                  # Database service
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── app.module.ts            # Main application module
└── main.ts                  # Application entry point

prisma/
├── schema.prisma            # Combined schema
├── schemas/
│   ├── user.prisma
│   └── customer.prisma
└── migrations/              # Database migrations

docker-compose.yml           # PostgreSQL configuration
```

## 🧪 Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e

# Generate test coverage report
npm run test:cov
```

## 🛠️ Development Commands

```bash
# Start development server with auto-reload
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Lint TypeScript files
npm run lint

# Format code with prettier
npm run format

# View database in Prisma Studio
npx prisma studio

# Generate new migration
npx prisma migrate dev --name <migration_name>

# Reset database (⚠️ clears all data)
npx prisma migrate reset
```

## 🔧 Troubleshooting

### Database Connection Issues

**Error: "connect ECONNREFUSED 127.0.0.1:5432"**
```bash
# Check if Docker container is running
docker-compose ps

# Start database if stopped
docker-compose up -d

# View logs
docker-compose logs postgres
```

### Invalid UUID Error

**Error: "Invalid user ID format. Valid UUID required."**
- This occurs when using non-UUID IDs (like integers)
- Solution: Register new users or reset database:
```bash
# Reset and recreate database
npx prisma migrate reset
```

### JWT Token Issues

**Error: "Invalid user ID missing in JWT token"**
- Token is malformed or expired
- Try logging in again to get a fresh token

### Port Already in Use

**Error: "Port 3000 already in use"**
```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm run start:dev
```

### Prisma Client Issues

**Error: "PrismaClientInitializationError"**
```bash
# Regenerate Prisma client
npx prisma generate

# Reinstall dependencies
rm -rf node_modules
npm install
```

## 🗑️ Cleanup

### Stop Database
```bash
docker-compose down
```

### Remove Database Volume (⚠️ deletes all data)
```bash
docker-compose down -v
```

### Remove All Containers and Images
```bash
docker-compose down --rmi all
```

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT.io](https://jwt.io) - JWT debugger and documentation
- [Docker Documentation](https://docs.docker.com/)

## 📋 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  INDEX(id),
  INDEX(email)
);
```

### Customers Table
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

## 📄 License

This project is for assessment purposes.
