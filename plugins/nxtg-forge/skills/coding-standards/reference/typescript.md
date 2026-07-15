# TypeScript / JavaScript — Detailed Reference

Companion to `../SKILL.md`. Prefer TypeScript over plain JavaScript for any non-trivial
code. Examples use neutral names — substitute your own.

---

## tsconfig — strict baseline

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,                    // the single most valuable flag
    "noUncheckedIndexedAccess": true,  // arr[i] is T | undefined
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

`strict: true` implies `noImplicitAny`, `strictNullChecks`, and more. Avoid `any`; reach
for `unknown` and narrow, or a precise union.

---

## Types vs Interfaces

```typescript
// interface — object shapes, declaration merging, class implements
interface User {
  id: number;
  email: string;
  createdAt: Date;
}

// type — unions, tuples, mapped/conditional types, aliases
type UserId = string;
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };
```

Rule of thumb: `interface` for public object contracts, `type` for unions and
composition. Model absence explicitly (`T | null`) rather than leaning on `undefined`.

---

## Naming

```typescript
interface UserAccount {}          // PascalCase types/interfaces
type UserId = string;
class PaymentProcessor {}          // PascalCase classes
function calculateTotal() {}       // camelCase functions
const userEmail = "a@b.com";       // camelCase variables
const MAX_RETRY_ATTEMPTS = 3;      // SCREAMING_SNAKE_CASE constants
class Example { #internalState = ""; }  // #field = true private (runtime-enforced)
```

`private` (TS keyword) is compile-time only and erased at runtime — use `#field` when you
need real runtime privacy.

---

## Modern JavaScript idioms

```typescript
// Concurrent async over a collection
const users = await Promise.all(ids.map((id) => fetchUser(id)));
const active = users.filter((u) => u.isActive);
const { email, name } = user;                 // destructuring
const label = user.nickname ?? user.email;    // nullish coalescing (not ||)
const city = user.address?.city;              // optional chaining

// AVOID
var users = [];
for (var i = 0; i < ids.length; i++) {
  users.push(await fetchUser(ids[i]));         // serial, slow; var hoisting
}
```

Prefer `const`, then `let`; never `var`. Use `===`/`!==` (not `==`). Prefer immutable
transforms (`map`/`filter`/`reduce`) over mutation.

---

## Error handling

```typescript
async function findUser(id: number): Promise<User> {
  try {
    const user = await repo.findById(id);
    if (!user) throw new NotFoundError(`user ${id}`);
    return user;
  } catch (err) {
    logger.error(`find user ${id} failed`, err);
    // `cause` preserves the original for the stack / errors up the chain
    throw new ServiceError("lookup failed", { cause: err });
  }
}
```

`catch (err)` binds `err: unknown` under strict mode — narrow before using
(`if (err instanceof SomeError)`). Define an error subclass hierarchy for precise
`instanceof` checks.

```typescript
class AppError extends Error {}
class NotFoundError extends AppError {}
class ValidationError extends AppError {
  constructor(public readonly issues: string[]) {
    super(`validation failed: ${issues.join(", ")}`);
  }
}
```

---

## Lint / format

- **ESLint** for correctness rules (`@typescript-eslint`), **Prettier** for formatting.
  Don't let both fight over the same rules — use `eslint-config-prettier` to disable
  formatting-related ESLint rules.
- Useful rules: `complexity`, `max-lines`, `@typescript-eslint/no-floating-promises`
  (unhandled promise rejections), `no-console` (allow in scripts, deny in libraries).

```jsonc
// .eslintrc.json (flat-config equivalents apply)
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": { "no-console": "warn", "complexity": ["warn", 10] }
}
```

---

## References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [typescript-eslint](https://typescript-eslint.io/) · [Prettier](https://prettier.io/)
