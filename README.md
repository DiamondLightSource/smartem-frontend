[![Built with Claude Code](https://img.shields.io/badge/Built%20with-Claude%20Code-6366f1?logo=claude)](https://claude.ai/code)

# SmartEM Frontend

A React-based web application for visualising and analysing electron microscopy data from the SmartEM system. Built with React 19, React Router 7, TanStack Query, and Material-UI.

## Features

- Real-time visualisation of acquisition data, grids, and grid squares
- Interactive atlas views with quality predictions
- Foil hole analysis and quality metrics
- Type-safe API client auto-generated from OpenAPI specification

## Prerequisites

- Node.js 20 or later
- npm or compatible package manager
- SmartEM backend API running (default: http://localhost:8000)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run with mock API (no backend required)
npm run dev:mock
```

Your application will be available at `http://localhost:5174`.

## Technology Stack

React 19, React Router 7, TanStack Query, Material-UI, Orval, TypeScript, Vite, Tailwind CSS, Biome, Prettier, Lefthook

## Documentation

Full documentation: <https://DiamondLightSource.github.io/smartem-devtools>

- [API Client Generation](https://diamondlightsource.github.io/smartem-devtools/frontend/api-client)
- [Code Quality](https://diamondlightsource.github.io/smartem-devtools/frontend/code-quality)
- [Git Hooks](https://diamondlightsource.github.io/smartem-devtools/frontend/git-hooks)

## Contributing

When adding new API endpoints or modifying existing ones:

1. Update the backend OpenAPI specification
2. Run `npm run api:update` to regenerate the client
3. Update components to use the new hooks
4. Run `npm run typecheck` to verify type safety

## Licence

Copyright Diamond Light Source
