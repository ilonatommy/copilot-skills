# Security Review Checklist

Detailed security checklist for code reviews.

## Input Validation

### General
- [ ] All user inputs validated before use
- [ ] Validation happens server-side (not just client)
- [ ] Input length limits enforced
- [ ] Input format validated (regex, type checks)
- [ ] Whitelist validation preferred over blacklist

### Specific Input Types
- [ ] Email addresses validated
- [ ] URLs validated (protocol, domain)
- [ ] File paths sanitized (no path traversal)
- [ ] File uploads validated (type, size, content)
- [ ] JSON/XML input parsed safely
- [ ] Numbers checked for range/overflow

## Injection Prevention

### SQL Injection
- [ ] Parameterized queries used (never string concat)
- [ ] ORM used correctly (no raw queries with user input)
- [ ] Stored procedures don't construct dynamic SQL
- [ ] Database user has minimal permissions

### Cross-Site Scripting (XSS)
- [ ] Output encoded for context (HTML, JS, URL, CSS)
- [ ] Using framework's built-in encoding
- [ ] No `innerHTML` with user data (or properly sanitized)
- [ ] Content-Security-Policy headers set
- [ ] HttpOnly flag on sensitive cookies

### Command Injection
- [ ] No shell commands with user input
- [ ] If unavoidable, strict whitelist validation
- [ ] Arguments properly escaped/quoted

### Other Injection
- [ ] LDAP queries parameterized
- [ ] XPath queries parameterized
- [ ] Template injection prevented
- [ ] Log injection prevented (sanitize before logging)

## Authentication

- [ ] Strong password requirements enforced
- [ ] Passwords hashed with modern algorithm (bcrypt, Argon2)
- [ ] Rate limiting on login attempts
- [ ] Account lockout after failed attempts
- [ ] Secure password reset flow
- [ ] MFA supported where appropriate
- [ ] Session tokens are random and sufficient length
- [ ] Session regenerated after login
- [ ] Logout properly invalidates session

## Authorization

- [ ] Every endpoint checks authorization
- [ ] Authorization checked on server-side
- [ ] Principle of least privilege followed
- [ ] Horizontal privilege escalation prevented (user A can't access user B's data)
- [ ] Vertical privilege escalation prevented (user can't become admin)
- [ ] Direct object references protected (IDOR)
- [ ] Admin functions properly restricted
- [ ] API keys have appropriate scopes

## Data Protection

### Sensitive Data Handling
- [ ] Sensitive data identified and classified
- [ ] PII minimized (only collect what's needed)
- [ ] Sensitive data encrypted at rest
- [ ] Sensitive data encrypted in transit (TLS)
- [ ] Sensitive data not in URLs
- [ ] Sensitive data not in logs
- [ ] Sensitive data not in error messages
- [ ] Sensitive data not in client-side storage

### Cryptography
- [ ] Using well-known crypto libraries (not custom)
- [ ] Strong algorithms (AES-256, RSA-2048+)
- [ ] Keys properly managed and rotated
- [ ] Random numbers from secure source
- [ ] No hardcoded keys/secrets

## API Security

- [ ] Authentication required for sensitive endpoints
- [ ] Rate limiting implemented
- [ ] Request size limits enforced
- [ ] CORS properly configured
- [ ] Sensitive data not in query parameters
- [ ] API versioning for breaking changes
- [ ] Proper HTTP methods used (GET for read, POST for write)
- [ ] HTTPS enforced

## Error Handling & Logging

- [ ] Errors don't leak sensitive information
- [ ] Stack traces not shown to users
- [ ] Generic error messages for users
- [ ] Detailed errors logged server-side
- [ ] Security events logged (login, failures, changes)
- [ ] Logs don't contain sensitive data
- [ ] Logs protected from tampering

## Dependencies

- [ ] Dependencies from trusted sources
- [ ] Dependencies scanned for vulnerabilities
- [ ] Minimal dependencies (attack surface)
- [ ] Dependencies pinned to specific versions
- [ ] Update process for security patches

## Configuration

- [ ] Debug mode disabled in production
- [ ] Default credentials changed
- [ ] Unnecessary features disabled
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] Error pages don't reveal server info
- [ ] Directory listing disabled

## Common Vulnerability Patterns

### OWASP Top 10 Quick Check
- [ ] A01: Broken Access Control - Authorization checked everywhere?
- [ ] A02: Cryptographic Failures - Sensitive data protected?
- [ ] A03: Injection - All inputs parameterized?
- [ ] A04: Insecure Design - Threat modeling done?
- [ ] A05: Security Misconfiguration - Defaults secured?
- [ ] A06: Vulnerable Components - Dependencies updated?
- [ ] A07: Auth Failures - Strong auth implemented?
- [ ] A08: Software/Data Integrity - Updates verified?
- [ ] A09: Logging Failures - Security events logged?
- [ ] A10: SSRF - Server-side requests validated?

## Questions to Ask

1. What's the worst thing an attacker could do with this feature?
2. What if a malicious user provides unexpected input?
3. What if an authenticated user tries to access other users' data?
4. What sensitive data flows through this code?
5. What happens if this service/dependency fails?
6. How could this be abused at scale?
