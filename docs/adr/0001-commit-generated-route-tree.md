# ADR 0001: Commit Generated Route Tree to Version Control

## Status

Accepted

## Context

TanStack Router uses file-based routing and generates a `routeTree.gen.ts` file that contains the complete route tree for type safety. This generated file needs to be kept in sync with the route files, but there are different approaches to managing generated files:

1. **Commit the file**: Treat it as source code and commit to version control
2. **Gitignore the file**: Add to `.gitignore` and regenerate on every build
3. **Hybrid approach**: Commit but use CI checks to verify it's up to date

Different tools in the ecosystem handle this differently:

- **GraphQL Codegen**: Typically gitignored, regenerated via pre-scripts
- **Prisma Client**: Typically gitignored, regenerated on install
- **TanStack Router**: TanStack officially recommends committing the file

The key consideration is that `routeTree.gen.ts` provides TypeScript types that are needed immediately when developers clone the repository or switch branches.

## Decision

We will **commit `routeTree.gen.ts` to version control** and add CI verification to ensure it stays in sync with route files.

### Implementation

1. **Commit the generated file**: Include `src/routeTree.gen.ts` in version control
2. **Configure linter to ignore it**: Add to biome `overrides` to skip linting/formatting
3. **Add verification scripts**:
   ```json
   {
     "router:generate": "tsr generate",
     "router:check": "tsr generate && git diff --exit-code src/routeTree.gen.ts"
   }
   ```
4. **CI verification**: Add `npm run router:check` to CI pipeline to fail if file is out of sync
5. **Install CLI as devDependency**: Add `@tanstack/router-cli` to ensure consistent versions

### No Git Hooks

We explicitly chose **not** to use git hooks (pre-commit/pre-push) because:

- The Vite plugin already auto-generates during development
- Git hooks would create redundant generation
- Can cause confusion with "double generation" issues
- Slows down commit process unnecessarily

## Consequences

### Positive

- **Type safety on clone**: Developers get TypeScript types immediately after cloning
- **Works in CI**: Type checking works without needing generation step before `tsc`
- **Branch switching**: Types are correct immediately when switching branches
- **Clear audit trail**: Changes to routes are visible in git diffs
- **Follows official guidance**: Aligned with TanStack Router's recommendation

### Negative

- **Merge conflicts**: Generated file can cause conflicts when multiple people modify routes
  - **Mitigation**: When conflicts occur, regenerate with `npm run router:generate` rather than manually resolving
- **Repository size**: Adds ~14KB generated file to repository
  - **Impact**: Negligible for most projects
- **CI dependency**: Requires CI to run verification check
  - **Implementation**: Simple check: `npm run router:check`

### Neutral

- **Developer workflow**: No change - Vite plugin handles generation automatically during development
- **Manual sync rarely needed**: Only if someone edits routes without running dev server (rare)

## Alternatives Considered

### Alternative 1: Gitignore and Regenerate

**Approach**: Add `routeTree.gen.ts` to `.gitignore` and regenerate on every build

**Rejected because**:

- Type checking fails immediately after clone
- CI needs extra generation step before `tsc`
- Creates "works on my machine" issues if generation differs
- Against TanStack Router's official recommendation

### Alternative 2: Git Hooks

**Approach**: Use pre-commit hooks to regenerate before each commit

**Rejected because**:

- Vite plugin already handles generation during dev
- Creates redundant/duplicate generation
- Slows down commits
- Can cause confusion about which generation is "correct"

## References

- [TanStack Router FAQ: Should I commit routeTree.gen.ts?](https://tanstack.com/router/latest/docs/framework/react/faq)
- [TanStack Router Discussion #1218](https://github.com/TanStack/router/discussions/1218)
- [File-Based Routing Documentation](https://tanstack.com/router/latest/docs/framework/react/guide/file-based-routing)

## Date

2025-01-12
