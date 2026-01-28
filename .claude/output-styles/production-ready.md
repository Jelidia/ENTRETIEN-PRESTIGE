---
name: production-ready
description: Zero-tolerance production-ready output style. Enforces strict quality standards, no shortcuts, no mock data.
keep-coding-instructions: true
---

# Production-Ready Output Style

## Core Principles

### Zero Tolerance
- NO mock data
- NO placeholder functions
- NO TODO comments without implementation
- NO console.log in production code
- NO hardcoded credentials
- NO skipped tests
- NO disabled linting rules without justification

### Everything Works
- All features must be fully functional
- All tests must pass
- All types must be correct
- All errors must be handled
- All edge cases must be covered

## Code Quality Requirements

### TypeScript Strict Mode
```typescript
// ✅ Correct - proper typing
interface User {
  user_id: string;
  email: string;
  role: 'admin' | 'manager' | 'sales_rep' | 'technician';
}

const getUser = async (id: string): Promise<User | null> => {
  // Implementation
}

// ❌ Wrong - any types
const getUser = async (id: any): Promise<any> => {
  // Implementation
}
```

### Error Handling
```typescript
// ✅ Correct - comprehensive error handling
export async function POST(request: Request) {
  try {
    const auth = await requireUser(request);
    if ("response" in auth) return auth.response;

    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }

    const { data, error } = await client.from('table').insert(result.data);

    if (error) {
      console.error("DB error:", error);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ❌ Wrong - no error handling
export async function POST(request: Request) {
  const body = await request.json();
  const data = await client.from('table').insert(body);
  return NextResponse.json(data);
}
```

### Validation
ALL external data MUST be validated with Zod:

```typescript
// ✅ Correct
import { jobCreateSchema } from "@/lib/validators";

const result = jobCreateSchema.safeParse(body);
if (!result.success) {
  return NextResponse.json({ error: "Invalid input" }, { status: 400 });
}

// ❌ Wrong - no validation
const { customerId, serviceType } = body; // Trusting external data
```

### Security

#### Authentication Required
```typescript
// ✅ Correct
export async function GET(request: Request) {
  const auth = await requireRole(request, ["admin", "manager"]);
  if ("response" in auth) return auth.response;
  // Implementation
}

// ❌ Wrong - no auth
export async function GET(request: Request) {
  const data = await getAdminData();
  return NextResponse.json(data);
}
```

#### RLS Filtering
```typescript
// ✅ Correct - company_id filter
const { data } = await client
  .from("jobs")
  .select("*")
  .eq("company_id", profile.company_id)
  .eq("status", "pending");

// ❌ Wrong - no company_id filter
const { data } = await client
  .from("jobs")
  .select("*")
  .eq("status", "pending"); // Leaks data across companies!
```

#### No Secrets in Code
```typescript
// ❌ NEVER do this
const apiKey = "sk_live_123456789";

// ✅ Always use environment variables
const apiKey = process.env.STRIPE_SECRET_KEY;
if (!apiKey) {
  throw new Error("STRIPE_SECRET_KEY not configured");
}
```

## Testing Requirements

### 100% Coverage Required
```bash
# This MUST pass
npm test

# Coverage report MUST show 100% on:
# - Statements
# - Branches
# - Functions
# - Lines
```

### Test Quality
```typescript
// ✅ Correct - comprehensive tests
describe("POST /api/jobs", () => {
  it("creates job successfully", async () => {
    // Success case
  });

  it("returns 400 for invalid input", async () => {
    // Validation error
  });

  it("returns 401 for unauthenticated user", async () => {
    // Auth error
  });

  it("returns 403 for wrong role", async () => {
    // Permission error
  });

  it("filters by company_id", async () => {
    // Multi-tenancy test
  });

  it("handles database errors", async () => {
    // Error handling
  });
});

// ❌ Wrong - only happy path
describe("POST /api/jobs", () => {
  it("creates job", async () => {
    // Only success case tested
  });
});
```

## Database Requirements

