# v0 Development Instructions

## 🚨 CRITICAL DEPLOYMENT REQUIREMENT 🚨

**ALL FILES MUST BE WRITTEN COMPLETELY - NO PLACEHOLDERS ALLOWED**

When working with v0 on this project:

### ✅ REQUIRED PRACTICES

### File Content Requirements:
- **Write complete file content** for every file being modified
- **Include all imports, exports, and function implementations**
- **Ensure all referenced functions and variables are included**
- **Include all TypeScript types and interfaces**
- **Write full component implementations with all props and handlers**

### Forbidden Practices:
- ❌ **NEVER use placeholders** like "... This file was left out for brevity..."
- ❌ **NEVER reference missing functions** or incomplete implementations
- ❌ **NEVER make partial file updates** that break imports/exports
- ❌ **NEVER skip writing complete implementations**

### Deployment Process:
1. Make changes through v0 with complete files
2. Deploy to Vercel to test
3. Verify functionality works
4. Proceed to next change

### Common Issues:
- Missing exports cause deployment failures
- Incomplete files break the build
- Placeholder content prevents proper deployment

## Project Context

This is a production application that:
- Uses Clerk for authentication
- Has a complex role-based permission system
- Integrates with SQL Server database
- Must maintain backward compatibility
- Requires careful handling of user management functions

Always consider the full impact of changes on the authentication and permission systems.

## Development Workflow

### Step-by-Step Process:
1. **User requests changes** with explicit instruction: "Write complete file contents - no placeholders"
2. **v0 provides complete files** with all necessary code
3. **User applies changes** to GitHub repository manually
4. **User deploys to Vercel** to test functionality
5. **User verifies everything works** before proceeding
6. **Repeat process** for next change

### Deployment Context:
- **Vercel builds from GitHub** - changes in v0 chat are not automatically synced
- **Build failures are expensive** - they waste development time
- **Complete files prevent deployment issues** - partial implementations cause build errors
- **Manual application required** - user must copy code to GitHub manually

## Project-Specific Requirements

### Authentication System:
- Uses **Clerk for authentication**
- Has **complex role-based permission system**
- Requires **careful handling of user management functions**
- **Backward compatibility is critical**

### Database Integration:
- **SQL Server database** with Azure integration
- **Specific table names** must be used (e.g., `SyncActiveHomes`, not `Homes`)
- **Connection parameters are locked** - do not modify `lib/db.ts` without permission
- **Query syntax must be SQL Server compatible**

### UI/UX Standards:
- **Custom brand colors** defined in `tailwind.config.ts`
- **Consistent styling patterns** for components
- **Specific z-index requirements** for map components
- **Dynamic imports required** for Leaflet maps

## Common Deployment Failures

### Missing Exports:
\`\`\`typescript
// ❌ WRONG - Missing export
function getUserById(id: string) { ... }

// ✅ CORRECT - Proper export
export function getUserById(id: string) { ... }
\`\`\`

### Incomplete Implementations:
\`\`\`typescript
// ❌ WRONG - Placeholder content
export function processData() {
  // ... implementation details ...
}

// ✅ CORRECT - Complete implementation
export function processData(data: UserData[]): ProcessedData[] {
  return data.map(item => ({
    id: item.id,
    name: item.name,
    processed: true
  }));
}
\`\`\`

### Missing Imports:
\`\`\`typescript
// ❌ WRONG - Missing imports
export function MyComponent() {
  return <Button>Click me</Button>; // Button not imported
}

// ✅ CORRECT - All imports included
import { Button } from '@/components/ui/button';

export function MyComponent() {
  return <Button>Click me</Button>;
}
\`\`\`

## Quality Checklist

Before providing any code, verify:
- [ ] All files are complete with no placeholders
- [ ] All imports and exports are included
- [ ] All referenced functions are implemented
- [ ] TypeScript types are properly defined
- [ ] Component props and handlers are complete
- [ ] Database queries use correct table names
- [ ] Styling follows brand guidelines
- [ ] No deprecated or removed functions are referenced

## Emergency Procedures

If deployment fails:
1. **Provide full build log** to v0 for analysis
2. **Request complete file rewrites** rather than patches
3. **Test each change individually** before combining
4. **Verify all dependencies** are properly installed
5. **Check environment variables** are correctly configured

## Success Metrics

A successful v0 interaction should result in:
- ✅ **Clean deployment** to Vercel without build errors
- ✅ **Functional application** with all features working
- ✅ **No missing dependencies** or import errors
- ✅ **Consistent styling** following brand guidelines
- ✅ **Proper error handling** and user feedback
- ✅ **Maintained backward compatibility** with existing features

Remember: **Complete files prevent deployment failures and save development time.**
