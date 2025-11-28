# AI Learning Platform - Frontend

Frontend application for the AI-Powered Learning Management System.

## Tech Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Forms**: React Hook Form with Zod validation
- **Styling**: TailwindCSS
- **Testing**: Vitest + React Testing Library

## Features

- User authentication (login, register, logout)
- Protected routes with role-based access
- JWT token management with automatic refresh
- Form validation with React Hook Form and Zod
- Responsive UI with TailwindCSS
- Redux state management
- TypeScript for type safety

## Prerequisites

- Node.js 20 or higher
- npm or yarn

## Installation

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Copy the environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your API base URL (default: `http://localhost:3000/api/v1`)

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── auth/              # Authentication components
│   │       ├── LoginForm.tsx
│   │       ├── RegisterForm.tsx
│   │       └── ProtectedRoute.tsx
│   ├── hooks/                 # Custom hooks
│   │   └── useAuth.ts
│   ├── services/              # API services
│   │   └── auth.service.ts
│   ├── store/                 # Redux store
│   │   ├── slices/
│   │   │   └── auth.slice.ts
│   │   └── index.ts
│   ├── types/                 # TypeScript types
│   │   └── index.ts
│   └── utils/                 # Utility functions
│       └── http-client.ts
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Authentication Flow

1. User submits login/register form
2. Form data is validated using Zod schema
3. Request is sent to backend API
4. On success, access token is stored in localStorage
5. Refresh token is stored in httpOnly cookie
6. User is redirected to dashboard
7. Protected routes check authentication status
8. Token is automatically refreshed when expired

## Components

### LoginForm
- Email and password fields
- Form validation
- Error handling
- Loading state
- Link to registration

### RegisterForm
- User registration fields (email, password, first name, last name, role)
- Password strength validation
- Form validation with detailed error messages
- Loading state
- Link to login

### ProtectedRoute
- Wrapper component for protected pages
- Checks authentication status
- Supports role-based access control
- Redirects to login if unauthenticated
- Shows access denied for insufficient permissions

## State Management

Redux Toolkit is used for state management with the following slices:

- `auth`: User authentication state
  - `user`: Current user information
  - `isAuthenticated`: Authentication status
  - `isLoading`: Loading state
  - `error`: Error messages

## API Integration

The `http-client.ts` utility provides:

- Automatic token attachment to requests
- Token refresh on 401 errors
- Error handling
- Request/response interceptors

## Environment Variables

- `VITE_API_BASE_URL`: Backend API base URL

## TailwindCSS Setup

To enable TailwindCSS styling, create the following files:

1. `tailwind.config.js`:
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

2. `postcss.config.js`:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

3. `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT
