# Kin Workspace Monorepo

A monorepo containing both the Kin Workspace e-commerce site and its content management system.

## Project Structure

```
├── kin-workspace/          # E-commerce frontend (Next.js)
├── cms/                    # Content Management System (Next.js)
├── package.json           # Root orchestrator
└── README.md
```

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation
```bash
# Install all dependencies for both projects
npm run install:all
```

### Development
```bash
# Start both e-commerce and CMS in development mode
npm run dev

# Or start individually:
npm run dev:ecommerce  # Runs on http://localhost:3000
npm run dev:cms        # Runs on http://localhost:3001
```

### Production
```bash
# Build both projects
npm run build

# Start both projects in production mode
npm start
```

## Projects

### Kin Workspace E-commerce
- **Port:** 3000
- **Path:** `./kin-workspace/`
- **Purpose:** Customer-facing e-commerce website
- **Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Prisma

### CMS (Content Management System)
- **Port:** 3001
- **Path:** `./cms/`
- **Purpose:** Admin interface for managing products, orders, and content
- **Tech Stack:** Next.js 15, TypeScript, Tailwind CSS

## Available Scripts

- `npm run dev` - Start both projects in development mode
- `npm run build` - Build both projects for production
- `npm run start` - Start both projects in production mode
- `npm run install:all` - Install dependencies for all projects
- `npm run test` - Run tests for the e-commerce project
- `npm run lint` - Run linting for both projects

## Development Workflow

1. Make changes to either project in their respective folders
2. Both projects will hot-reload automatically during development
3. Each project maintains its own dependencies and configuration
4. Shared resources can be managed at the root level

## Deployment

Each project can be deployed independently:
- E-commerce site: Deploy the `kin-workspace/` folder
- CMS: Deploy the `cms/` folder

Or deploy as a monorepo using platforms that support workspace management.