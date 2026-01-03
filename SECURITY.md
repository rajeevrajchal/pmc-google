# Security Implementation Guide

This document explains the security features implemented in the Pick Google Calendar plugin and how they protect your data.

## Table of Contents

1. [Overview](#overview)
2. [Security Features](#security-features)
3. [How Token Encryption Works](#how-token-encryption-works)
4. [OAuth Refresh Tokens](#oauth-refresh-tokens)
5. [Setup Instructions](#setup-instructions)
6. [Security Best Practices](#security-best-practices)
7. [Limitations and Risks](#limitations-and-risks)

## Overview

This plugin implements **two layers of security** for protecting your Google Calendar access:

### Option 1: Token Encryption (Implemented)
- All tokens are encrypted before being stored in `data.json`
- Uses AES-GCM 256-bit encryption
- Vault-specific encryption keys
- Protects against casual file reading

### Option 2: OAuth Refresh Tokens (Implemented)
- Uses authorization code flow instead of implicit flow
- Access tokens expire after 1 hour
- Refresh tokens allow automatic renewal
- Follows OAuth 2.0 best practices

## Security Features

### 1. Token Encryption

**What it protects against:**
- ✅ Casual file system browsing
- ✅ Accidental vault sharing with tokens
- ✅ Tokens being synced to cloud storage in plain text
- ✅ Simple grep/search attacks

**What it doesn't protect against:**
- ❌ Malicious Obsidian plugins (they run in the same context)
- ❌ Root/admin file system access
- ❌ Memory inspection while Obsidian is running

**Implementation:**
```typescript
// Encryption uses Web Crypto API
const encrypted = await TokenEncryption.encrypt(token, vaultId);
const decrypted = await TokenEncryption.decrypt(encrypted, vaultId);
```

### 2. OAuth Refresh Tokens

**How it works:**
1. User authenticates with Google
2. Plugin receives authorization code
3. Your backend server exchanges code for tokens
4. Plugin stores encrypted access + refresh tokens
5. Access token expires after 1 hour
6. Plugin automatically refreshes using refresh token
7. Old tokens are invalidated

**Benefits:**
- Access tokens are short-lived (1 hour vs unlimited)
- Refresh tokens can be revoked at any time
- Client secret never leaves your server
- Follows OAuth 2.0 security guidelines

## How Token Encryption Works

### Encryption Process

```
1. Generate vault-specific key
   ↓
2. Hash vault ID using SHA-256
   ↓
3. Generate random IV (Initialization Vector)
   ↓
4. Encrypt token using AES-GCM
   ↓
5. Combine IV + encrypted data
   ↓
6. Encode as Base64
   ↓
7. Store in data.json
```

### Key Generation

The encryption key is derived from:
- Vault name
- Vault adapter name
- Static salt: "obsidian-pmc-plugin-v1"

This creates a **deterministic** key that:
- ✅ Is unique per vault
- ✅ Allows decryption without storing the key
- ✅ Makes tokens non-portable between vaults

**Security Note:** The key derivation is intentionally deterministic because we need to decrypt tokens on every plugin load. This provides obfuscation rather than true cryptographic security.

### What Gets Encrypted

- Access Token
- Refresh Token (if using OAuth flow)
- Client Secret (if configured)

### What Doesn't Get Encrypted

- Client ID (public identifier)
- Token expiry dates (metadata)
- Plugin settings

## OAuth Refresh Tokens

### Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Obsidian  │         │  Your       │         │   Google    │
│   Plugin    │◄───────►│  Backend    │◄───────►│    OAuth    │
│             │         │   Server    │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
                               │
                               │ Client Secret
                               │ (Never exposed)
                               ▼
                        Environment Variables
```

### Token Flow

1. **Initial Authentication:**
   ```
   Plugin → Google: Request authorization code
   Google → User: Show consent screen
   User → Google: Approve
   Google → Plugin: Return authorization code
   Plugin → Backend: Exchange code for tokens
   Backend → Google: Exchange code + client secret
   Google → Backend: Return access + refresh tokens
   Backend → Plugin: Forward tokens
   Plugin: Store encrypted tokens
   ```

2. **Token Refresh:**
   ```
   Plugin: Check if access token expires soon
   Plugin → Backend: Request token refresh
   Backend → Google: Refresh using refresh token
   Google → Backend: Return new access token
   Backend → Plugin: Forward new token
   Plugin: Update encrypted storage
   ```

3. **API Calls:**
   ```
   Plugin: Need to call Google API
   Plugin: Check token expiry
   Plugin: Refresh if needed (automatic)
   Plugin → Google: API call with valid token
   ```

## Setup Instructions

### For Plugin Users

1. **Install the Plugin**
   - Download from Obsidian Community Plugins
   - Or manually install in `.obsidian/plugins/pmc/`

2. **Configure OAuth**
   - Go to Settings → Pick Google Calendar
   - Follow the setup guide
   - Copy Client ID and Client Secret

3. **Connect Your Account**
   - Click "Connect to Google"
   - Approve permissions
   - Plugin automatically encrypts tokens

### For Plugin Developers (Self-Hosted)

1. **Deploy Backend Server**
   ```bash
   cd server
   # Follow server/README.md for deployment
   ```

2. **Update Plugin URLs**
   ```typescript
   // src/components/tabs/google/types.ts
   export const GOOGLE_TOKEN_EXCHANGE_URL =
     "https://your-server.com/api/token/exchange";
   ```

3. **Configure Environment Variables**
   ```bash
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ALLOWED_ORIGINS=app://obsidian.md
   ```

## Security Best Practices

### For Users

1. **✅ DO:**
   - Only install trusted plugins
   - Keep Obsidian updated
   - Review plugin permissions
   - Use strong Google account password
   - Enable 2FA on Google account
   - Periodically review connected apps in Google Account settings

2. **❌ DON'T:**
   - Share your vault with unknown people
   - Install plugins from untrusted sources
   - Disable encryption (unless you have a specific reason)
   - Use the same Google account for highly sensitive work

### For Developers

1. **✅ DO:**
   - Deploy backend server to trusted hosting
   - Use environment variables for secrets
   - Enable HTTPS only
   - Implement rate limiting
   - Log security events
   - Monitor for suspicious activity
   - Keep dependencies updated

2. **❌ DON'T:**
   - Commit secrets to git
   - Expose client secret in plugin code
   - Disable CORS protection
   - Log tokens or secrets
   - Use HTTP (only HTTPS)

## Limitations and Risks

### Known Limitations

1. **Plugin Sandbox**
   - Obsidian doesn't provide plugin sandboxing
   - All plugins run in the same JavaScript context
   - Any plugin can theoretically access any other plugin's data

2. **Memory Access**
   - Tokens are decrypted in memory during use
   - A malicious plugin could inspect memory
   - No way to prevent this in JavaScript environment

3. **Encryption Key**
   - Key is derived from vault metadata
   - Not true end-to-end encryption
   - Provides obfuscation, not cryptographic security

4. **Backend Trust**
   - You must trust your backend server
   - Server has access to tokens during exchange
   - Use reputable hosting providers

### Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Malicious plugin steals tokens | High | Only install trusted plugins, review code |
| Vault shared with untrusted person | Medium | Tokens are encrypted, use separate vaults |
| Backend server compromised | High | Use secure hosting, monitor logs, rotate tokens |
| Google account compromised | Critical | Use 2FA, strong password, review connected apps |
| Access token intercepted | Low | Tokens expire in 1 hour, use HTTPS |

### What We Cannot Protect Against

**Obsidian's architecture limitations:**
- Plugins run with full access to the file system
- No permission system for plugins
- Plugins can execute arbitrary code
- Plugins can inspect other plugins' memory

**User environment:**
- Malware on user's computer
- Keyloggers or screen recorders
- Physical access to unlocked device
- Compromised operating system

## Comparison: Before vs After

### Before Security Implementation

```json
{
  "accessToken": "ya29.a0AfH6SMBxxx...", // Plain text!
  "clientId": "123-xxx.apps.googleusercontent.com"
}
```

**Risks:**
- ❌ Token visible in plain text
- ❌ Syncs to cloud unencrypted
- ❌ Never expires
- ❌ Easy to steal

### After Security Implementation

```json
{
  "accessToken": "Hy7kP9mL2nQ8vW4xZ6aB1cD3eF5gH...", // Encrypted!
  "refreshToken": "Jk9Lm7Np5Qr3St1Uv9Wx7Yz5Ab3Cd...", // Encrypted!
  "clientSecret": "Ef1Gh3Ij5Kl7Mn9Op1Qr3St5Uv7Wx...", // Encrypted!
  "accessTokenExpiresAt": 1704321600000,
  "encryptionEnabled": true
}
```

**Benefits:**
- ✅ Tokens encrypted with AES-256
- ✅ Access token expires in 1 hour
- ✅ Automatic refresh
- ✅ Client secret protected
- ✅ Much harder to steal

## Frequently Asked Questions

### Q: Is my data completely secure?
**A:** No system is 100% secure. This implementation significantly improves security but cannot protect against all threats (see Limitations section).

### Q: Can other Obsidian plugins steal my tokens?
**A:** Technically yes, but it requires malicious intent. Only install plugins from trusted sources and review their code if concerned.

### Q: What happens if I lose my refresh token?
**A:** You'll need to reconnect your Google account through the settings. Your calendar data is safe in Google.

### Q: Should I use encryption?
**A:** Yes! It's enabled by default and provides significant protection with no downside.

### Q: Do I need to set up the backend server?
**A:** If you're using a pre-configured plugin distribution, the backend may already be set up. For self-hosted deployments, yes, you'll need to set it up.

### Q: How do I revoke access?
**A:** Go to https://myaccount.google.com/permissions and remove "Pick Google Calendar" from connected apps.

### Q: What if I share my vault?
**A:** Tokens are encrypted with vault-specific keys, but it's still not recommended to share vaults containing authentication tokens.

## Additional Resources

- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [OWASP API Security](https://owasp.org/www-project-api-security/)

## Support

If you discover a security vulnerability, please email security@your-domain.com instead of opening a public issue.

## License

This security implementation is part of the Pick Google Calendar plugin and follows the same license terms.
