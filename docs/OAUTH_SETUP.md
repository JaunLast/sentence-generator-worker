# OAuth Setup Guide

## Overview

The backend now supports Google and GitHub OAuth authentication. To enable it, you need to:

1. Create OAuth applications in Google and GitHub
2. Configure environment variables
3. Update frontend to handle OAuth callbacks

---

## 1. Google OAuth Setup

### Create Google OAuth App

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if prompted
6. Application type: **Web application**
7. Add authorized redirect URIs:
   - `http://localhost:8787/api/auth/google/callback` (local)
   - `https://sentence-generator-worker.jaun98last.workers.dev/api/auth/google/callback` (production)
8. Save and copy **Client ID** and **Client Secret**

### Set Environment Variables

**Local Development (`wrangler.toml`):**
```toml
[vars]
GOOGLE_CLIENT_ID = "your-google-client-id"
GOOGLE_CLIENT_SECRET = "your-google-client-secret"
```

**Production (GitHub Secrets):**
Add to your GitHub repository secrets:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Then update `.github/workflows/deploy.yml`:
```yaml
- name: Set Google OAuth secrets
  run: |
    echo "${{ secrets.GOOGLE_CLIENT_ID }}" | npx wrangler secret put GOOGLE_CLIENT_ID --env production
    echo "${{ secrets.GOOGLE_CLIENT_SECRET }}" | npx wrangler secret put GOOGLE_CLIENT_SECRET --env production
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

---

## 2. GitHub OAuth Setup

### Create GitHub OAuth App

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in details:
   - **Application name:** Sentence Generator
   - **Homepage URL:** `http://localhost:3000` (or your frontend URL)
   - **Authorization callback URL:** 
     - `http://localhost:8787/api/auth/github/callback` (local)
     - `https://sentence-generator-worker.jaun98last.workers.dev/api/auth/github/callback` (production)
4. Register application
5. Copy **Client ID** and generate **Client Secret**

### Set Environment Variables

**Local Development (`wrangler.toml`):**
```toml
[vars]
GITHUB_CLIENT_ID = "your-github-client-id"
GITHUB_CLIENT_SECRET = "your-github-client-secret"
```

**Production (GitHub Secrets):**
Add to your GitHub repository secrets:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

Then update `.github/workflows/deploy.yml`:
```yaml
- name: Set GitHub OAuth secrets
  run: |
    echo "${{ secrets.GITHUB_CLIENT_ID }}" | npx wrangler secret put GITHUB_CLIENT_ID --env production
    echo "${{ secrets.GITHUB_CLIENT_SECRET }}" | npx wrangler secret put GITHUB_CLIENT_SECRET --env production
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

---

## 3. Frontend OAuth Callback Handler

Update `AuthContext.tsx` to handle OAuth tokens from URL:

```typescript
useEffect(() => {
  // Check for OAuth token in URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    localStorage.setItem('auth_token', token);
    // Remove token from URL
    window.history.replaceState({}, document.title, window.location.pathname);
    // Fetch user info
    checkAuth();
  }
}, []);
```

---

## 4. OAuth Flow

### Google OAuth Flow:
1. User clicks "Continue with Google"
2. Frontend redirects to `/api/auth/google`
3. Backend redirects to Google OAuth consent page
4. User authorizes app
5. Google redirects to `/api/auth/google/callback` with code
6. Backend exchanges code for access token
7. Backend fetches user info from Google
8. Backend creates/finds user in database
9. Backend generates JWT token
10. Backend redirects to frontend with token in URL
11. Frontend saves token and logs user in

### GitHub OAuth Flow:
1. User clicks "Continue with GitHub"
2. Frontend redirects to `/api/auth/github`
3. Backend redirects to GitHub OAuth authorization page
4. User authorizes app
5. GitHub redirects to `/api/auth/github/callback` with code
6. Backend exchanges code for access token
7. Backend fetches user info and email from GitHub
8. Backend creates/finds user in database
9. Backend generates JWT token
10. Backend redirects to frontend with token in URL
11. Frontend saves token and logs user in

---

## 5. Testing OAuth Locally

1. Set environment variables in `wrangler.toml`
2. Start backend: `npx wrangler dev`
3. Start frontend: `npm run dev`
4. Click "Continue with Google" or "Continue with GitHub"
5. Authorize the app
6. You should be redirected back and logged in

---

## 6. Security Considerations

- **Never commit OAuth secrets** to version control
- Use environment variables for all sensitive data
- OAuth secrets should be different for local/production
- Validate redirect URIs match exactly
- Use HTTPS in production
- Implement CSRF protection for production use

---

## 7. Troubleshooting

### "OAuth not configured" error
- Check that `GOOGLE_CLIENT_ID`/`GITHUB_CLIENT_ID` are set
- Verify environment variables are loaded correctly
- Restart backend after setting variables

### Redirect URI mismatch
- Ensure callback URLs in OAuth app match exactly
- Include protocol (http/https)
- Check for trailing slashes

### User not created
- Check database connection
- Verify Users table exists
- Check backend logs for errors

---

## Current Status

✅ Backend OAuth endpoints implemented
✅ Google OAuth flow complete
✅ GitHub OAuth flow complete
✅ JWT token generation
✅ User creation/lookup

⏳ **To enable OAuth:**
1. Create OAuth apps in Google/GitHub
2. Set environment variables
3. Test the flow

---

## Quick Start Commands

**Set secrets locally:**
```bash
cd C:\sentence-generator-worker

# Add to wrangler.toml [vars] section:
# GOOGLE_CLIENT_ID = "your-id"
# GOOGLE_CLIENT_SECRET = "your-secret"
# GITHUB_CLIENT_ID = "your-id"
# GITHUB_CLIENT_SECRET = "your-secret"

# Restart backend
npx wrangler dev
```

**Set secrets in production:**
```bash
# Via GitHub Secrets (recommended)
# Add secrets to: https://github.com/JaunLast/sentence-generator-worker/settings/secrets/actions

# Or via Wrangler CLI:
echo "your-google-client-id" | npx wrangler secret put GOOGLE_CLIENT_ID --env production
echo "your-google-client-secret" | npx wrangler secret put GOOGLE_CLIENT_SECRET --env production
echo "your-github-client-id" | npx wrangler secret put GITHUB_CLIENT_ID --env production
echo "your-github-client-secret" | npx wrangler secret put GITHUB_CLIENT_SECRET --env production
```
