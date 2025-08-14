# Clean Code Analyzer

A comprehensive tool for analyzing and improving code quality according to Clean Code principles.

## Features

- **Automated Code Analysis**: Scan TypeScript/JavaScript files for Clean Code violations
- **Quality Metrics**: Calculate complexity, maintainability, and readability scores
- **Actionable Recommendations**: Get specific refactoring suggestions with effort estimates
- **Progress Tracking**: Monitor code quality improvements over time
- **Integration Ready**: Works with CI/CD pipelines and development workflows

## Installation

```bash
npm install clean-code-analyzer
```

## Quick Start

```typescript
import { TypeScriptAnalyzer, CleanCodeAssessor } from 'clean-code-analyzer';

const analyzer = new TypeScriptAnalyzer();
const assessor = new CleanCodeAssessor();

// Analyze a single file
const analysis = await analyzer.analyzeFile('src/example.ts');
const report = assessor.assessFile(analysis);

console.log(`Quality Score: ${report.overallScore}/100`);
console.log(`Violations: ${report.violations.length}`);
```

## Development

### Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build the project
npm run build

# Run linting
npm run lint
```

### Project Structure

```
src/
├── analyzer/           # Core analysis components
│   ├── file-parser.ts     # AST parsing and extraction
│   ├── quality-assessor.ts # Clean Code principle evaluation
│   └── recommendation-engine.ts # Improvement suggestions
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── index.ts           # Main entry point

tests/                  # Test files
├── analyzer/          # Analyzer tests
├── utils/             # Utility tests
└── setup.ts           # Test configuration
```

## Clean Code Principles

This analyzer evaluates code against the following Clean Code principles:

1. **Naming**: Clear, descriptive, and searchable names
2. **Functions**: Small, focused, and single-purpose functions
3. **Classes**: Cohesive classes with single responsibilities
4. **Comments**: Necessary and value-adding comments only
5. **Error Handling**: Consistent and robust error handling
6. **SOLID Principles**: Adherence to SOLID design principles

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.