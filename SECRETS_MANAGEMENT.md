# Secrets Management Guide

## Overview

This document explains how secrets are managed for the Sentence Generator Worker deployed on Cloudflare Workers.

## Secrets Configuration

### JWT_SECRET

The `JWT_SECRET` is used for signing and verifying JWT tokens for user authentication.

**Environments:**
- **Local Development**: Uses the value from `wrangler.toml` (`[vars]` section)
- **Staging**: Set via Wrangler CLI (not in version control)
- **Production**: Set via Wrangler CLI (not in version control)

### Setting Secrets

Secrets for staging and production are managed using the Wrangler CLI and stored securely in Cloudflare.

#### Production

```bash
# Generate a secure random secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set the secret for production
npx wrangler secret put JWT_SECRET --env production
```

#### Staging

```bash
# Generate a different secure random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set the secret for staging
npx wrangler secret put JWT_SECRET --env staging
```

### Viewing Secrets

List configured secrets (values are not shown):

```bash
# Production
npx wrangler secret list --env production

# Staging
npx wrangler secret list --env staging
```

### Deleting Secrets

If you need to remove a secret:

```bash
# Production
npx wrangler secret delete JWT_SECRET --env production

# Staging
npx wrangler secret delete JWT_SECRET --env staging
```

## GitHub Actions Secrets

The deployment workflow requires the following GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`: API token for Cloudflare Workers deployment
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
- `SONAR_TOKEN`: Token for SonarCloud code quality analysis

These are configured in GitHub repository settings under **Settings → Secrets and variables → Actions**.

## Security Best Practices

✅ **DO:**
- Use `wrangler secret put` for sensitive values in production/staging
- Generate strong random secrets (32+ characters)
- Use different secrets for each environment
- Rotate secrets periodically
- Keep secrets out of version control

❌ **DON'T:**
- Commit secrets to `wrangler.toml` or code
- Share secrets in plain text (Slack, email, etc.)
- Use the same secret across environments
- Use weak or predictable secrets

## Troubleshooting

### Secret not found during deployment

If deployment fails with "secret not found", ensure you've set the secret:

```bash
npx wrangler secret list --env production
```

If the secret is missing, set it using `wrangler secret put`.

### Wrong secret value

To update a secret, simply run `wrangler secret put` again with the new value:

```bash
npx wrangler secret put JWT_SECRET --env production
```

This will overwrite the existing secret.

## Local Development

For local development, the `JWT_SECRET` is defined in `wrangler.toml`:

```toml
[vars]
JWT_SECRET = "dev-secret-key-change-in-production-min-32-characters-required"
```

This value is **only for local development** and is not used in staging or production.

## Deployment Configuration

The `wrangler.toml` file is configured to properly inherit database bindings for each environment:

```toml
# Production environment
[env.production]
name = "sentence-generator-worker"

[[env.production.d1_databases]]
binding = "DB"
database_name = "sentence-generator-db"
database_id = "3e8a01f2-d867-4b7b-bece-1597c96db37f"

# Staging environment
[env.staging]
name = "sentence-generator-worker-staging"

[[env.staging.d1_databases]]
binding = "DB"
database_name = "sentence-generator-db"
database_id = "3e8a01f2-d867-4b7b-bece-1597c96db37f"
```

Secrets set via `wrangler secret put` are automatically available to the worker at runtime through the `env` object.
