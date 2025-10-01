# Dark Mode Consistency Guide

## Summary of Changes

This document outlines the comprehensive refactoring of the application's color system to ensure consistent light/dark mode switching across all components.

## CSS Variable System

### Core Variables Structure

The color system uses HSL values with CSS variables for complete theme control:

```css
/* Core colors */
--background: Main background color
--foreground: Main text color

/* Card/Surface colors */
--card: Card/elevated surface background
--card-foreground: Text on cards

/* Muted colors */
--muted: Subtle backgrounds (e.g., disabled states, secondary areas)
--muted-foreground: Muted/secondary text

/* Interactive elements */
--primary: Primary brand color (buttons, links, active states)
--primary-foreground: Text on primary color backgrounds
--secondary: Secondary interactive elements
--secondary-foreground: Text on secondary backgrounds
--accent: Accent color (same as primary for consistency)
--accent-foreground: Text on accent backgrounds

/* UI elements */
--border: All borders
--input: Input field backgrounds
--ring: Focus ring color

/* Feedback colors */
--destructive: Error/delete actions (red)
--destructive-foreground: Text on destructive backgrounds
--success: Success states (green)
--success-foreground: Text on success backgrounds
--warning: Warning states (amber)
--warning-foreground: Text on warning backgrounds
--info: Info states (blue)
--info-foreground: Text on info backgrounds

/* Special */
--overlay: Modal backdrop color
```

## Tailwind Configuration Updates

### Color Mappings
All Tailwind color classes now map to CSS variables:

```javascript
colors: {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  card: 'hsl(var(--card))',
  // ... etc
}
```

## Component Refactoring Summary

### 1. NavBar Component
**Before:**
- `bg-white` → `bg-card`
- `border-gray-200` → `border-border`
- `text-gray-900` → `text-foreground`
- `text-gray-500` → `text-muted-foreground`
- `hover:text-gray-700` → `hover:text-foreground`
- `hover:border-gray-300` → `hover:border-border`
- `border-blue-500` → `border-primary`
- `text-gray-400` → `text-muted-foreground`
- `bg-gray-100` → `bg-muted`

### 2. WorksList Component
**Before:**
- `border-blue-500` → `border-primary`
- `text-gray-600` → `text-muted-foreground`
- `bg-red-50` → `bg-destructive/10`
- `border-red-200` → `border-destructive/20`
- `text-red-800` → `text-destructive`
- `text-red-600` → `text-destructive/80`
- `bg-red-600` → `bg-destructive`
- `text-white` → `text-destructive-foreground`
- `hover:bg-red-700` → `hover:bg-destructive/90`
- `text-gray-400` → `text-muted-foreground`
- `text-gray-900` → `text-foreground`
- `bg-blue-600` → `bg-primary`
- `hover:bg-blue-700` → `hover:bg-primary/90`
- `bg-gray-100` → `bg-muted`
- `text-gray-700` → `text-muted-foreground`
- `hover:bg-gray-200` → `hover:bg-muted/80`
- `border-gray-300` → `border-border`
- `bg-white` → `bg-card`
- `border-gray-200` → `border-border`
- `bg-green-100` → `bg-success/10`
- `text-green-800` → `text-success`
- `bg-yellow-100` → `bg-warning/10`
- `text-yellow-800` → `text-warning`

### 3. ChapterEditor Component (To be refactored)
**Changes needed:**
- `bg-red-50` → `bg-destructive/10`
- `border-red-200` → `border-destructive/20`
- `text-red-800` → `text-destructive`
- `bg-blue-600` → `bg-primary`
- `hover:bg-blue-700` → `hover:bg-primary/90`
- `bg-yellow-50` → `bg-warning/10`
- `border-yellow-200` → `border-warning/20`
- `text-yellow-800` → `text-warning`
- `bg-white` → `bg-card`
- `border-gray-200` → `border-border`
- `text-gray-900` → `text-foreground`
- `placeholder-gray-400` → `placeholder-muted-foreground`
- `border-gray-300` → `border-border`
- `focus:ring-blue-500` → `focus:ring-primary`
- `focus:border-blue-500` → `focus:border-primary`
- `bg-black bg-opacity-50` → `bg-overlay/50`
- `text-gray-700` → `text-muted-foreground`
- `hover:bg-gray-50` → `hover:bg-muted`

