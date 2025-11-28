# AI Learning Platform - Backend API

Backend API for the AI-Powered Learning Management System with authentication and role-based access control.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Authentication**: JWT with refresh token rotation
- **Validation**: Zod
- **ORM**: Native PostgreSQL client (pg)

## Features

- User authentication (register, login, logout)
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Rate limiting on authentication endpoints
- Request validation with Zod
- Comprehensive error handling
- Database migrations
- Docker support

## Prerequisites

- Node.js 20 or higher
- PostgreSQL 16 or higher
- Redis 7 or higher
- npm or yarn

## Installation

### Option 1: Using Docker (Recommended)

1. From the project root directory:
```bash
docker-compose up
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 3000

### Option 2: Local Development

1. Install dependencies:
```bash
cd backend
npm install
```

2. Copy the environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials

4. Start PostgreSQL and Redis locally

5. Run the development server:
```bash
npm run dev
```

## Database Migrations

Migrations run automatically on server start. To run manually:

```bash
npx tsx src/database/migrate.ts
```

## API Endpoints

### Authentication

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "learner"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Logout
```http
POST /api/v1/auth/logout
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Get Profile (Protected)
```http
GET /api/v1/auth/profile
Authorization: Bearer your-access-token
```

#### Change Password (Protected)
```http
POST /api/v1/auth/change-password
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "oldPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

#### Logout from All Devices (Protected)
```http
POST /api/v1/auth/logout-all
Authorization: Bearer your-access-token
```

## User Roles

- `learner`: Default role for students
- `instructor`: Role for course instructors
- `admin`: Administrative role with full access

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*(),.?":{}|<>)

## Default Admin Account

- Email: `admin@ai-learning.com`
- Password: `Admin123!`

**Important**: Change this password in production!

## Environment Variables

See `.env.example` for all available configuration options.

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Project Structure

```
backend/
├── src/
│   ├── api/
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API routes
│   │   └── validators/       # Request validation schemas
│   ├── config/               # Configuration files
│   ├── database/             # Database migrations
│   ├── models/               # Data models
│   ├── repositories/         # Data access layer
│   ├── services/             # Business logic
│   ├── types/                # TypeScript types
│   ├── utils/                # Utility functions
│   ├── app.ts                # Express app setup
│   └── index.ts              # Entry point
├── tests/                    # Test files
├── .env                      # Environment variables
├── .env.example              # Environment template
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies
```

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting on authentication endpoints
- Password hashing with bcrypt
- JWT token expiration
- Refresh token rotation
- HttpOnly cookies for refresh tokens
- Input validation with Zod

## Error Handling

The API uses a consistent error response format:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-01-27T..."
  }
}
```

## Success Response Format

```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2025-01-27T..."
  }
}
```

## Health Check

```http
GET /health
```

Returns server status and uptime.

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT
