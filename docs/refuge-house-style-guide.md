# Refuge House Modern Web Design Style Guide

## Core Design Principles

### 1. Soft Modernism
- **Rounded corners as default** (not sharp edges) - use `rounded-xl` for cards, `rounded-lg` for buttons
- **Subtle shadows for depth** - `shadow-sm` default, `shadow-md` on hover
- **Organic, flowing layouts** over rigid grids where appropriate
- **Generous whitespace** with consistent spacing scale (4, 6, 8, 12, 16, 20, 24)

### 2. Visual Hierarchy
- **Bold, clear typography** with proper size relationships
- **Size, weight, and color** to establish importance
- **Limited color usage** to create focus points
- **Interactive elements** immediately recognizable

### 3. Motion & Micro-interactions
- **Subtle transitions** for all state changes (`duration-200`)
- **Motion guides attention** and provides feedback
- **Fast animations** (200-300ms for most transitions)
- **Avoid excessive movement** - keep it purposeful

## Brand Colors

### Primary Brand Colors
- **Purple**: `#5E3989` (refuge-purple) - Primary actions, main brand color
- **Magenta**: `#A90533` (refuge-magenta) - Important/destructive actions, emphasis
- **Light Purple**: `#8A6FAD` (refuge-light-purple) - Accent color

### Style Guide Color Variations
- **Purple Light**: `#7B4FA2` (refuge-purple-light) - Hover states, dark mode
- **Purple Dark**: `#4A2C6E` (refuge-purple-dark) - Active states
- **Magenta Light**: `#C41E3A` (refuge-magenta-light) - Dark mode visibility
- **Magenta Dark**: `#8B0228` (refuge-magenta-dark) - Active states

### Usage Guidelines
- **Primary Actions**: Use refuge-purple
- **Destructive/Important**: Use refuge-magenta
- **Success**: Use green-600 / green-400
- **Warning**: Use amber-600 / amber-400
- **Info**: Use sky-600 / sky-400

## Typography System

### Font Stack
- **Sans**: 'Inter', system-ui, -apple-system, sans-serif
- **Mono**: 'JetBrains Mono', 'Fira Code', monospace

### Type Scale
- **Display**: `text-6xl` to `text-8xl` (Hero sections only)
- **H1**: `text-4xl md:text-5xl font-bold`
- **H2**: `text-3xl md:text-4xl font-semibold`
- **H3**: `text-2xl md:text-3xl font-semibold`
- **H4**: `text-xl md:text-2xl font-medium`
- **Body**: `text-base leading-relaxed` (16px)
- **Small**: `text-sm` for secondary information
- **Tiny**: `text-xs` for metadata/labels

### Text Colors
- **Primary**: `text-slate-900 dark:text-slate-100`
- **Secondary**: `text-slate-600 dark:text-slate-400`
- **Muted**: `text-slate-500 dark:text-slate-500`
- **Brand Accent**: `text-refuge-purple dark:text-refuge-purple-light`
- **Interactive**: `text-refuge-purple hover:text-refuge-purple-dark`

## Component Patterns