### Migrations Only
```sql
-- ✅ Correct - proper migration
-- Migration: 20260128_add_feature.sql

-- Add column
ALTER TABLE jobs ADD COLUMN new_field TEXT;

-- Create index
CREATE INDEX idx_jobs_new_field ON jobs(new_field);

-- Add RLS policy
CREATE POLICY "Users see own company jobs" ON jobs
  FOR SELECT USING (
    company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
  );

-- Rollback instructions
-- DROP POLICY "Users see own company jobs" ON jobs;
-- DROP INDEX idx_jobs_new_field;
-- ALTER TABLE jobs DROP COLUMN new_field;
```

### RLS Always Enabled
```sql
-- ✅ Correct
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_name" ON new_table
  FOR ALL USING (
    company_id = (SELECT company_id FROM users WHERE user_id = auth.uid())
  );

-- ❌ Wrong - RLS not enabled
CREATE TABLE new_table (...); -- Missing RLS!
```

## Performance Requirements

### Query Optimization
```typescript
// ✅ Correct - select specific columns
const { data } = await client
  .from("jobs")
  .select("job_id, customer_id, status, scheduled_date")
  .eq("company_id", profile.company_id)
  .order("scheduled_date", { ascending: true })
  .limit(10);

// ❌ Wrong - select all columns
const { data } = await client
  .from("jobs")
  .select("*"); // Wasteful, no limit, no company filter!
```

### Indexes
```sql
-- ✅ Correct - index frequently queried columns
CREATE INDEX idx_jobs_company_status ON jobs(company_id, status);
CREATE INDEX idx_jobs_scheduled_date ON jobs(scheduled_date);
CREATE INDEX idx_customers_email ON customers(email);
```

## UI Requirements

### Mobile-First ALWAYS
```tsx
// ✅ Correct
<div className="w-full max-w-[640px] mx-auto p-4">
  {/* Content */}
</div>

// ❌ Wrong - no max-width
<div className="w-full p-4">
  {/* Content stretches on desktop */}
</div>
```

### French Labels
```tsx
// ✅ Correct
<button>Enregistrer</button>
<label>Nom du client</label>

// ❌ Wrong
<button>Save</button>
<label>Customer Name</label>
```

### Accessibility
```tsx
// ✅ Correct
<button
  aria-label="Fermer le dialogue"
  onClick={handleClose}
>
  <XIcon />
</button>

// ❌ Wrong - no aria-label
<button onClick={handleClose}>
  <XIcon />
</button>
```

## Documentation Requirements

### Code Comments
```typescript
// ✅ Correct - explain WHY, not WHAT
// Calculate price with evening surcharge (after 5pm)
// Quebec business rule: 20% premium for after-hours service
const price = basePrice * (isEvening ? 1.2 : 1.0);

// ❌ Wrong - obvious comment
// Multiply basePrice by 1.2
const price = basePrice * 1.2;
```

### API Documentation
Every API route needs:
- Purpose
- Auth requirements
- Input schema
- Output format
- Error codes

## Checklist Before Commit

- ✅ All tests pass (100% coverage)
- ✅ Build succeeds (npm run build)
- ✅ Lint passes (npm run lint)
- ✅ No console.log statements
- ✅ No TODO comments
- ✅ No mock data
- ✅ No hardcoded secrets
- ✅ All queries have company_id filter
- ✅ All routes have auth checks
- ✅ All inputs validated with Zod
- ✅ All errors handled gracefully
- ✅ French labels on all UI
- ✅ 640px max-width enforced
- ✅ TypeScript strict mode (no any)
- ✅ RLS policies on all tables
- ✅ Migrations documented
- ✅ Documentation updated

## Forbidden Patterns

### Never Use
```typescript
// ❌ Mock data
const MOCK_DATA = [{ id: 1, name: "Test" }];

// ❌ TODO without implementation
// TODO: Implement this later

// ❌ Disabled linting
// eslint-disable-next-line

// ❌ Any types
const getData = (): any => {};

// ❌ Console.log
console.log("Debug info");

// ❌ Empty catch
try {
  // code
} catch (e) {
  // Silently fail
}

// ❌ Non-null assertion without check
const user = data!.user!.email!;

// ❌ Skipped tests
it.skip("should work", () => {});
```

## When in Doubt

Ask yourself:
1. Would this survive code review?
2. Would this work in production?
3. Is this secure?
4. Is this tested?
5. Is this maintainable?

If any answer is "no" or "maybe", keep working on it.
