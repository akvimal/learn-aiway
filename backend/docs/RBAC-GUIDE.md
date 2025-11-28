# Role-Based Access Control (RBAC) Guide

## Overview

This application implements a comprehensive Role-Based Access Control (RBAC) system that manages user permissions and access to resources based on their assigned roles.

## User Roles

The system supports three user roles:

| Role | Description | Permissions |
|------|-------------|-------------|
| **learner** | Default role for regular users | Access to learning features, own profile |
| **instructor** | Content creators and educators | Create curricula, manage content, access to learner features |
| **admin** | System administrators | Full access including user management, role assignment |

## Role Hierarchy

```
admin (highest privileges)
  └── instructor
       └── learner (lowest privileges)
```

## Implementation

### 1. Middleware Functions

The `AuthMiddleware` class provides several middleware functions for protecting routes:

#### `authenticate()`
Verifies JWT token and attaches user information to the request.

```typescript
import { authMiddleware } from '../middleware/auth.middleware';

router.get('/protected',
  authMiddleware.authenticate.bind(authMiddleware),
  controller.method
);
```

#### `requireRole(...roles)`
Allows access only to users with specific roles.

```typescript
// Single role
router.post('/content',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR),
  controller.createContent
);

// Multiple roles
router.get('/dashboard',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN),
  controller.getDashboard
);
```

#### `requireAdmin()`
Shorthand for requiring admin role.

```typescript
router.delete('/users/:id',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireAdmin(),
  controller.deleteUser
);
```

#### `requireInstructorOrAdmin()`
Shorthand for requiring instructor or admin role.

```typescript
router.post('/curricula',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireInstructorOrAdmin(),
  controller.createCurriculum
);
```

#### `requireOwnerOrAdmin(paramName)`
Allows access if user owns the resource or is an admin.

```typescript
router.put('/profile/:userId',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireOwnerOrAdmin('userId'),
  controller.updateProfile
);
```

### 2. Admin Endpoints

All admin endpoints are protected and require admin role.

#### Base URL: `/api/v1/admin`

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/users` | List all users with pagination | Query: `page`, `limit`, `role`, `search` | User list with pagination |
| GET | `/users/:id` | Get user details by ID | - | User object |
| PATCH | `/users/:id/role` | Update user role | `{ role: string }` | Updated user |
| PATCH | `/users/:id/status` | Activate/deactivate user | `{ is_active: boolean }` | Updated user |
| GET | `/stats` | Get user statistics | - | Statistics object |

#### Example Usage

**List Users:**
```bash
GET /api/v1/admin/users?page=1&limit=20&role=learner
Authorization: Bearer <admin_token>
```

**Update User Role:**
```bash
PATCH /api/v1/admin/users/user-123/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "instructor"
}
```

**Get Statistics:**
```bash
GET /api/v1/admin/stats
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "success": true,
  "data": {
    "total": 150,
    "byRole": {
      "learner": 120,
      "instructor": 25,
      "admin": 5
    },
    "active": 145,
    "inactive": 5,
    "emailVerified": 130,
    "emailUnverified": 20
  }
}
```

### 3. Security Features

#### Protection Against Common Attacks

1. **Self-Role Modification**
   - Admins cannot change their own role
   - Prevents privilege escalation through self-modification

2. **Last Admin Protection**
   - Cannot demote or deactivate the last admin user
   - Ensures system always has at least one administrator

3. **Role Validation**
   - Only valid roles (learner, instructor, admin) are accepted
   - Invalid roles are rejected with 400 error

4. **Audit Logging**
   - All role changes are logged with:
     - Admin user ID
     - Target user ID
     - Old role
     - New role
     - Timestamp

#### Error Responses

```typescript
// Unauthorized (401) - Missing or invalid token
{
  "success": false,
  "error": {
    "message": "No token provided",
    "code": "UNAUTHORIZED"
  }
}

// Forbidden (403) - Insufficient permissions
{
  "success": false,
  "error": {
    "message": "Access denied. Required roles: admin. Your role: learner",
    "code": "FORBIDDEN"
  }
}
```

## Testing

### Unit Tests

Run unit tests for RBAC middleware:
```bash
npm test tests/unit/auth.middleware.test.ts
```

### Integration Tests

Run integration tests for admin endpoints:
```bash
npm test tests/integration/admin.test.ts
```

### Manual Testing

1. **Create Admin User** (via database or registration):
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

2. **Test Role Enforcement**:
```bash
# As learner - should fail (403)
curl -X GET http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer <learner_token>"

# As admin - should succeed (200)
curl -X GET http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer <admin_token>"
```

3. **Test Role Assignment**:
```bash
curl -X PATCH http://localhost:3000/api/v1/admin/users/user-123/role \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "instructor"}'
```

## Best Practices

### 1. Always Authenticate First
```typescript
// ✅ Correct
router.use(authMiddleware.authenticate.bind(authMiddleware));
router.use(authMiddleware.requireAdmin());

// ❌ Wrong
router.use(authMiddleware.requireAdmin());  // Will fail without authentication
```

### 2. Use Appropriate Role Checks
```typescript
// For resources that belong to users
router.put('/users/:userId/profile',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireOwnerOrAdmin('userId'),  // User can edit own, admin can edit any
  controller.updateProfile
);

// For admin-only operations
router.delete('/users/:id',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireAdmin(),  // Only admins
  controller.deleteUser
);
```

### 3. Log Security Events
```typescript
logger.info('Admin updated user role', {
  adminId: req.user?.userId,
  targetUserId: id,
  oldRole: user.role,
  newRole: role,
});
```

## Common Scenarios

### Adding a New Protected Route

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../../types';

const router = Router();

// Require authentication + specific role
router.post('/protected-resource',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN),
  controller.createResource
);
```

### Checking Roles in Controllers

```typescript
async someMethod(req: AuthenticatedRequest, res: Response) {
  const userRole = req.user?.role;

  if (userRole === UserRole.ADMIN) {
    // Admin-specific logic
  } else if (userRole === UserRole.INSTRUCTOR) {
    // Instructor-specific logic
  }
}
```

## Troubleshooting

### Issue: 401 Unauthorized
- **Cause**: Missing or invalid JWT token
- **Solution**: Ensure `Authorization: Bearer <token>` header is included

### Issue: 403 Forbidden
- **Cause**: User doesn't have required role
- **Solution**: Check user's role in database, assign appropriate role

### Issue: Cannot change last admin role
- **Cause**: Protection against removing all admins
- **Solution**: Create another admin user first, then modify the original

## Future Enhancements

Potential improvements to the RBAC system:

1. **Fine-grained Permissions**
   - Add specific permissions (read, write, delete) per resource
   - Role-permission mapping system

2. **Custom Roles**
   - Allow creation of custom roles
   - Dynamic role assignment

3. **Resource-based Access Control**
   - Per-resource permissions
   - Ownership tracking

4. **Temporary Roles**
   - Time-limited role assignments
   - Automatic role expiration

5. **Role Hierarchy**
   - Inheritance of permissions
   - Parent-child role relationships

## References

- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [NIST RBAC Model](https://csrc.nist.gov/projects/role-based-access-control)
- [Express.js Middleware Guide](https://expressjs.com/en/guide/using-middleware.html)
