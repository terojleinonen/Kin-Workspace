# Technology Stack & Development Guidelines

## Core Technologies
- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript (strict mode enabled)
- **Styling:** Tailwind CSS with custom design system
- **UI Components:** Headless UI, Heroicons
- **Animations:** Framer Motion
- **State Management:** React Context (CartContext)

## Build System & Commands
```bash
# Development
npm run dev          # Start development server on localhost:3000

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking without emit
```

## Key Dependencies
- **UI/UX:** @headlessui/react, @heroicons/react, framer-motion
- **Styling:** tailwindcss, autoprefixer, postcss
- **Utilities:** clsx for conditional classes
- **Dev Tools:** prettier with tailwindcss plugin, eslint-config-next

## Configuration Files
- `next.config.js` - Next.js configuration with image optimization
- `tailwind.config.js` - Custom design system colors, fonts, animations
- `tsconfig.json` - TypeScript with path aliases (@/components/*, @/lib/*)
- `.eslintrc.json` - ESLint with Next.js config
- `.prettierrc` - Code formatting with Tailwind plugin

## Requirements
- Node.js >= 18.0.0
- npm >= 8.0.0
- TypeScript strict mode compliance
- ESLint and build error enforcement (no ignored errors)