# SmartEM Frontend

A React-based web application for visualising and analysing electron microscopy data from the SmartEM system. Built with React Router 7, TanStack Query, and Material-UI.

## Features

- Real-time visualisation of acquisition data, grids, and grid squares
- Interactive atlas views with quality predictions
- Foil hole analysis and quality metrics
- Type-safe API client auto-generated from OpenAPI specification
- Server-side rendering with React Router
- Modern state management with TanStack Query

## Prerequisites

- Node.js 20 or later
- npm or compatible package manager
- SmartEM backend API running (default: http://localhost:8000)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with hot module replacement:

```bash
npm run dev
```

Your application will be available at `http://localhost:5174`.

### Environment Configuration

The application connects to the SmartEM backend API:

- **Development**: Uses Vite proxy at `/api` → `http://localhost:8000` to avoid CORS issues
- **Production**: Uses `VITE_API_ENDPOINT` environment variable or defaults to `http://localhost:8000`

To use a different API endpoint in production:

```bash
VITE_API_ENDPOINT=https://api.example.com npm run build
```

**Note:** The backend API must have CORS configured correctly for production deployments. The development proxy bypasses CORS restrictions.

### Mock API Mode

Develop without a running backend using auto-generated mock data:

```bash
npm run dev:mock
```

Mock responses are generated from the OpenAPI specification and updated automatically when you regenerate the API client.

## API Client Generation

The frontend uses [Orval](https://orval.dev/) to automatically generate a type-safe API client from the backend's OpenAPI specification. This ensures the frontend stays in sync with the backend API.

### Updating the API Client

When the backend API changes, regenerate the client code:

```bash
npm run api:update
```

This command:

1. Fetches the latest OpenAPI specification from the published source
2. Generates TypeScript types and React Query hooks in `app/api/generated/`

### API Scripts

The following npm scripts are available for API management:

- `npm run api:fetch` - Download the latest OpenAPI spec from the published source
- `npm run api:fetch:local` - Download the OpenAPI spec from your local development server (http://localhost:8000)
- `npm run api:generate` - Generate API client code from the current OpenAPI spec
- `npm run api:update` - Fetch and generate in one command (recommended)

### Using a Different OpenAPI Source

To generate from a different OpenAPI specification URL:

```bash
OPENAPI_URL=https://example.com/openapi.json npm run api:generate
```

### Generated Files

Orval generates the following files in `app/api/generated/`:

- `default/default.ts` - API functions and React Query hooks
- `models/*.ts` - TypeScript type definitions for all API schemas
- `api-version.ts` - API version information extracted from OpenAPI spec

These files should not be edited manually as they will be overwritten on regeneration.

### API Version Tracking

The API client includes the version from the OpenAPI spec it was generated from. In development mode, the app automatically checks whether the backend API version matches and logs a warning to the console if there's a mismatch. If you see a version mismatch warning, regenerate the client with `npm run api:update`.

### Using the API Client

The generated hooks follow TanStack Query conventions:

```typescript
import { useGetAcquisitionsAcquisitionsGet } from '../api/generated/default/default'

function MyComponent() {
  const { data, isLoading, error } = useGetAcquisitionsAcquisitionsGet()

  if (isLoading) return <CircularProgress />
  if (error) return <Alert severity="error">{error.message}</Alert>

  return <div>{/* render data */}</div>
}
```

## Building for Production

Create a production build:

```bash
npm run build
```

The build output will be in the `build/` directory:

```
build/
├── client/    # Static assets
└── server/    # Server-side code
```

## Running Production Build

Start the production server:

```bash
npm start
```

## Code Quality

### Linting and Formatting

This project uses a hybrid approach for code quality:

- **Biome** for TypeScript/JavaScript code (linting + formatting)
- **Prettier** for configuration files (YAML, Markdown)

#### Available Commands

```bash
# Lint code files
npm run lint

# Lint and auto-fix issues
npm run lint:fix

# Format all files (Biome + Prettier)
npm run format

# Check formatting without writing
npm run format:check

# Run all checks (format + lint + organize imports)
npm run check

# Run all checks and auto-fix
npm run check:fix
```

#### What Each Tool Handles

**Biome** (fast, modern):

- `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.json` files
- Linting (catches bugs, enforces best practices)
- Formatting (code style)
- Import sorting

**Prettier** (mature, comprehensive):

- `*.yml`, `*.yaml` files (Lefthook, CI configs)
- `*.md` files (documentation)

#### Editor Setup (VS Code)

Install the recommended extensions:

- [Biome](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

The workspace is pre-configured in `.vscode/settings.json` to:

- Format on save
- Use Biome for code files
- Use Prettier for config files
- Organize imports automatically

### Type Checking

Run TypeScript type checking:

```bash
npm run typecheck
```

## Project Structure

```
app/
├── api/
│   ├── generated/       # Auto-generated API client (do not edit)
│   ├── mutator.ts       # Axios configuration for API client
│   └── openapi.json     # OpenAPI specification (version controlled)
├── components/          # Reusable React components
├── hooks/              # Custom React hooks
├── routes/             # Route components
└── root.tsx            # Application root with providers
```

## Git Hooks

This project uses [Lefthook](https://github.com/evilmartians/lefthook) for managing Git hooks.

### Installation

Git hooks are automatically installed when you run `npm install` (via the `prepare` script).

To manually install or reinstall hooks:

```bash
npx lefthook install
```

### Active Hooks

**Pre-commit** (runs on every commit):

- **Biome check**: Lints and formats staged TypeScript/JavaScript files, auto-fixes issues
- **Prettier**: Formats staged YAML and Markdown files
- Changes are automatically staged after fixes

**Pre-push** (runs before pushing to remote):

- **Type checking**: Runs `npm run typecheck` to catch TypeScript errors
- **Lint check**: Full project lint without auto-fixing
- **Format check**: Verifies all files are properly formatted

### Configuration

All hook configuration is in `lefthook.yml`. You can customize which checks run and when.

### Skipping Hooks

To temporarily skip hooks during development:

```bash
# Skip all hooks for a single commit
LEFTHOOK=0 git commit -m "message"

# Skip specific hook
git commit --no-verify -m "message"
```

## Technology Stack

- **React 19** - UI library
- **React Router 7** - Routing and server-side rendering
- **TanStack Query** - Server state management and caching
- **Material-UI** - Component library
- **Orval** - API client generation
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Utility-first styling
- **Biome** - Fast linter and formatter for code
- **Prettier** - Formatter for config files
- **Lefthook** - Git hooks manager

## Contributing

When adding new API endpoints or modifying existing ones:

1. Update the backend OpenAPI specification
2. Run `npm run api:update` to regenerate the client
3. Update components to use the new hooks
4. Run `npm run typecheck` to verify type safety

## Licence

Copyright Diamond Light Source
