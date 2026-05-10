# Authentication System Setup Guide

This guide will help you set up the authentication system for the Sentence Generator backend.

## 1. Run Database Migrations

Apply the new database migrations to create the users and sentence_history tables:

```bash
# Apply users table migration
npx wrangler d1 execute sentence-generator-db --local --file=./migrations/0002_create_users_table.sql

# Apply sentence history table migration
npx wrangler d1 execute sentence-generator-db --local --file=./migrations/0003_create_sentence_history_table.sql
```

For production:
```bash
# Apply users table migration
npx wrangler d1 execute sentence-generator-db --remote --file=./migrations/0002_create_users_table.sql

# Apply sentence history table migration
npx wrangler d1 execute sentence-generator-db --remote --file=./migrations/0003_create_sentence_history_table.sql
```

## 2. Set JWT Secret

### For Local Development:
Add to `wrangler.toml`:
```toml
[vars]
JWT_SECRET = "your-local-development-secret-key-min-32-chars"
```

### For Production:
Set as a secret (recommended):
```bash
echo "your-production-secret-key-min-32-chars" | npx wrangler secret put JWT_SECRET
```

**Important:** Use a strong, random secret key (at least 32 characters). You can generate one with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. API Endpoints

### Authentication Endpoints

#### Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe" // optional
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "provider": "email"
    },
    "token": "jwt-token"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

Response: Same as signup

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "provider": "email"
  }
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

### History Endpoints

#### Get History
```http
GET /api/history
Authorization: Bearer {token}
```

Response:
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "uuid",
        "sentence": "The quick brown fox jumps.",
        "createdAt": "2026-05-10T14:00:00.000Z",
        "options": {
          "includeNoun": true,
          "includeVerb": true,
          "includeAdjective": true,
          "includeAdverb": false
        }
      }
    ]
  }
}
```

#### Delete History Item
```http
DELETE /api/history/{id}
Authorization: Bearer {token}
```

#### Clear All History
```http
DELETE /api/history
Authorization: Bearer {token}
```

### Generate Sentence (Updated)
```http
POST /api/generate-sentence
Authorization: Bearer {token} // optional - saves to history if authenticated
Content-Type: application/json

{
  "includeNoun": true,
  "includeVerb": true,
  "includeAdjective": false,
  "includeAdverb": false
}
```

## 4. Frontend Integration

The frontend components are already created and ready to use:

1. **LoginForm** - Complete login UI (`src/components/LoginForm.tsx`)
2. **AuthContext** - Authentication state management (`src/contexts/AuthContext.tsx`)
3. **SentenceHistory** - History display (`src/components/SentenceHistory.tsx`)

### Wrap your app with AuthProvider:

```tsx
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  );
}
```

### Use authentication in components:

```tsx
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  // Use authentication state and methods
}
```

## 5. Testing

### Test Signup:
```bash
curl -X POST http://localhost:8787/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

### Test Login:
```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Protected Endpoint:
```bash
curl http://localhost:8787/api/history \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 6. Security Notes

- **Never commit JWT_SECRET to version control**
- Use strong, random passwords for users
- Tokens expire after 7 days
- HTTPS is required in production (Cloudflare Workers handles this)
- Password hashing uses SHA-256 (consider bcrypt for production)

## 7. Database Schema

### Users Table
- `id` - UUID primary key
- `email` - Unique email address
- `password_hash` - Hashed password (SHA-256)
- `name` - Optional display name
- `avatar` - Optional avatar URL
- `provider` - Auth provider (email, google, github)
- `provider_id` - External provider ID
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Sentence History Table
- `id` - UUID primary key
- `user_id` - Foreign key to users
- `sentence` - Generated sentence text
- `include_noun` - Boolean flag
- `include_verb` - Boolean flag
- `include_adjective` - Boolean flag
- `include_adverb` - Boolean flag
- `created_at` - Timestamp

## 8. Next Steps

1. Run the migrations
2. Set the JWT_SECRET
3. Test the endpoints locally
4. Deploy to production
5. Integrate the frontend components
6. (Optional) Add OAuth providers (Google, GitHub)

## OAuth Integration (Future Enhancement)

The frontend already has OAuth buttons for Google and GitHub. To implement:

1. Set up OAuth apps in Google/GitHub developer consoles
2. Add OAuth callback endpoints to the worker
3. Implement OAuth flow in AuthService
4. Store OAuth tokens securely

For now, email/password authentication is fully functional!
