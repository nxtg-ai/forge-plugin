# Database

> Designs schemas that enforce business rules, creates safe reversible migrations, and optimizes queries -- because your data layer is your application's foundation.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Specialist |
| **Model** | Sonnet |

---

## What It Does

The Database agent is the specialist for everything below the API layer: schema design, data modeling, migration creation, query optimization, and storage strategy. It knows that schema design is not just about tables and columns -- it is about encoding business rules into constraints, choosing normalization levels that balance integrity against performance, and designing indexes that make the queries you actually run fast.

In the NXTG-Forge ecosystem, data persistence uses JSON files (`.claude/state/`), in-memory stores (runtime data like activities and sessions), and localStorage (client-side state). The Database agent understands this landscape and recommends the right storage for each use case -- SQLite for structured relational data that needs querying, JSON files for configuration and governance state, in-memory stores for ephemeral session data. When the project grows beyond file-based storage, it designs proper migration strategies with up and down paths.

What makes this agent more than a schema generator is its understanding of data integrity. Every schema it designs includes Zod validation schemas for runtime type checking, foreign key relationships for referential integrity, and index strategies for the access patterns the application actually uses. It treats migrations as code -- version controlled, reviewed, tested, and never modified after creation. When queries are slow, it does not just add indexes blindly; it analyzes the actual access patterns and designs an indexing strategy that scales.

## When to Use It

- **Adding a new data model**: When your feature needs persistent storage and you need schema design, Zod validation schemas, and migration scripts.
- **Optimizing slow queries**: When a database operation takes too long and you need query analysis, index recommendations, and caching strategy.
- **Designing data relationships**: When you need to model complex relationships (one-to-many, many-to-many, versioned data) with proper constraints and efficient access patterns.
- **Migrating storage strategies**: When you are moving from JSON files to SQLite, or from in-memory to persistent storage, and need a safe migration path.

Do not use the Database agent for API endpoint design (use API), frontend state management (use UI), or general architecture decisions (use Planner). The Database agent works below the service layer.

## How It Works

The Database agent follows a structured approach to data work:

1. **Requirements Analysis** -- Understands what data needs to be stored, how it will be accessed (read-heavy vs. write-heavy), and what business rules apply (uniqueness, required fields, valid ranges, relationships).

2. **Schema Design** -- Creates normalized schemas that eliminate data duplication. Each fact is stored once. Foreign keys enforce relationships. Denormalization is only applied for proven performance needs, never as a default.

3. **Zod Validation** -- Generates Zod schemas that match the storage schema. These serve as runtime type guards at the boundary between untyped input (API requests, file reads) and typed application code.

4. **Migration Creation** -- Writes both up and down migrations. Existing migrations are never modified. Migrations include data transformations, not just schema changes. Every migration is tested against representative data.

5. **Index Strategy** -- Designs indexes based on actual query patterns: which fields are filtered, sorted, and joined most often. Considers composite indexes for multi-column queries and partial indexes for filtered subsets.

6. **Query Optimization** -- When analyzing slow queries, measures execution time, identifies full table scans, recommends index additions, suggests pagination for large result sets, and introduces caching for frequently-read, rarely-written data.

## Examples

### Example 1: Designing a Versioned Preferences Schema

```
User: "I need to store user preferences with versioning"

Database:
  - Designs schema:
    - preferences table: id (UUID), user_id (FK), key (string), value (JSON), version (int)
    - preferences_history table: id, preference_id (FK), old_value, new_value, changed_at
    - Unique constraint on (user_id, key) for current preferences
  - Creates Zod schemas:
    PreferenceSchema = z.object({
      userId: z.string().uuid(),
      key: z.string().min(1).max(100),
      value: z.unknown(),
    })
  - Writes migration: up (create tables + indexes) and down (drop tables)
  - Indexes: (user_id) for lookups, (user_id, key) for specific preference access
  - Result: Versioned preference system with full audit trail
```

### Example 2: Optimizing a Slow Activity Feed

```
User: "The activity feed query takes 2 seconds"

Database:
  - Analyzes: Current query scans all activities, sorts by timestamp, takes first 50
  - Finds: No index on timestamp, no pagination (loads all then slices in JS)
  - Recommends:
    - Add index on (timestamp DESC) -- reduces scan from full table to index seek
    - Add cursor-based pagination (WHERE timestamp < :cursor LIMIT 50)
    - Cache the "top 50" result with 5-second TTL for frequently-viewed feeds
  - Implements: Index creation migration + paginated query function
  - Result: Query time drops from 2000ms to 12ms with index + pagination
```

### Example 3: Migrating from JSON to SQLite

```
User: "Our JSON state files are getting unwieldy, should we move to SQLite?"

Database:
  - Assesses: 12 JSON files, largest is 2MB, frequent concurrent read/write
  - Recommends: Yes -- SQLite handles concurrent access, supports queries, stays file-based
  - Designs: Migration strategy:
    1. Create SQLite schema matching current JSON structure
    2. Write data migration script (JSON -> SQLite, preserving all records)
    3. Update data access layer to use SQLite driver
    4. Keep JSON files as backup for 2 releases, then remove
  - Creates: Reversible migration with rollback to JSON if issues arise
  - Result: Structured migration plan with zero data loss and rollback capability
```

## Power Use Cases

**Planner Domain Routing**: When the Planner detects a feature involves data modeling or schema changes, it routes to the Database agent after Builder. The Database agent designs the schema, writes migrations, and creates Zod validation schemas that Builder uses in the service layer.

**API + Database Pairing**: For features that span the full stack, the API agent designs the endpoint contract while the Database agent designs the storage layer. The Zod schemas generated by Database are reused by API for input validation, ensuring consistency between storage and HTTP layers.

**Performance Collaboration**: When the Performance agent identifies slow API responses, it delegates to the Database agent for query optimization. Database analyzes access patterns, adds indexes, implements pagination, and introduces caching -- the specific fixes that Performance cannot do alone.

## Combines With

| Feature | Synergy |
|---------|---------|
| **API** | API designs endpoints; Database designs the storage behind them. Both generate Zod schemas -- ideally from the same source of truth. |
| **Planner** | Planner routes database-domain features to the Database agent. Schema design happens before implementation. |
| **Performance** | Performance identifies slow queries; Database optimizes them with indexes, pagination, and caching. |
| **Testing** | Testing generates tests for data access layers. Database provides the schema knowledge that shapes test fixtures. |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Schema design with normalization. Zod validation schema generation. Safe reversible migrations. Index strategy design. Query optimization analysis. |
| **L2 Pro Builder** | Schema decisions recorded via `forge_capture_knowledge` (category: "decisions"). Past data patterns recalled via `forge_get_knowledge` to inform new schema design. |
| **L3 Ship Lord** | Data metrics (query latency, table sizes, index utilization) visible in the forge-ui dashboard performance panels. |

## Tips & Gotchas

- **Do**: Design indexes based on your actual query patterns, not on intuition. An index on a column you never filter by wastes write performance.
- **Don't**: Modify existing migrations after they have been run. Create a new migration to alter the schema. Migration history must be append-only.
- **Do**: Generate Zod schemas alongside database schemas. Runtime validation at the boundary catches data integrity issues before they reach storage.
- **Don't**: Denormalize by default. Start normalized, measure performance, and denormalize only specific access patterns that prove too slow with joins.

---

*See also: [API](api.md) | [Performance](performance.md) | [Planner](planner.md)*
