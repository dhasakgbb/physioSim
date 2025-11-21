# Architecture Consistency Audit Report

## 🚨 Critical Issues Found

### 1. **Dual Frontend Architecture (CRITICAL)**
**Issue**: The project contains TWO separate frontend applications doing similar things:
- React/Vite app (`/src/`) - Main application (20+ components)
- Angular app (`/frontend/`) - Prototype/duplicate (3 components)

**Impact**: Confusing development, maintenance overhead, deployment complexity.

**Evidence**:
- Both have dashboard layouts with similar tabs ("Explore/Optimize/Signaling")
- React: `TabbedChartCanvas.jsx` with 5 tabs (Efficiency, Serum, Evolution, Optimize, Pathways)
- Angular: `app.html` with 3 tabs (Explore, Optimize, Signaling)
- Both connect to the same gRPC backend

### 2. **Inconsistent Build System**
**Issue**: Three separate build outputs with no unified deployment strategy:
- `cmd/server/dist/` - Built Angular app
- `dist/` - Built React app
- No clear indication which is the "production" version

### 3. **Framework Inconsistency in Angular**
**Issue**: Angular frontend uses Tailwind classes but Tailwind is not configured in `angular.json`.

**Evidence**: `frontend/src/app/components/active-mixture/active-mixture.html` uses:
```html
class="h-14 w-full cursor-pointer items-center justify-between border-b border-white/5"
```

But `frontend/package.json` shows only basic Tailwind installation without Angular integration.

## 🏗️ Architectural Patterns Analysis

### Component Architecture

#### ✅ **React Components (Good)**
- **Pattern**: Functional components with hooks
- **Naming**: PascalCase (`Dashboard.jsx`, `TabbedChartCanvas.jsx`)
- **Structure**: Feature-based organization (`dashboard/`, `ui/`)
- **State**: Context providers (`StackContext.jsx`, `SimulationContext.jsx`)

#### ⚠️ **Angular Components (Inconsistent)**
- **Pattern**: Classes with decorators (modern Angular)
- **Naming**: kebab-case (`simulation-chart.ts`)
- **Structure**: Flat component organization
- **State**: Services with signals (`SimulationClientService`)

### State Management

#### ✅ **React (Consistent)**
- **Pattern**: React Context + useReducer pattern
- **Persistence**: localStorage with structured keys
- **Updates**: Optimistic updates with error handling

#### ⚠️ **Angular (Different Pattern)**
- **Pattern**: Service-based with Angular signals
- **Persistence**: Not implemented
- **Updates**: Direct service calls

### API Design

#### ✅ **gRPC-Web (Good)**
- **Protocol**: Well-defined protobuf contracts
- **Client Generation**: Automated TypeScript generation
- **Error Handling**: Structured error responses

#### ⚠️ **Environment Configuration**
- **React**: `import.meta.env` (Vite-specific)
- **Angular**: `environment.ts` files (Angular-specific)
- **Backend**: OS environment variables

### Naming Conventions

#### ✅ **Consistent Areas**
- **CSS Variables**: `--bg-main`, `--color-text-primary`
- **Constants**: `STORAGE_KEYS.PROFILE`
- **Functions**: camelCase

#### ⚠️ **Inconsistent Areas**
- **File Extensions**: `.jsx` vs `.js` vs `.ts`
- **Component Files**: `Dashboard.jsx` vs `simulation-chart.ts`
- **Directory Structure**: React uses `dashboard/`, Angular uses `components/`

### Testing Patterns

#### ✅ **React Testing (Comprehensive)**
- **Framework**: Vitest + React Testing Library
- **Coverage**: Component tests, utility tests, data validation
- **Setup**: Shared test utilities and mocks

#### ⚠️ **Angular Testing (Incomplete)**
- **Framework**: Vitest configured but minimal test files
- **Coverage**: Only basic component spec
- **Setup**: Basic Angular testing setup

### Configuration Management

#### ❌ **Fragmented Configuration**
- **Build**: Separate `vite.config.js`, `angular.json`
- **Styling**: Separate Tailwind configs (root vs frontend)
- **Environment**: Different environment file patterns
- **Dependencies**: Separate `package.json` files

## 🔧 Recommended Architecture Fixes

### Phase 1: Immediate Consolidation

#### Option A: Standardize on React (Recommended)
```bash
# Remove Angular frontend
rm -rf frontend/

# Update documentation to reflect single frontend
# Update build scripts for React-only deployment
```

#### Option B: Standardize on Angular
```bash
# Move React components to Angular
# Remove root React setup
# Standardize on Angular architecture
```

