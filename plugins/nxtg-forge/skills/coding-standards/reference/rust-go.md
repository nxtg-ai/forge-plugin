# Rust & Go — Detailed Reference

Companion to `../SKILL.md`. Both languages are statically typed with strong tooling
defaults — the discipline is idiomatic error handling and letting the formatter decide
layout. Examples are illustrative.

---

## Rust

### Tooling (non-negotiable defaults)

- **`cargo fmt`** (rustfmt) — the canonical formatter; don't hand-format, don't argue
  line length. Run in CI with `cargo fmt --check`.
- **`cargo clippy`** — the linter. Treat warnings as errors in CI:
  `cargo clippy --all-targets -- -D warnings`.
- **`cargo test`** — unit tests in `#[cfg(test)] mod tests`, integration tests in `tests/`.

### Naming

`snake_case` for functions/variables/modules, `PascalCase` for types/traits/enums,
`SCREAMING_SNAKE_CASE` for consts/statics. Module privacy is the default — expose with
`pub` deliberately.

### Error handling — return, don't panic

```rust
// Propagate with `?`; avoid unwrap()/expect() outside tests and main.
fn load_user(id: u64) -> Result<User, AppError> {
    let raw = fs::read_to_string(path_for(id))?;   // io::Error -> AppError via From
    let user = serde_json::from_str(&raw)?;
    Ok(user)
}
```

- **Libraries**: define a typed error enum with [`thiserror`](https://docs.rs/thiserror):

  ```rust
  #[derive(thiserror::Error, Debug)]
  pub enum AppError {
      #[error("not found: {0}")]
      NotFound(u64),
      #[error(transparent)]
      Io(#[from] std::io::Error),
  }
  ```

- **Applications/binaries**: [`anyhow`](https://docs.rs/anyhow) with `.context(...)`:

  ```rust
  let cfg = load_config(&path).context("loading config")?;
  ```

- Model illegal states out of existence with enums; prefer `match` exhaustiveness over
  `if let` chains. Use `Option<T>` for absence, `Result<T, E>` for fallibility — never
  sentinel values.

### Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_rejects_empty_input() {
        assert!(parse("").is_err());
    }
}
```

---

## Go

### Tooling

- **`gofmt`** / `goimports` — formatting is not a matter of opinion; CI runs
  `gofmt -l .` (must print nothing).
- **`go vet`** + **`golangci-lint`** — catch shadowing, unchecked errors, etc.
- **`go test ./...`** — table-driven tests are the norm (below).

### Naming & visibility

Exported identifiers start uppercase (`ParseConfig`), unexported lowercase
(`parseConfig`) — **capitalization IS the access control**. Keep acronyms consistent
(`userID`, `HTTPServer`). Package names are short, lowercase, no underscores.

### Error handling — values, wrapped with `%w`

```go
func LoadUser(id int) (*User, error) {
    raw, err := os.ReadFile(pathFor(id))
    if err != nil {
        return nil, fmt.Errorf("read user %d: %w", id, err)  // %w keeps the chain
    }
    var u User
    if err := json.Unmarshal(raw, &u); err != nil {
        return nil, fmt.Errorf("decode user %d: %w", id, err)
    }
    return &u, nil
}
```

- Check every returned `error` immediately; never `_ = err` to silence it.
- Inspect wrapped errors with `errors.Is` (sentinel) / `errors.As` (typed):

  ```go
  var pathErr *fs.PathError
  if errors.As(err, &pathErr) { /* ... */ }
  if errors.Is(err, os.ErrNotExist) { /* ... */ }
  ```

- Define sentinel errors with `errors.New` at package scope; define typed errors as
  structs implementing `error` when callers need fields.
- **Gotcha**: returning a `nil` concrete-typed pointer as an `error` makes `err != nil`
  true. Return the `error` interface value directly, not a typed nil.

### Concurrency

```go
// errgroup — concurrent, first error cancels the rest
g, ctx := errgroup.WithContext(ctx)
for _, id := range ids {
    id := id
    g.Go(func() error { return process(ctx, id) })
}
if err := g.Wait(); err != nil { return err }
```

Always pass `context.Context` as the first parameter to functions that do I/O; honor
cancellation. Protect shared state with a `sync.Mutex` or channels — run tests with
`-race`.

### Table-driven tests

```go
func TestParse(t *testing.T) {
    tests := []struct {
        name    string
        in      string
        wantErr bool
    }{
        {"empty", "", true},
        {"valid", "42", false},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            _, err := Parse(tt.in)
            if (err != nil) != tt.wantErr {
                t.Fatalf("Parse(%q) err = %v, wantErr %v", tt.in, err, tt.wantErr)
            }
        })
    }
}
```

---

## References

- [The Rust Book](https://doc.rust-lang.org/book/) · [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/) · [Clippy](https://doc.rust-lang.org/clippy/)
- [Effective Go](https://go.dev/doc/effective_go) · [Go Code Review Comments](https://go.dev/wiki/CodeReviewComments) · [golangci-lint](https://golangci-lint.run/)
