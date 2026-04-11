# Language-Responsive Button Sizing

## Overview
Buttons and badges in PitStop change their size when switching between languages (FR, EN, NL) due to varying text lengths. This document describes the solution implemented to maintain consistent sizing.

## Text Length Variations

### Navbar Elements
- **"Diagnostic"** (10 chars) → "Diagnostics" (11 chars) → "Diagnose" (8 chars)
- **"Vente"** (5 chars) → "Sale" (4 chars) → "Verkoop" (7 chars)
- **"Phase de test"** (13 chars) → "Testing phase" (13 chars) → "Testfase" (8 chars)
- **"Bientôt"** (7 chars) → "Soon" (4 chars) → "Binnenkort" (10 chars)

### Form Elements
- **"Analyser mon véhicule"** (21 chars) → "Analyse my vehicle" (18 chars) → "Mijn voertuig analyseren" (24 chars)
- **"Analyse en cours..."** (19 chars) → "Analysing..." (12 chars) → "Bezig met analyseren..." (23 chars)

### Guest Diagnostic Gate
- **"Diagnostic invité gratuit"** (24 chars) → "Free guest diagnostic" (21 chars) → "Gratis gastdiagnose" (19 chars)
- **"Me connecter"** (11 chars) → "Sign in" (7 chars) → "Aanmelden" (9 chars)
- **"Connexion ou inscription"** (23 chars) → "Sign in or register" (19 chars) → "Aanmelden of registreren" (24 chars)

## Solution Implemented

### 1. **Tab Navigation** (`components/navbar.tsx`)
```tsx
const tabBase = "... min-w-[5rem] ..." // Added minimum width constraint
```
- Added `min-w-[5rem]` to ensure tabs maintain consistent width regardless of text length

### 2. **Phase Test Badge** (`components/navbar.tsx`)
```tsx
<span className="... h-6 min-w-[4.5rem] ...">
```
- Added fixed `h-6` and `min-w-[4.5rem]` for consistent sizing

### 3. **Diagnostic Page Badge** (`components/diagnostic-page-content.tsx`)
```tsx
<div className="... min-h-[2rem] min-w-[15rem] sm:min-w-[18rem] ...">
```
- Added minimum height and width constraints
- Responsive: larger on desktop (`sm:min-w-[18rem]`)

### 4. **Submit Button (Analysis)** (`components/vehicle-form.tsx`)
```tsx
<Button className="... min-h-12 ...">
```
- Added `min-h-12` to maintain consistent button height

### 5. **Navbar Action Buttons** (`components/navbar.tsx`)
```tsx
{/* Buy Button */}
<Button size="sm" className="... min-w-[4rem] ...">

{/* Login Button */}
<Button size="sm" className="... min-h-8 ...">
```

### 6. **Guest Gate Dialog Buttons** (`components/diagnostic-guest-gate.tsx`)
```tsx
<Button className="... min-h-10">
<Button variant="outline" className="... min-h-10">
```
- Added `min-h-10` to all dialog action buttons

## Best Practices for Future Updates

### When Adding New Buttons/Badges:
1. **Identify variable-length text elements**: Look for buttons/badges with `t()` translation calls
2. **Add size constraints**:
   - Use `min-w-[Xrem]` for width constraints
   - Use `min-h-[Xrem]` for height constraints
   - Use `whitespace-nowrap` to prevent text wrapping
3. **Test with all languages**: Switch between FR, EN, NL in the language switcher
4. **Consider responsive design**: Add breakpoints if needed (e.g., `sm:min-w-[18rem]`)

### CSS Classes to Use:
```
// For buttons
min-h-10      // Medium buttons
min-h-12      // Large buttons
min-w-[4rem]  // Small width constraint
min-w-[5rem]  // Medium width constraint

// For badges
h-6 min-w-[4.5rem]  // Standard badge
```

## Testing Checklist
- [ ] Switch to FR, EN, NL and verify button sizes remain constant
- [ ] Check navbar tabs alignment
- [ ] Verify diagnostic page badge width
- [ ] Test guest gate dialog button sizes
- [ ] Test form submit button height
- [ ] Verify responsive behavior on mobile/tablet

## Future Improvements
Consider implementing:
- CSS custom properties for consistent sizing across the app
- A global button size utility class
- Automated testing for language-responsive sizing