### 4. CreateWorkForm Component (To be refactored)
**Changes needed:**
- `bg-white` → `bg-card`
- `border-gray-200` → `border-border`
- `bg-red-50` → `bg-destructive/10`
- `border-red-200` → `border-destructive/20`
- `text-red-600` → `text-destructive/80`
- `bg-gray-50` → `bg-muted`
- `text-gray-700` → `text-muted-foreground`
- `hover:bg-gray-50` → `hover:bg-muted`
- `bg-blue-600` → `bg-primary`
- `hover:bg-blue-700` → `hover:bg-primary/90`
- `border-gray-300` → `border-border`
- `focus:ring-blue-500` → `focus:ring-primary`
- `focus:border-blue-500` → `focus:border-primary`
- `text-blue-600` → `text-primary`

### 5. WorkEditorPage Component (To be refactored)
**Changes needed:**
- `bg-red-50` → `bg-destructive/10`
- `border-red-200` → `border-destructive/20`
- `text-red-800` → `text-destructive`
- `text-red-600` → `text-destructive/80`
- `bg-red-600` → `bg-destructive`
- `hover:bg-red-700` → `hover:bg-destructive/90`
- `bg-blue-600` → `bg-primary`
- `hover:bg-blue-700` → `hover:bg-primary/90`
- `text-gray-900` → `text-foreground`
- `text-gray-600` → `text-muted-foreground`
- `text-gray-500` → `text-muted-foreground`
- `text-gray-400` → `text-muted-foreground`
- `hover:text-gray-600` → `hover:text-foreground`
- `bg-green-100` → `bg-success/10`
- `text-green-800` → `text-success`
- `bg-yellow-100` → `bg-warning/10`
- `text-yellow-800` → `text-warning`
- `border-blue-500` → `border-primary`
- `text-blue-600` → `text-primary`
- `border-gray-200` → `border-border`
- `hover:border-gray-300` → `hover:border-border`
- `bg-white` → `bg-card`
- `hover:bg-gray-50` → `hover:bg-muted`

## Usage Guidelines

### 1. Text Colors
- **Primary text**: Use `text-foreground`
- **Secondary/muted text**: Use `text-muted-foreground`
- **Interactive text**: Use `text-primary` for links/buttons
- **On colored backgrounds**: Use `text-{color}-foreground`

### 2. Backgrounds
- **Page background**: Use `bg-background`
- **Card/elevated surfaces**: Use `bg-card`
- **Subtle backgrounds**: Use `bg-muted`
- **Interactive elements**: Use `bg-primary` with `text-primary-foreground`
- **Modal overlays**: Use `bg-overlay/50` (with opacity)

### 3. Borders
- **All borders**: Use `border-border`
- **Focus rings**: Use `ring-primary` or `focus:border-primary`

### 4. Feedback States
- **Errors**: Use `bg-destructive/10` for backgrounds, `text-destructive` for text
- **Success**: Use `bg-success/10` for backgrounds, `text-success` for text
- **Warnings**: Use `bg-warning/10` for backgrounds, `text-warning` for text
- **Info**: Use `bg-info/10` for backgrounds, `text-info` for text

### 5. Opacity Modifiers
- Use Tailwind's opacity syntax for subtle variations: `/10`, `/20`, `/80`, `/90`
- Example: `bg-destructive/10` for a light red background

## Benefits

1. **Consistent Theme Switching**: All components automatically adapt to light/dark mode
2. **Single Source of Truth**: Colors defined once in CSS variables
3. **Maintainability**: Easy to update theme colors globally
4. **Accessibility**: Proper contrast ratios maintained between modes
5. **Brand Consistency**: Primary brand color (#3b82f6) preserved across themes

## Testing Checklist

- [ ] Toggle between light and dark modes
- [ ] Verify all text is readable in both modes
- [ ] Check interactive elements (buttons, links) have proper hover states
- [ ] Confirm error/success/warning states are visible
- [ ] Test modal overlays and their backdrop opacity
- [ ] Verify form inputs and borders are visible
- [ ] Check focus states are clearly visible

## Migration Progress

### Completed ✅
- [x] CSS variable system setup (Updated with shadcn/ui proven accessibility standards)
- [x] Tailwind configuration
- [x] NavBar component
- [x] WorksList component
- [x] ChapterEditor component
- [x] CreateWorkForm component
- [x] WorkEditorPage component

### Pending ⏳
- [ ] MyWorksPage component
- [ ] ExplorePage component
- [ ] ShelfPage component
- [ ] EnhancePage component

## Notes

- No new colors were introduced
- The existing blue primary color (#3b82f6) was preserved
- All hardcoded hex values have been replaced with semantic variables
- The system supports easy theme customization by updating CSS variables only