# Security Guidelines for Balance App

## Environment Variables

### Required Configuration
The Balance app requires the following environment variables to be set:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

### Setup Instructions

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Add your credentials to `.env`:**
   - Get your Supabase URL and anon key from your [Supabase Dashboard](https://app.supabase.com)
   - Never commit `.env` to version control (already in `.gitignore`)

3. **For production deployments:**
   - Set environment variables in your hosting platform (Netlify, Vercel, etc.)
   - Never expose sensitive keys in client-side code

## Security Best Practices

### ✅ What We Do

- **Supabase Row Level Security (RLS)**: All database tables enforce user-level access control
- **Session Management**: Secure authentication with Supabase Auth
- **Input Validation**: All user inputs validated before processing
- **Error Handling**: Comprehensive error handling prevents data leaks
- **Environment Variables**: Sensitive credentials stored in `.env` (not in code)

### 🔒 Important Security Notes

1. **Supabase Anon Key**: While this key is "public" and safe to expose in client-side code, it should still be managed through environment variables for flexibility and best practices.

2. **Row Level Security (RLS)**: The anon key only works because Supabase RLS policies enforce data isolation. Always verify RLS policies are active on all tables.

3. **API Keys**: Partner API keys should be managed server-side in production. The current implementation is for testing only.

4. **HTTPS Only**: Always use HTTPS in production to encrypt data in transit.

## Supabase Security Checklist

- [ ] Enable RLS on all tables
- [ ] Verify RLS policies restrict access to user's own data only
- [ ] Enable email verification for new accounts
- [ ] Set up password strength requirements
- [ ] Enable 2FA on Supabase dashboard account
- [ ] Review and audit database policies regularly
- [ ] Monitor authentication logs for suspicious activity
- [ ] Set up rate limiting to prevent abuse

## Data Protection

### User Data
- All user data is isolated by `user_id` in database queries
- Passwords are hashed by Supabase Auth (never stored in plain text)
- Session tokens are managed securely by Supabase

### Financial Data
- Transaction data is linked to user accounts via RLS
- Budget information is private to each user
- Loyalty points are tracked with audit trails

## Reporting Security Issues

If you discover a security vulnerability, please email: security@balanceapp.co.za

**Do not** open public issues for security vulnerabilities.

## Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Security Guidelines](https://developer.mozilla.org/en-US/docs/Web/Security)