#### Option C: Micro-frontend Architecture
```bash
# Implement proper micro-frontend setup
# Define clear boundaries between apps
# Implement shared component library
```

### Phase 2: Architecture Improvements

#### 1. Unified Configuration
```javascript
// monorepo structure with shared configs
/
├── apps/
│   ├── frontend/          # Single frontend app
│   └── backend/
├── packages/
│   ├── shared/           # Common utilities
│   ├── ui/              # Shared components
│   └── config/          # Shared configuration
```

#### 2. Consistent Component Patterns
```javascript
// Standard component structure
ComponentName/
├── ComponentName.jsx
├── ComponentName.test.jsx
├── index.js              # Barrel export
└── styles.css           # Scoped styles
```

#### 3. Unified State Management
```javascript
// Single state management solution
// Either Zustand or Redux Toolkit for consistency
```

#### 4. Consistent Build Pipeline
```json
{
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  }
}
```

### Phase 3: Developer Experience

#### 1. Monorepo Tooling
- **Turborepo** or **Nx** for task orchestration
- **Changesets** for version management
- **Storybook** for component documentation

#### 2. Consistent Tooling
- **ESLint + Prettier** across all projects
- **TypeScript** everywhere (migrate React to TS)
- **Vitest** for all testing
- **Tailwind** with shared design tokens

## 📊 Architecture Assessment

| Category | Score | Status | Priority |
|----------|-------|--------|----------|
| **Project Structure** | 🔴 2/10 | Chaotic dual-frontend | Critical |
| **Component Architecture** | 🟡 6/10 | Good React, incomplete Angular | High |
| **State Management** | 🟡 5/10 | Different patterns | Medium |
| **API Design** | 🟢 8/10 | Well-structured gRPC | Low |
| **Testing** | 🟡 6/10 | Comprehensive React, minimal Angular | Medium |
| **Configuration** | 🔴 3/10 | Fragmented and inconsistent | High |
| **Build System** | 🔴 2/10 | Multiple conflicting builds | Critical |

## 🎯 Immediate Action Plan (React Chosen)

### Phase 1: Immediate Consolidation (This Week)
1. ✅ **Framework Decision**: React selected as primary framework
2. **Remove Angular prototype**: Delete `/frontend/` directory
3. **Update build scripts**: Remove Angular-specific commands
4. **Update documentation**: Remove Angular references

### Phase 2: Architecture Cleanup (Next Week)
1. **Consolidate configurations**: Single `package.json`, unified build process
2. **Standardize component patterns**: All components follow React conventions
3. **Update CI/CD**: Single deployment pipeline
4. **Clean up imports**: Remove any Angular-specific code

### Phase 3: Optimization (Ongoing)
1. **Add TypeScript**: Migrate React components to TypeScript
2. **Improve testing**: Add missing test coverage
3. **Performance optimization**: Bundle analysis and optimization
4. **Developer experience**: Add Storybook, better tooling

## 💡 Best Practice Recommendations

### Code Organization
```
src/
├── components/           # UI components
│   ├── ui/              # Primitive components
│   ├── dashboard/       # Feature components
│   └── layout/          # Layout components
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── services/            # API services
├── context/             # React context providers
├── data/                # Static data and constants
└── types/               # TypeScript definitions
```

### Naming Conventions
- **Files**: PascalCase for components (`Dashboard.jsx`)
- **Directories**: camelCase (`dashboardLayout/`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_ENDPOINTS`)
- **Functions**: camelCase (`calculateDosage()`)

### Component Patterns
```javascript
// Consistent component structure
const ComponentName = ({ prop1, prop2 }) => {
  // Hooks at top
  const [state, setState] = useState(initialValue);

  // Effects next
  useEffect(() => {
    // Side effects
  }, [dependencies]);

  // Event handlers
  const handleEvent = useCallback(() => {
    // Handler logic
  }, [dependencies]);

  // Render
  return (
    <div className="component-name">
      {/* JSX */}
    </div>
  );
};
```

## 🔍 Ongoing Architecture Health

### Monitoring Checklist
- [ ] Single source of truth for components
- [ ] Consistent state management patterns
- [ ] Unified build and deployment process
- [ ] Comprehensive test coverage
- [ ] Shared design system
- [ ] Automated dependency updates
- [ ] Performance monitoring
- [ ] Bundle size optimization

This architecture needs significant consolidation. The dual-frontend approach is unsustainable and creates maintenance overhead. Choose one framework and commit to it.
