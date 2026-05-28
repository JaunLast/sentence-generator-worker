# Setting Up Secrets

## Local Development
Secrets are stored in `.dev.vars` (gitignored). Copy `.dev.vars.example` to `.dev.vars` and fill in your values.

## Production
Set secrets using Cloudflare CLI:

```bash
# Set JWT Secret
npx wrangler secret put JWT_SECRET

# Set Google OAuth credentials
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET

# Set GitHub OAuth credentials
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
```

When prompted, paste the secret value.

## Important Notes
- **NEVER** commit `.dev.vars` to git
- **NEVER** hardcode secrets in `wrangler.toml`
- Production secrets are managed through Cloudflare dashboard or CLI
- Each environment (production, staging) has its own secrets
