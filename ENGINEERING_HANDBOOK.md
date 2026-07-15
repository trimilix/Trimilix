# Trimilix Engineering Handbook

> **Living engineering standard for The Trimilix System™**
>
> This handbook defines the technical quality bar for Trimilix. Every feature, fix, and deployment must meet these standards. This is not aspirational—it is mandatory.
>
> **Designed for:** Production SaaS serving 100K–1M+ users with financial data.

---

## Table of Contents

1. [Mission & Core Principles](#mission--core-principles)
2. [Architecture & System Design](#architecture--system-design)
3. [Data Integrity & Consistency](#data-integrity--consistency)
4. [Security & Compliance](#security--compliance)
5. [API Design & Contracts](#api-design--contracts)
6. [Database Strategy](#database-strategy)
7. [Code Quality & Standards](#code-quality--standards)
8. [Testing Strategy](#testing-strategy)
9. [Performance & Scalability](#performance--scalability)
10. [Observability & Monitoring](#observability--monitoring)
11. [Deployment & Infrastructure](#deployment--infrastructure)
12. [Incident Management & Recovery](#incident-management--recovery)
13. [Team Processes & Decision Making](#team-processes--decision-making)
14. [Documentation Standards](#documentation-standards)
15. [Release Checklist](#release-checklist)

---

## Mission & Core Principles

### Mission Statement

Build a financial platform that is **secure, maintainable, scalable, and reliable**. Long-term quality and user trust always take precedence over short-term development speed. Every line of code must be defensible in a code review and auditable in production.

### Core Principles (Non-Negotiable)

| Principle | Definition | Why It Matters |
|-----------|-----------|-----------------|
| **Security First** | No feature ships without threat modeling. Secrets never hardcoded. All input validated. | Financial data requires absolute trust. One breach destroys the platform. |
| **Data Integrity** | Transactions, idempotency, and consistency checks are mandatory. | Users' financial data is sacred. Corruption is unacceptable. |
| **Observability** | Every system must be monitorable. Logs, metrics, traces, alerts are built-in. | You cannot fix what you cannot see. Production issues require visibility. |
| **Maintainability** | Code is read 10x more than written. Clear naming, minimal complexity, good tests. | Technical debt compounds. Shortcuts become anchors. |
| **Scalability by Design** | Architecture must support 10x growth without rewrite. | Early scaling decisions prevent costly rewrites. |
| **Minimize Technical Debt** | Refactor continuously. Document why, not just what. | Debt accrues interest. Pay it down before it becomes a crisis. |
| **Version Control Discipline** | Every change is tracked, reviewed, and reversible. | Auditability is non-negotiable for financial systems. |

---

## Architecture & System Design

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Users (Web/Mobile)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS/TLS 1.3+
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              API Gateway / Load Balancer                     │
│  (Rate limiting, request validation, DDoS protection)       │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   Frontend       │ │   Backend API    │ │   Workers/Jobs   │
│   (React 19)     │ │   (tRPC/Express) │ │   (Background)   │
│   + Tailwind 4   │ │   + Auth         │ │   + Webhooks     │
└──────────────────┘ └────────┬─────────┘ └────────┬─────────┘
                              │                    │
                    ┌─────────┴────────┐           │
                    ▼                  ▼           │
            ┌──────────────────┐  ┌──────────────┐│
            │   MySQL/TiDB     │  │   Redis      ││
            │   (Primary DB)   │  │   (Cache)    ││
            └──────────────────┘  └──────────────┘│
                                                  ▼
                                    ┌──────────────────────┐
                                    │  External APIs       │
                                    │  - ETF Data          │
                                    │  - Market Data       │
                                    │  - Stripe            │
                                    │  - Email Service     │
                                    └──────────────────────┘
```

### Architectural Principles

**1. Separation of Concerns**
- Frontend: UI, state management, client-side validation
- Backend: Business logic, data access, authorization
- Database: Data persistence, integrity constraints
- Infrastructure: Deployment, scaling, monitoring

**2. Modular Design**
- Each feature is a self-contained module with clear boundaries
- Modules communicate through well-defined APIs (tRPC procedures)
- No circular dependencies; use dependency injection

**3. Avoid Vendor Lock-In**
- Use open standards (OpenAPI, SQL, REST where applicable)
- Database: MySQL/TiDB (not proprietary cloud databases)
- Hosting: Cloud-agnostic (can migrate between providers)
- Authentication: OAuth2 (not platform-specific)

**4. Keep Architecture Diagrams Current**
- Update `/docs/architecture.md` with every major change
- Include data flow, service boundaries, and external integrations
- Use Mermaid or D2 for version-controlled diagrams

---

## Data Integrity & Consistency

### Transactions & ACID Compliance

**Requirement:** Every operation that modifies financial data must be atomic.

```typescript
// ✅ GOOD: Wrapped in transaction
export async function transferBetweenPortfolios(
  userId: number,
  fromPortfolioId: number,
  toPortfolioId: number,
  amount: number
) {
  const db = await getDb();
  
  return db.transaction(async (trx) => {
    // Debit source
    await trx.update(portfolios)
      .set({ totalValue: sql`totalValue - ${amount}` })
      .where(eq(portfolios.id, fromPortfolioId));
    
    // Credit destination
    await trx.update(portfolios)
      .set({ totalValue: sql`totalValue + ${amount}` })
      .where(eq(portfolios.id, toPortfolioId));
    
    // Log transaction
    await trx.insert(transactionLog).values({
      userId,
      type: 'transfer',
      fromPortfolioId,
      toPortfolioId,
      amount,
      timestamp: new Date(),
    });
  });
}
```

**Why:** If the system crashes between debit and credit, money disappears. Transactions ensure all-or-nothing semantics.

### Idempotency

**Requirement:** Operations must be safe to retry without side effects.

```typescript
// ✅ GOOD: Idempotent operation
export async function createPortfolio(
  userId: number,
  data: InsertPortfolio,
  idempotencyKey: string
) {
  const db = await getDb();
  
  // Check if already processed
  const existing = await db.select()
    .from(idempotencyLog)
    .where(eq(idempotencyLog.key, idempotencyKey))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0].result; // Return cached result
  }
  
  // Create new portfolio
  const result = await db.insert(portfolios).values({
    ...data,
    userId,
  });
  
  // Log idempotency key
  await db.insert(idempotencyLog).values({
    key: idempotencyKey,
    result: result,
    timestamp: new Date(),
  });
  
  return result;
}
```

**Why:** Network failures can cause duplicate requests. Idempotency prevents duplicate charges, duplicate portfolios, etc.

### Race Condition Prevention

**Requirement:** Concurrent operations must not corrupt data.

```typescript
// ✅ GOOD: Optimistic locking with version
export async function updatePortfolioValue(
  portfolioId: number,
  newValue: number,
  expectedVersion: number
) {
  const db = await getDb();
  
  const result = await db.update(portfolios)
    .set({
      totalValue: newValue,
      version: sql`version + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(portfolios.id, portfolioId),
        eq(portfolios.version, expectedVersion) // Optimistic lock
      )
    );
  
  if (result.rowCount === 0) {
    throw new Error('Portfolio was modified. Please retry.');
  }
  
  return result;
}
```

**Why:** Two concurrent updates can overwrite each other. Versioning ensures only one succeeds; the other retries.

### Audit Trails

**Requirement:** Every financial operation must be logged for compliance and debugging.

```typescript
// ✅ GOOD: Audit trail for every change
export async function logAuditEvent(event: {
  userId: number;
  action: string;
  resourceType: string;
  resourceId: number;
  changes: Record<string, any>;
  ipAddress: string;
  timestamp: Date;
}) {
  const db = await getDb();
  
  await db.insert(auditLog).values({
    ...event,
    hash: sha256(JSON.stringify(event)), // Tamper detection
  });
}
```

**Why:** Regulators require proof of who did what, when, and why. Audit trails are your defense in disputes.

---

## Security & Compliance

### Authentication & Authorization

**Requirement:** Use OAuth2 + JWT. Never implement custom auth.

```typescript
// ✅ GOOD: OAuth2 with JWT
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Please login' });
  }
  return next({ ctx });
});

// ✅ GOOD: Role-based access control
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
  }
  return next({ ctx });
});
```

**Why:** OAuth2 is battle-tested. Custom auth has 100% failure rate in production.

### Input Validation

**Requirement:** Validate all inputs at the API boundary using Zod.

```typescript
// ✅ GOOD: Strict input validation
export const createPortfolioInput = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  currency: z.enum(['EUR', 'USD', 'GBP']),
  initialValue: z.number().min(0).max(999999999), // Prevent overflow
});

export const createPortfolio = protectedProcedure
  .input(createPortfolioInput)
  .mutation(async ({ ctx, input }) => {
    // Input is now guaranteed to be valid
    return db.createPortfolio(ctx.user.id, input);
  });
```

**Why:** Unvalidated input is the #1 attack vector (SQL injection, XSS, etc.).

### Secrets Management

**Requirement:** Never hardcode secrets. Use environment variables with encryption at rest.

```typescript
// ✅ GOOD: Secrets from environment
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY not configured');
}

// ✅ GOOD: Rotate secrets regularly
// Document rotation procedure in /docs/secrets-rotation.md
```

**Why:** Secrets in code are committed to git history forever. Assume they're compromised.

### OWASP Top 10 Checklist

| Vulnerability | Mitigation | Status |
|---------------|-----------|--------|
| **Injection** | Parameterized queries, input validation | ✅ Implemented |
| **Broken Auth** | OAuth2, JWT, HTTPS only | ✅ Implemented |
| **Sensitive Data Exposure** | TLS 1.3+, encrypt at rest, no logging PII | ✅ Implemented |
| **XML External Entities** | Disable XML parsing | ✅ N/A (JSON only) |
| **Broken Access Control** | Role-based access, ownership checks | 🔄 In Progress |
| **Security Misconfiguration** | Security headers, CORS policy | ✅ Implemented |
| **XSS** | React escaping, CSP headers | ✅ Implemented |
| **Insecure Deserialization** | Avoid pickle/eval, use JSON | ✅ Implemented |
| **Using Components with Known Vulnerabilities** | Automated scanning (Dependabot) | ✅ Implemented |
| **Insufficient Logging & Monitoring** | Structured logging, alerts | 🔄 In Progress |

### Data Privacy (GDPR/CCPA Compliance)

**Requirement:** Users can request, download, and delete their data.

```typescript
// ✅ GOOD: GDPR data export
export const exportUserData = protectedProcedure.mutation(async ({ ctx }) => {
  const db = await getDb();
  
  const userData = await db.select()
    .from(users)
    .where(eq(users.id, ctx.user.id));
  
  const portfolios = await db.select()
    .from(portfolios)
    .where(eq(portfolios.userId, ctx.user.id));
  
  return {
    user: userData[0],
    portfolios,
    exportedAt: new Date(),
  };
});

// ✅ GOOD: Right to be forgotten
export const deleteUserData = adminProcedure
  .input(z.object({ userId: z.number() }))
  .mutation(async ({ input }) => {
    const db = await getDb();
    
    // Soft delete: mark as deleted, don't remove (for audit trail)
    await db.update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, input.userId));
    
    // Anonymize PII
    await db.update(users)
      .set({
        email: null,
        name: `Deleted User ${input.userId}`,
      })
      .where(eq(users.id, input.userId));
  });
```

**Why:** GDPR fines are 4% of annual revenue. Compliance is not optional.

---

## API Design & Contracts

### tRPC Procedure Naming Convention

```typescript
// ✅ GOOD: Clear, RESTful naming
router({
  portfolio: router({
    list: protectedProcedure.query(...),      // GET /portfolio
    get: protectedProcedure.input(z.object({ id: z.number() })).query(...),  // GET /portfolio/:id
    create: protectedProcedure.input(...).mutation(...),  // POST /portfolio
    update: protectedProcedure.input(...).mutation(...),  // PUT /portfolio/:id
    delete: protectedProcedure.input(...).mutation(...),  // DELETE /portfolio/:id
  }),
});
```

### Error Handling

**Requirement:** Consistent error responses with proper HTTP status codes.

```typescript
// ✅ GOOD: Typed error responses
export class ValidationError extends TRPCError {
  constructor(message: string, public details: Record<string, string>) {
    super({ code: 'BAD_REQUEST', message });
  }
}

export class NotFoundError extends TRPCError {
  constructor(resource: string, id: any) {
    super({ code: 'NOT_FOUND', message: `${resource} not found: ${id}` });
  }
}

// Usage
if (!portfolio) {
  throw new NotFoundError('Portfolio', portfolioId);
}
```

### Rate Limiting

**Requirement:** Protect API from abuse and DDoS.

```typescript
// ✅ GOOD: Rate limiting middleware
const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id || req.ip;
  const key = `rate-limit:${userId}`;
  
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60); // 1-minute window
  }
  
  if (count > 100) { // 100 requests per minute
    res.status(429).json({ error: 'Too many requests' });
    return;
  }
  
  next();
};
```

### API Versioning

**Requirement:** Support multiple API versions for backward compatibility.

```typescript
// ✅ GOOD: Version in URL
// /api/v1/portfolio/list
// /api/v2/portfolio/list (with new fields)

// Deprecation timeline:
// v1: Deprecated 2026-01-01, sunset 2026-06-01
// v2: Current
```

---

## Database Strategy

### Schema Design Principles

**1. Normalization**
- Eliminate data duplication
- Use foreign keys for relationships
- Avoid storing derived data (calculate on query)

**2. Indexing Strategy**
```sql
-- ✅ GOOD: Index on frequently queried columns
CREATE INDEX idx_portfolios_userId ON portfolios(userId);
CREATE INDEX idx_holdings_portfolioId ON holdings(portfolioId);
CREATE INDEX idx_transactions_userId_createdAt ON transactions(userId, createdAt);

-- ❌ BAD: Over-indexing slows writes
-- Only index columns used in WHERE, JOIN, ORDER BY
```

**3. Migrations**
```typescript
// ✅ GOOD: Version-controlled migrations
// drizzle/0001_add_portfolios.sql
CREATE TABLE portfolios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

// Run: pnpm db:push
```

### Backup & Recovery

**Requirement:** Automated daily backups with tested recovery procedures.

```yaml
# ✅ GOOD: Backup strategy
Frequency: Daily at 02:00 UTC
Retention: 30 days
Location: S3 (separate AWS account)
Testing: Monthly recovery drill
RTO: 1 hour (Recovery Time Objective)
RPO: 1 hour (Recovery Point Objective)
```

### Query Optimization

**Requirement:** All queries must execute in <100ms for 99th percentile.

```typescript
// ❌ BAD: N+1 query problem
const portfolios = await db.select().from(portfolios).where(...);
for (const portfolio of portfolios) {
  const holdings = await db.select().from(holdings).where(...); // Repeated query!
}

// ✅ GOOD: Join in single query
const portfoliosWithHoldings = await db.select()
  .from(portfolios)
  .leftJoin(holdings, eq(holdings.portfolioId, portfolios.id))
  .where(...);
```

---

## Code Quality & Standards

### Clean Code Principles

| Principle | Rule | Example |
|-----------|------|---------|
| **Naming** | Use clear, searchable names | `calculateCompoundReturn` not `calc()` |
| **Functions** | Single responsibility, <20 lines | One function = one reason to change |
| **Comments** | Explain WHY, not WHAT | `// Retry on network timeout` not `// retry()` |
| **DRY** | Don't repeat yourself | Extract common logic to shared functions |
| **Error Handling** | Explicit, not silent | Throw or log, never silently fail |

### TypeScript Strictness

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Code Review Checklist

Every PR must pass:

- [ ] **Functionality:** Does it solve the problem?
- [ ] **Tests:** Are there unit + integration tests?
- [ ] **Security:** No secrets hardcoded? Input validated?
- [ ] **Performance:** Any N+1 queries? Unnecessary re-renders?
- [ ] **Maintainability:** Clear naming? Documented edge cases?
- [ ] **Documentation:** Updated README/API docs?
- [ ] **Backward Compatibility:** Breaking changes documented?

---

## Testing Strategy

### Testing Pyramid

```
        /\
       /  \  E2E Tests (10%)
      /────\
     /      \
    /────────\  Integration Tests (30%)
   /          \
  /────────────\  Unit Tests (60%)
 /              \
```

### Unit Testing

**Requirement:** Every business logic function has unit tests.

```typescript
// src/server/compounding.test.ts
import { describe, it, expect } from 'vitest';
import { calculateCompoundReturn } from './compounding';

describe('calculateCompoundReturn', () => {
  it('should calculate correct return with monthly contributions', () => {
    const result = calculateCompoundReturn({
      initialAmount: 10000,
      monthlyContribution: 500,
      annualReturn: 0.07,
      years: 10,
    });
    
    expect(result).toBeCloseTo(107500, -2); // Within $100
  });
  
  it('should handle zero contributions', () => {
    const result = calculateCompoundReturn({
      initialAmount: 10000,
      monthlyContribution: 0,
      annualReturn: 0.07,
      years: 10,
    });
    
    expect(result).toBeGreaterThan(10000);
  });
  
  it('should throw on negative inputs', () => {
    expect(() => calculateCompoundReturn({
      initialAmount: -1000,
      monthlyContribution: 500,
      annualReturn: 0.07,
      years: 10,
    })).toThrow();
  });
});
```

### Integration Testing

**Requirement:** Test database interactions and API contracts.

```typescript
// src/server/portfolio.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createPortfolio, getPortfolioWithHoldings } from './db';

describe('Portfolio Integration', () => {
  let userId: number;
  
  beforeEach(async () => {
    // Setup: Create test user
    userId = await createTestUser();
  });
  
  afterEach(async () => {
    // Teardown: Clean up
    await cleanupTestData();
  });
  
  it('should create portfolio and retrieve with holdings', async () => {
    const portfolio = await createPortfolio(userId, {
      name: 'Test Portfolio',
      currency: 'EUR',
    });
    
    const retrieved = await getPortfolioWithHoldings(portfolio.id);
    
    expect(retrieved).toBeDefined();
    expect(retrieved.name).toBe('Test Portfolio');
    expect(retrieved.holdings).toEqual([]);
  });
});
```

### E2E Testing (Future)

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can sign up and view dashboard', async ({ page }) => {
  await page.goto('https://trimilix.local');
  await page.click('button:has-text("Sign up")');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'SecurePassword123!');
  await page.click('button:has-text("Create account")');
  
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.locator('h1')).toContainText('Welcome');
});
```

---

## Performance & Scalability

### Frontend Performance Targets

| Metric | Target | Tool |
|--------|--------|------|
| **LCP** (Largest Contentful Paint) | <2.5s | Lighthouse |
| **FID** (First Input Delay) | <100ms | Web Vitals |
| **CLS** (Cumulative Layout Shift) | <0.1 | Web Vitals |
| **Bundle Size** | <150KB (gzipped) | webpack-bundle-analyzer |

### Backend Performance Targets

| Metric | Target | Tool |
|--------|--------|------|
| **API Response Time** | <100ms (p99) | Datadog/New Relic |
| **Database Query** | <50ms (p99) | Slow query log |
| **Throughput** | >1000 req/s | Load testing |

### Caching Strategy

```typescript
// ✅ GOOD: Cache frequently accessed data
const getCachedETFData = async (ticker: string) => {
  const cacheKey = `etf:${ticker}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Fetch from external API
  const data = await fetchETFData(ticker);
  
  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(data));
  
  return data;
};
```

### Database Connection Pooling

```typescript
// ✅ GOOD: Reuse connections
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
```

---

## Observability & Monitoring

### Structured Logging

**Requirement:** All logs must be structured JSON for easy parsing.

```typescript
// ✅ GOOD: Structured logging
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

logger.info('Portfolio created', {
  userId: 123,
  portfolioId: 456,
  currency: 'EUR',
  timestamp: new Date().toISOString(),
});

// Output:
// {"level":"info","message":"Portfolio created","userId":123,"portfolioId":456,"currency":"EUR","timestamp":"2026-01-15T10:30:00.000Z"}
```

### Metrics & Alerting

```typescript
// ✅ GOOD: Application metrics
import { Counter, Histogram } from 'prom-client';

const portfolioCreatedCounter = new Counter({
  name: 'portfolio_created_total',
  help: 'Total portfolios created',
  labelNames: ['currency'],
});

const apiResponseTime = new Histogram({
  name: 'api_response_time_seconds',
  help: 'API response time',
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
});

// Alert rules (Prometheus)
// alert: HighErrorRate
// expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
// for: 5m
```

### Distributed Tracing

```typescript
// ✅ GOOD: Trace requests across services
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('trimilix-api');

export const createPortfolioWithTracing = async (userId: number, data: any) => {
  const span = tracer.startSpan('createPortfolio');
  
  try {
    span.setAttributes({
      userId,
      portfolioName: data.name,
    });
    
    const result = await createPortfolio(userId, data);
    span.addEvent('portfolio_created', { portfolioId: result.id });
    
    return result;
  } catch (error) {
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
};
```

### Dashboards & Alerts

**Requirement:** Real-time visibility into system health.

```yaml
# ✅ GOOD: Key dashboards
Dashboards:
  - System Health: CPU, Memory, Disk, Network
  - Application: Request rate, Error rate, Response time
  - Database: Query time, Connection pool, Replication lag
  - Business: Active users, Portfolios created, Revenue

Alerts:
  - Error rate > 1%: Page on-call
  - Response time p99 > 500ms: Investigate
  - Database replication lag > 10s: Alert
  - Low disk space < 10%: Warn
```

---

## Deployment & Infrastructure

### Infrastructure as Code

**Requirement:** All infrastructure defined in code, version-controlled.

```hcl
# terraform/main.tf
resource "aws_rds_instance" "primary" {
  identifier     = "trimilix-db-primary"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.r6i.xlarge"
  allocated_storage = 100
  
  backup_retention_period = 30
  backup_window           = "02:00-03:00"
  
  multi_az = true
  storage_encrypted = true
  
  tags = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
```

### Deployment Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm test
      - run: pnpm lint
      - run: pnpm type-check

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit
      - run: snyk test

  deploy:
    needs: [test, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm build
      - run: ./scripts/deploy.sh
```

### Feature Flags & Gradual Rollouts

**Requirement:** Deploy features gradually to detect issues early.

```typescript
// ✅ GOOD: Feature flag system
export const isFeatureEnabled = async (
  featureName: string,
  userId?: number
): Promise<boolean> => {
  const flag = await redis.get(`feature:${featureName}`);
  
  if (!flag) return false;
  
  const config = JSON.parse(flag);
  
  // Percentage-based rollout
  if (config.rolloutPercentage < 100) {
    const hash = hashFunction(`${userId}:${featureName}`);
    if (hash % 100 > config.rolloutPercentage) {
      return false;
    }
  }
  
  return true;
};

// Usage
if (await isFeatureEnabled('new-portfolio-ui', userId)) {
  return renderNewUI();
} else {
  return renderLegacyUI();
}
```

### Rollback Procedures

**Requirement:** Every deployment must be instantly reversible.

```bash
#!/bin/bash
# scripts/rollback.sh

# Get previous stable version
PREVIOUS_VERSION=$(git describe --tags --abbrev=0 HEAD~1)

# Rollback database (if migrations were applied)
pnpm db:rollback --to $PREVIOUS_VERSION

# Rollback application
docker pull trimilix:$PREVIOUS_VERSION
docker stop trimilix-api
docker run -d --name trimilix-api trimilix:$PREVIOUS_VERSION

# Verify health
sleep 5
curl http://localhost:3000/health || rollback_failed
```

---

## Incident Management & Recovery

### Incident Response Plan

**Severity Levels:**

| Level | Definition | Response Time | Example |
|-------|-----------|----------------|---------|
| **P1** | Complete outage, data loss | 15 minutes | Database down |
| **P2** | Major feature broken | 1 hour | Login broken |
| **P3** | Minor feature broken | 4 hours | Simulator slow |
| **P4** | Cosmetic issue | 24 hours | Button misaligned |

### Incident Runbook Template

```markdown
# Incident: Database Replication Lag

## Symptoms
- Writes succeed but reads show stale data
- Replication lag > 30 seconds

## Diagnosis
1. SSH into replica: `ssh db-replica.prod`
2. Check lag: `SHOW SLAVE STATUS\G`
3. Check binary log: `SHOW MASTER STATUS;`

## Resolution
1. Stop replica: `STOP SLAVE;`
2. Skip bad transaction: `SET GLOBAL SQL_SLAVE_SKIP_COUNTER = 1;`
3. Resume: `START SLAVE;`
4. Monitor: `SHOW SLAVE STATUS\G`

## Prevention
- Enable semi-synchronous replication
- Monitor lag continuously
- Test failover monthly
```

### Post-Incident Review (Blameless)

**Requirement:** Every P1/P2 incident gets a postmortem within 24 hours.

```markdown
# Postmortem: Database Outage 2026-01-15

## Timeline
- 14:32 UTC: Alert triggered (replication lag > 60s)
- 14:35 UTC: On-call engineer paged
- 14:42 UTC: Root cause identified (disk full on replica)
- 14:55 UTC: Disk cleaned, replication resumed
- 15:00 UTC: All systems nominal

## Root Cause
Disk monitoring alert was not configured on replica. Logs filled disk, causing replication to stall.

## Action Items
- [ ] Add disk monitoring to all database servers (Owner: DevOps, Due: 2026-01-20)
- [ ] Implement log rotation policy (Owner: DBA, Due: 2026-01-18)
- [ ] Test failover procedure (Owner: DevOps, Due: 2026-01-25)

## What Went Well
- Alert system caught the issue
- Runbook was clear and easy to follow
- Team responded quickly

## What We'll Improve
- Proactive disk monitoring
- Better alerting thresholds
- More frequent failover drills
```

---

## Team Processes & Decision Making

### Technical Decision Records (TDRs)

**Requirement:** Every major architecture decision is documented.

```markdown
# TDR-001: Use MySQL Instead of PostgreSQL

## Context
We need a relational database for Trimilix. Options: MySQL, PostgreSQL, TiDB.

## Decision
Use MySQL 8.0 with TiDB for sharding later.

## Rationale
- MySQL: Simpler operations, better cloud support, lower cost
- TiDB: Compatible with MySQL, horizontal scaling built-in
- PostgreSQL: Overkill for our needs, higher operational complexity

## Consequences
- Positive: Easier to scale, familiar to team
- Negative: Some PostgreSQL features unavailable (JSON operators, etc.)

## Status: Accepted
## Date: 2026-01-15
## Author: Engineering Lead
```

### Code Review Standards

**Requirement:** All code changes require at least 2 approvals before merge.

```markdown
# Code Review Checklist

## Functionality
- [ ] Does the code solve the stated problem?
- [ ] Are edge cases handled?
- [ ] Is error handling appropriate?

## Testing
- [ ] Are there unit tests?
- [ ] Are there integration tests?
- [ ] Is test coverage > 80%?

## Security
- [ ] No secrets hardcoded?
- [ ] All inputs validated?
- [ ] No SQL injection risks?
- [ ] No XSS risks?

## Performance
- [ ] Any N+1 queries?
- [ ] Any unnecessary re-renders?
- [ ] Bundle size impact acceptable?

## Maintainability
- [ ] Clear variable/function names?
- [ ] Comments explain WHY, not WHAT?
- [ ] Code follows project conventions?
- [ ] Documentation updated?

## Backward Compatibility
- [ ] Any breaking changes documented?
- [ ] Database migrations tested?
- [ ] API versioning considered?
```

### Architectural Review Board

**Requirement:** Major changes (>1000 LOC, new services, data model changes) require ARB approval.

```markdown
# ARB Meeting Agenda

1. **Proposed Change**: Brief description
2. **Rationale**: Why is this needed?
3. **Alternatives Considered**: What else could we do?
4. **Impact Analysis**:
   - Performance impact?
   - Security implications?
   - Scalability concerns?
   - Operational complexity?
5. **Implementation Plan**: How and when?
6. **Rollback Plan**: How do we undo this?
7. **Decision**: Approved / Approved with conditions / Rejected
```

---

## Documentation Standards

### Required Documentation

| Document | Location | Owner | Update Frequency |
|----------|----------|-------|------------------|
| **Architecture Diagram** | `/docs/architecture.md` | Engineering Lead | Per major change |
| **API Documentation** | `/docs/api.md` | Backend Team | Per API change |
| **Database Schema** | `/docs/database.md` | DBA | Per schema change |
| **Deployment Guide** | `/docs/deployment.md` | DevOps | Per deployment change |
| **Runbooks** | `/docs/runbooks/` | On-call Engineer | Per incident |
| **Security Policy** | `/docs/security.md` | Security Lead | Annually |
| **Disaster Recovery** | `/docs/disaster-recovery.md` | DevOps | Annually |

### README Template

```markdown
# Trimilix Backend

## Quick Start
1. Clone repo
2. `pnpm install`
3. `cp .env.example .env`
4. `pnpm dev`

## Architecture
[Link to architecture diagram]

## API Documentation
[Link to API docs]

## Testing
- `pnpm test` — Run all tests
- `pnpm test:watch` — Watch mode
- `pnpm test:coverage` — Coverage report

## Deployment
[Link to deployment guide]

## Support
- Issues: GitHub Issues
- Questions: #engineering Slack channel
```

---

## Release Checklist

### Pre-Release (48 hours before)

- [ ] All tests passing (unit, integration, E2E)
- [ ] Code coverage > 80%
- [ ] No high/critical security findings
- [ ] Performance benchmarks meet targets
- [ ] Database migrations tested on staging
- [ ] Rollback procedure documented and tested
- [ ] Monitoring and alerts configured
- [ ] On-call engineer briefed
- [ ] Release notes prepared

### Release Day

- [ ] Feature flags configured (gradual rollout)
- [ ] Deployment pipeline triggered
- [ ] Health checks passing
- [ ] Error rate < 0.1%
- [ ] Response time p99 < 200ms
- [ ] Database replication lag < 5s
- [ ] Team standing by for 1 hour

### Post-Release (24 hours after)

- [ ] Monitor error rates and performance
- [ ] Check user feedback (support, social)
- [ ] Review logs for anomalies
- [ ] Document any issues found
- [ ] Celebrate with the team! 🎉

---

## Continuous Improvement

### Quarterly Engineering Review

Every quarter, the team reviews:

1. **What worked well?** Celebrate wins.
2. **What didn't work?** Learn from failures.
3. **What should we improve?** Update this handbook.
4. **Metrics**: Test coverage, incident count, deployment frequency, lead time.

### Handbook Updates

When you identify a better practice:

1. **Propose**: Create a PR with your change and motivation
2. **Discuss**: Get feedback from the team
3. **Approve**: Merge with consensus
4. **Implement**: Update projects to follow new standard
5. **Document**: Add to this handbook

---

## Appendix: Tools & Services

### Development Tools

- **IDE**: VS Code with ESLint, Prettier, TypeScript
- **Version Control**: Git + GitHub
- **Package Manager**: pnpm
- **Runtime**: Node.js 22+
- **Database**: MySQL 8.0 / TiDB

### Testing Tools

- **Unit Testing**: Vitest
- **Integration Testing**: Vitest + test database
- **E2E Testing**: Playwright (future)
- **Performance**: Lighthouse, k6

### Monitoring & Observability

- **Logs**: Winston (structured JSON)
- **Metrics**: Prometheus
- **Tracing**: OpenTelemetry
- **Dashboards**: Grafana
- **Alerting**: Prometheus AlertManager

### Infrastructure

- **Hosting**: Manus (cloud-agnostic)
- **Database**: Managed MySQL / TiDB
- **Cache**: Redis
- **CDN**: Cloudflare
- **DNS**: Route53

### External Services

- **Authentication**: Manus OAuth2
- **Payments**: Stripe
- **Email**: SendGrid
- **Market Data**: [TBD]
- **Monitoring**: Datadog / New Relic

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-15 | Engineering Team | Initial handbook |
| 1.1 | TBD | TBD | TBD |

---

**Last Updated:** 2026-01-15  
**Next Review:** 2026-04-15 (Quarterly)  
**Status:** Active & Living Document

This handbook is the source of truth for engineering excellence at Trimilix. Every decision, every line of code, every deployment must align with these principles.

**Questions?** Ask in #engineering Slack or create an issue.
