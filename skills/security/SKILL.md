---
name: Security
description: Identifies security vulnerabilities and enforces secure coding practices.
---

# Security Best Practices Skill

Comprehensive security guidance for modern applications.

## Security Principles

### Defense in Depth
- Multiple layers of security
- No single point of failure
- Assume breach mentality
- Least privilege access
- Zero trust architecture

### CIA Triad
- **Confidentiality**: Protect sensitive data
- **Integrity**: Prevent unauthorized changes
- **Availability**: Ensure system uptime

## Common Vulnerabilities

### OWASP Top 10
1. **Injection**: SQL, NoSQL, Command injection
2. **Broken Authentication**: Weak session management
3. **Sensitive Data Exposure**: Unencrypted data
4. **XML External Entities**: XXE attacks
5. **Broken Access Control**: Privilege escalation
6. **Security Misconfiguration**: Default settings
7. **Cross-Site Scripting**: XSS attacks
8. **Insecure Deserialization**: Remote code execution
9. **Using Components with Vulnerabilities**: Outdated deps
10. **Insufficient Logging**: Blind to attacks

## Secure Coding Practices

### Input Validation
- Validate all inputs
- Whitelist acceptable values
- Sanitize user data
- Parameterized queries
- Escape output

### Authentication & Authorization
- **Authentication**
  - Strong password policies
  - Multi-factor authentication
  - Secure password storage (bcrypt)
  - Session management
  - JWT best practices

- **Authorization**
  - Role-based access control
  - Attribute-based access control
  - API key management
  - OAuth 2.0 implementation

### Data Protection
- **Encryption**
  - TLS for transit
  - AES for rest
  - Key management
  - Certificate pinning

- **Sensitive Data**
  - PII identification
  - Data masking
  - Secure deletion
  - Audit logging

## Security Testing

### Static Analysis (SAST)
- Code vulnerability scanning
- Dependency checking
- Secret detection
- License compliance

### Dynamic Analysis (DAST)
- Penetration testing
- Vulnerability scanning
- Fuzzing
- Security headers check

### Security Automation
```yaml
# GitHub Actions Security Workflow
name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run security scan
        uses: snyk/actions/node@master
      - name: Check secrets
        uses: trufflesecurity/trufflehog@main
```

## Infrastructure Security

### Container Security
- Minimal base images
- Non-root users
- Read-only filesystems
- Security scanning
- Runtime protection

### Cloud Security
- IAM policies
- Network segmentation
- Encryption at rest
- Audit logging
- Compliance monitoring

## Incident Response

### Preparation
- Incident response plan
- Security monitoring
- Log aggregation
- Alert configuration

### Response Steps
1. **Detect**: Identify the incident
2. **Contain**: Limit the damage
3. **Investigate**: Find root cause
4. **Remediate**: Fix the issue
5. **Recover**: Restore services
6. **Learn**: Post-mortem analysis

## Security Checklist

- [ ] All inputs validated
- [ ] Authentication implemented
- [ ] Authorization enforced
- [ ] Data encrypted
- [ ] Secrets managed properly
- [ ] Dependencies updated
- [ ] Security headers configured
- [ ] Logging implemented
- [ ] Rate limiting enabled
- [ ] CORS configured

Security is everyone's responsibility.