### Cards
\`\`\`tsx
// Default Card
className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6"

// Interactive Card
className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer hover:border-refuge-purple/20"

// Elevated Card
className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6"
\`\`\`

### Buttons
\`\`\`tsx
// Primary Button
className="px-4 py-2 bg-refuge-purple hover:bg-refuge-purple-dark text-white font-medium rounded-lg transition-all duration-200 active:scale-95 transform shadow-sm hover:shadow-md"

// Secondary Button
className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium rounded-lg transition-colors duration-200"

// Ghost Button
className="px-4 py-2 hover:bg-refuge-purple/10 text-refuge-purple dark:text-refuge-purple-light font-medium rounded-lg transition-colors duration-200"

// Danger Button
className="px-4 py-2 bg-refuge-magenta hover:bg-refuge-magenta-dark text-white font-medium rounded-lg transition-all duration-200 active:scale-95 transform"
\`\`\`

### Form Elements
\`\`\`tsx
// Input Field
className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-refuge-purple focus:border-transparent transition-all duration-200"

// Label
className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
\`\`\`

**⚠️ IMPORTANT: Dark Mode Awareness for Forms**
- **ALWAYS ensure forms are dark mode aware** - Forms are frequently used on iPads which may be in dark mode
- Use theme-aware classes instead of hardcoded colors:
  - `text-gray-700` → `text-foreground` or `text-card-foreground`
  - `text-gray-500/600` → `text-muted-foreground`
  - `bg-white` → `bg-card`
  - `bg-gray-100/50` → `bg-muted`
  - `bg-gray-200` → `bg-secondary`
- For colored alerts/badges, always include dark mode variants:
  - `bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800`
  - `text-yellow-800 dark:text-yellow-200`
- Test all forms in both light and dark mode before deployment

### Navigation
\`\`\`tsx
// Nav Link
className="text-slate-600 hover:text-refuge-purple dark:text-slate-400 dark:hover:text-refuge-purple-light transition-colors duration-200 font-medium"

// Active Nav Link
className="text-refuge-purple dark:text-refuge-purple-light font-semibold"
\`\`\`

### Badges
\`\`\`tsx
// Default Badge
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"

// Purple Badge
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-refuge-purple/10 text-refuge-purple dark:bg-refuge-purple/20 dark:text-refuge-purple-light"

// Magenta Badge
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-refuge-magenta/10 text-refuge-magenta dark:bg-refuge-magenta/20 dark:text-refuge-magenta-light"
\`\`\`

## Layout Patterns

### Container
\`\`\`tsx
className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
\`\`\`

### Section Spacing
\`\`\`tsx
className="py-12 md:py-16 lg:py-20"
\`\`\`

### Grid Systems
\`\`\`tsx
// Card Grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

// Feature Grid
className="grid grid-cols-1 md:grid-cols-2 gap-8"
\`\`\`

## Color Palette Reference

### Light Mode
- **Background**: `white`
- **Foreground**: `rgb(15, 23, 42)` (slate-900)
- **Card**: `white`
- **Muted**: `rgb(248, 250, 252)` (slate-50)
- **Border**: `rgb(226, 232, 240)` (slate-200)

### Dark Mode
- **Background**: `rgb(2, 6, 23)` (slate-950)
- **Foreground**: `rgb(248, 250, 252)` (slate-50)
- **Card**: `rgb(15, 23, 42)` (slate-900)
- **Muted**: `rgb(30, 41, 59)` (slate-800)
- **Border**: `rgb(30, 41, 59)` (slate-800)

## Best Practices

### Consistency
- Use predefined patterns throughout the app
- Maintain consistent spacing and sizing
- Apply the same interaction patterns

### Accessibility
- Maintain WCAG AA contrast ratios (4.5:1 for normal text)
- Ensure interactive elements are clearly identifiable
- Provide proper focus states

### Responsive Design
- Always consider mobile-first approach
- Use responsive variants (`md:`, `lg:`, etc.)
- Test on multiple screen sizes

### Performance
- Use Tailwind's purge to remove unused styles
- Optimize for fast loading and smooth interactions

### Brand Identity
- Purple (#5E3989) for primary actions
- Magenta (#A90533) for important/destructive actions
- Maintain brand consistency across all components

## Example Implementation

\`\`\`tsx
// Modern Card Component Example
<div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 hover:shadow-md transition-all duration-200 hover:border-refuge-purple/20">
  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
    Card Title
  </h3>
  <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
    Card description text goes here with proper spacing and readability.
  </p>
  <button className="px-4 py-2 bg-refuge-purple hover:bg-refuge-purple-dark text-white font-medium rounded-lg transition-all duration-200 active:scale-95 transform shadow-sm hover:shadow-md">
    Take Action
  </button>
</div>
\`\`\`

This style guide should be referenced for all future component development to ensure consistency across the Refuge House application.
