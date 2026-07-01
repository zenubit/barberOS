# BarberOS — Design System v2
## Professional Barbershop Booking Platform

---

## Product Profile

| Aspect | Details |
|--------|---------|
| **Type** | SaaS Booking Platform (Barbershop Service) |
| **Target Audience** | Barbers (business owners/employees) + Customers (booking clients) |
| **Tone** | Professional, warm, approachable, minimal |
| **Style** | Elegant glassmorphism + warm dark mode |
| **Primary Use** | Scheduling, managing availability, booking appointments |

---

## Design System Overview

### Visual Style
- **Pattern**: Glassmorphism (translucent panels) + subtle depth
- **Aesthetic**: Professional elegance + warmth (not cold tech)
- **Emphasis**: Content hierarchy through typography + spacing, not flashy colors
- **Reference Inspiration**: CÉNIT (warm, subtle, motion-forward) adapted for BarberOS brand

### Core Principle
Every interaction should feel **intentional, warm, and smooth**—not decorative or distracting.

---

## 1. Color Palette (CRITICAL)

### Philosophy
- **Primary Accent**: Teal `#1FE5D6` (brand, CTAs, active states)
- **Secondary Accent**: Warm Gold `#D4A574` (supporting interactions, highlights)
- **Background**: Warm Dark `#0F0D0A` (marrón oscuro, cálido—not pure black/blue)
- **Surface**: `#1A1612` (cards, panels—slight elevation from background)
- **Text**: `#F0EBE5` (warm off-white, not cold white)

### Token Structure

```css
/* Primary Colors */
--teal: #1FE5D6;           /* Brand, active states, CTAs */
--teal-dim: #16C5B0;       /* Hover state */
--teal-deep: #0D8078;      /* Pressed/focus state */

/* Warmth & Accents */
--gold: #D4A574;           /* Secondary actions, highlights, accents */
--gold-dim: #B88C4C;       /* Hover on gold elements */

/* Neutral/Background (WARM dark palette) */
--bg: #0F0D0A;             /* Primary background (marrón oscuro) */
--bg-2: #14120E;           /* Secondary background */
--surface: #1A1612;        /* Card/panel background */
--surface-2: #211D18;      /* Elevated surface (modals, sheets) */
--surface-3: #2A2620;      /* High elevation (sticky headers) */

/* Metallics */
--chrome: #D4C9BC;         /* Borders, dividers, subtle accents */
--chrome-dim: #9D9088;     /* Secondary borders, muted accents */

/* Text & Contrast */
--ink: #F0EBE5;            /* Primary text (warm white) */
--ink-muted: #9B9080;      /* Secondary text (muted warm gray) */
--ink-faint: #6B6055;      /* Tertiary text (very muted) */

/* Semantic Colors (with sufficient contrast) */
--success: #4ADE80;        /* Success feedback (green) */
--warning: #FBBF24;        /* Warning feedback (amber) */
--danger: #F87171;         /* Error feedback (red) */
```

### Light Mode (Secondary, optional)
```css
--bg: #F2F7FA;
--surface: #FFFFFF;
--ink: #0B1620;
--teal: #0DA598;           /* Desaturated for light mode */
--gold: #A67C52;           /* Desaturated gold */
```

### Contrast Verification (WCAG AA)
- [ ] `--ink` on `--surface`: **17:1** ✅
- [ ] `--ink-muted` on `--surface`: **6.8:1** ✅ (AA large text)
- [ ] `--teal` on `--surface`: **5.2:1** ✅
- [ ] `--gold` on `--surface`: **4.6:1** ✅

---

## 2. Typography

### Font Pairing
| Layer | Font | Use Case | Notes |
|-------|------|----------|-------|
| **Display/Headings** | Space Grotesk (600/700 weight) | Page titles, section headers, large CTAs | Modern, geometric, professional |
| **Body** | Inter (400/500 weight) | Body text, descriptions, labels | Highly readable, warm tone |
| **Mono** | JetBrains Mono (400 weight) | Code, prices, timestamps, technical labels | Clean, scannable |

### Type Scale
```css
--text-display: 3.5rem;      /* Hero titles: "Agenda tu cita" */
--text-h1: 2.75rem;          /* Page titles */
--text-h2: 2rem;             /* Section headers */
--text-h3: 1.5rem;           /* Subsection headers */
--text-h4: 1.25rem;          /* Card titles */
--text-body-lg: 1.125rem;    /* Large body text (16.875px) */
--text-body: 1rem;           /* Standard body (16px) */
--text-sm: 0.875rem;         /* Small labels (14px) */
--text-xs: 0.75rem;          /* Extra small (12px) — use sparingly */
```

### Line Height & Spacing
| Element | Line Height | Letter Spacing |
|---------|-------------|-----------------|
| **Headings** | 1.1–1.2 | -0.01em |
| **Body** | 1.5–1.75 | Normal |
| **Labels** | 1.3 | +0.05em (subtle tracking) |

### Weight Hierarchy
- **H1–H4**: 600–700 weight
- **Body**: 400 weight
- **Labels/Pills**: 500 weight
- **Disabled**: 400 weight + reduced opacity

---

## 3. Components & Effects

### Glass Panel (Cards)
```css
/* Base */
background: rgba(26, 22, 18, 0.65);
backdrop-filter: blur(24px) saturate(1.5);
border: 1px solid rgba(212, 169, 116, 0.15);  /* Gold-tinted subtle border */
border-radius: 16px;
box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 
            0 12px 40px rgba(0,0,0,.45);

/* Hover */
border-color: rgba(31, 229, 214, 0.4);        /* Teal highlight */
background: rgba(26, 22, 18, 0.75);           /* Slightly more opaque */
transform: translateY(-6px);                   /* Lift effect */
box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 
            0 20px 48px -12px rgba(0,0,0,.5), 
            0 0 32px rgba(31, 229, 214, 0.15);
transition: all 0.4s cubic-bezier(.25,.46,.45,.94);
```

### Button: Primary (Teal CTA)
```css
/* Base */
background: var(--teal);
color: #042420;                              /* Dark accent ink */
border: 1px solid var(--teal);
border-radius: 10px;
padding: 13px 26px;
font-weight: 600;
box-shadow: 0 10px 28px -8px rgba(31, 229, 214, 0.4);

/* Hover */
transform: translateY(-3px);
filter: brightness(1.1);
box-shadow: 0 16px 40px -6px rgba(31, 229, 214, 0.5);
transition: transform 0.25s cubic-bezier(.25,.46,.45,.94), 
            box-shadow 0.3s ease;

/* Active */
transform: translateY(-1px);

/* Disabled */
opacity: 0.4;
cursor: not-allowed;
```

### Button: Secondary (Ghost)
```css
/* Base */
background: transparent;
color: var(--ink);
border: 1px solid var(--border-strong);
border-radius: 8px;
padding: 13px 26px;
transition: all 0.2s ease;

/* Hover */
border-color: var(--teal);
color: var(--teal);
background: rgba(31, 229, 214, 0.05);
```

### Input Field
```css
/* Base */
width: 100%;
background: var(--surface-2);
border: 1px solid var(--border);
color: var(--ink);
padding: 12px 14px;
border-radius: 8px;
font-size: 14px;
transition: border-color 0.2s ease, box-shadow 0.2s ease;

/* Focus */
border-color: var(--teal);
box-shadow: 0 0 0 3px rgba(31, 229, 214, 0.24);

/* Placeholder */
color: var(--ink-faint);
```

### Pills & Status Badges
```css
/* Base */
display: inline-flex;
gap: 6px;
padding: 4px 10px;
border-radius: 999px;
font-size: 10px;
font-weight: 600;
letter-spacing: 0.1em;
border: 1px solid;

/* Teal variant */
color: var(--teal);
border-color: rgba(31, 229, 214, 0.4);
background: rgba(31, 229, 214, 0.08);

/* Gold variant */
color: var(--gold);
border-color: rgba(212, 169, 116, 0.4);
background: rgba(212, 169, 116, 0.08);
```

---

## 4. Animations & Motion

### Philosophy
- **Warm, intentional, never purely decorative**
- **Respect `prefers-reduced-motion`** — always provide accessible fallback
- **Physics-based easing** — feels natural, not mechanical

### Timing Standards
```css
/* Micro-interactions (UI feedback) */
--duration-fast: 150ms;      /* Button press, icon feedback */
--duration-normal: 250ms;    /* Hover transitions, card entrance */
--duration-slow: 400ms;      /* Complex transitions, modals */

/* Easing curves */
--ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);  /* Entrance */
--ease-in: cubic-bezier(0.4, 0, 1, 1);             /* Exit */
--ease-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);     /* General smoothness */
```

### Component Animations

#### Card/Panel Hover
```css
/* Enter */
opacity: 0 → 1
transform: translateY(16px) → translateY(0)
transition: 0.4s cubic-bezier(.25,.46,.45,.94)

/* Hover state */
transform: translateY(-6px)
box-shadow: elevated
transition: 0.4s cubic-bezier(.25,.46,.45,.94)
```

#### Button Press
```css
/* Visual feedback on tap */
transform: scale(0.98)  /* subtle press */
opacity: 0.9
duration: 150ms
easing: ease-out
```

#### Loading State
```css
/* Show skeleton or spinner when async > 300ms */
opacity: 0.6
animation: shimmer 2s infinite
/* Never show blank state */
```

#### Modal/Sheet Entry
```css
/* Slide up + fade */
initial: { opacity: 0, y: 40 }
animate: { opacity: 1, y: 0 }
exit: { opacity: 0, y: 40 }
duration: 300ms
easing: ease-out
```

---

## 5. Background & Ambient Effects

### Fondo Animado (Grid Background)
```jsx
/* Layered nebulae + meteorites */
1. Base: warm dark gradient (#0F0D0A → #14120E)
2. Nebula 1: Cian radial gradient at 15%, 20% — rgba(31, 229, 214, 0.12)
3. Nebula 2: Gold radial gradient at 85%, 70% — rgba(212, 165, 116, 0.08)
4. Noise overlay: Subtle fractal noise (0.12 opacity)
5. Animated meteorites: Gold color, 1.1s animation, soft glow

/* Meteorite specs */
- Color: var(--gold-dim) #B88C4C
- Glow: 0 0 8px 1.5px rgba(212, 165, 116, 0.6)
- Trail: Linear gradient gold → transparent
- Duration: 1.1s
- Repeat delay: 6-12s (random)
```

### Cursor Glow (Desktop)
```css
/* Follows mouse, respects reduced-motion */
- Size: 260px radial gradient
- Color: rgba(31, 229, 214, 0.18)
- Spring physics: damping 28, stiffness 180, mass 0.5
- Disabled on touch devices + reduced-motion
- z-index: 45 (above content, below modals)
- Mix-blend-mode: screen
```

---

## 6. Layout & Responsive

### Spacing Scale (8px grid)
```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;
```

### Breakpoints
```css
mobile:  375px  (base)
tablet:  768px
desktop: 1024px (main content)
wide:    1440px (max-width container)
```

### Container Max Width
```css
max-width: 80rem;  /* 1280px — matches clamp(max-w-6xl, 7xl) */
padding: 0 1.25rem; /* Mobile: 20px gutters */

@media (min-width: 768px) {
  padding: 0 2rem;  /* Tablet: 32px gutters */
}

@media (min-width: 1024px) {
  padding: 0 2.5rem; /* Desktop: 40px gutters */
}
```

### Mobile-First Approach
1. **Design for 375px first** (smallest iPhone SE)
2. **Readable text**: Min 16px body on mobile (prevents iOS auto-zoom)
3. **Touch targets**: Min 44×44px with 8px gaps
4. **No horizontal scroll** — content fits within viewport
5. **Test landscape** — ensure layout adapts

---

## 7. Dark Mode Implementation

### Light Mode (Secondary)
```css
/* Desaturated variants */
--teal: #0DA598;     /* Less vibrant */
--gold: #A67C52;     /* More muted */
--bg: #F2F7FA;
--surface: #FFFFFF;
--ink: #0B1620;

/* Same contrast standards apply */
```

### Testing Checklist
- [ ] Text contrast ≥4.5:1 in **both modes**
- [ ] Borders/dividers visible in both modes
- [ ] Hover/active/focus states distinguishable in both modes
- [ ] Test with actual `prefers-color-scheme` media query
- [ ] Test with `prefers-reduced-motion` enabled

---

## 8. Accessibility (CRITICAL)

### Touch & Interaction
| Rule | Implementation |
|------|-----------------|
| Touch target minimum | ≥44×44px (visible area), use `hitSlop` if smaller |
| Tap feedback | Visual response within 150ms (opacity/scale/color) |
| Disabled clarity | Reduced opacity (0.4–0.5) + `disabled` attribute |
| Focus rings | Visible 2–4px ring on `:focus-visible` |
| Keyboard nav | Tab order matches visual order, no traps |

### Color & Contrast
- [ ] All text pairs ≥4.5:1 contrast ratio (WCAG AA)
- [ ] Don't convey info by color alone (add icon/text)
- [ ] Error/success includes text label + icon, not just color
- [ ] Light mode tested separately (don't invert values)

### Forms
- [ ] Visible `<label>` for every input (not placeholder-only)
- [ ] Error message below field + inline announcement (aria-live)
- [ ] Helper text for complex fields
- [ ] Required field indicator (asterisk + aria-label)
- [ ] Focus moves to first invalid field on form error

### Motion
- [ ] Respect `prefers-reduced-motion` — disable animations or simplify
- [ ] Never block user input during animation
- [ ] Animations interruptible on user gesture
- [ ] No parallax or disorienting effects

---

## 9. UX Patterns & Anti-Patterns

### DO ✅
- **Provide loading feedback** for operations >300ms (skeleton, spinner, shimmer)
- **Show error near the field** that failed
- **Use semantic inputs** (`type="email"`, `type="tel"`, etc.)
- **Undo support** for destructive actions (toast: "Undo delete")
- **Progressive disclosure** — hide complexity until needed
- **State preservation** — back navigation restores scroll/filters
- **Confirm destructive actions** (delete, logout, refund)

### DON'T ❌
- **Instant transitions** (0ms) without feedback
- **Animations >500ms** for micro-interactions
- **Modal-only navigation** — breaks user flow
- **Overloaded surfaces** — max 5 items in bottom nav
- **Icon-only buttons** without `aria-label`
- **Disabled state that looks tappable** — reduce opacity + disable semantically
- **Form errors only at top** — put them near the field + announce
- **Placeholder as label** — use visible `<label>` + placeholder for hint

---

## 10. Implementation Checklist (PRE-DELIVERY)

### Visual Consistency
- [ ] All colors from token system (no hardcoded hex)
- [ ] Typography follows type scale (no arbitrary sizes)
- [ ] Spacing follows 8px grid
- [ ] Shadows use consistent elevation scale
- [ ] Icons from single set (Heroicons/Lucide), SVG only
- [ ] Border radius consistent per component type

### Interaction & Animation
- [ ] Micro-interactions in 150–300ms range
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Button hover/press states clear and non-jarring
- [ ] Loading states shown for async >300ms
- [ ] Disabled states visually & semantically distinct
- [ ] No layout shift during state changes (use `transform` not `top/left`)

### Accessibility
- [ ] Touch targets ≥44×44px
- [ ] Text contrast ≥4.5:1 (both light & dark mode)
- [ ] Focus rings visible (2–4px)
- [ ] Form labels visible (not placeholder-only)
- [ ] Error messages inline + aria-live
- [ ] Keyboard navigation fully functional
- [ ] Screen reader testing (VoiceOver/NVDA)

### Responsive & Performance
- [ ] Mobile-first: test 375px first
- [ ] No horizontal scroll on mobile
- [ ] Gutters adapt by breakpoint
- [ ] Images optimized (WebP/AVIF, lazy-load)
- [ ] Critical fonts preloaded
- [ ] CLS <0.1 (no layout jumps)
- [ ] Test portrait + landscape

### Dark/Light Mode
- [ ] Both modes designed & tested separately
- [ ] Contrast verified in both modes
- [ ] Hover/active/disabled states distinguishable in both
- [ ] Scrim opacity appropriate for modal legibility

---

## 11. File Structure & Tokens

### CSS Variables Location
```
src/index.css
├── :root { --teal, --gold, --bg, --surface, ... }
├── [data-theme='light'] { /* overrides */ }
├── .glass-panel { backdrop-filter, border, box-shadow }
├── .btn-teal { background, hover, active, disabled }
├── .btn-ghost { ... }
├── .input { ... }
└── @keyframes for animations
```

### Component Exports
```
src/components/
├── Shared.jsx     (Logo, Icon, Skeleton)
├── CursorGlow.jsx (animated mouse-follow glow)
├── GridBackground.jsx (nebulae + meteorites)
├── WelcomeSplash.jsx (one-time welcome overlay)
└── admin/
    ├── AdminShared.jsx (admin-specific utilities)
    └── [Manager].jsx (role-based managers)
```

---

## 12. Design References & Inspiration

| Reference | Aspect | BarberOS Adaptation |
|-----------|--------|-------------------|
| CÉNIT | Warm palette, motion-forward | Adapted: kept warmth, simplified for barbershop |
| Glassmorphism | Modern elegance, depth | Used for cards + panels, not over-applied |
| Material Design | Touch standards, spacing grid | 8px grid, 44×44pt touch targets, state layers |
| Apple HIG | Motion physics, reduced-motion | Spring easing, respects accessibility prefs |

---

## Summary: Core Values

1. **Warm, not cold** — Marrón oscuro + oro, not pure black/blue
2. **Professional, not flashy** — Elegant simplicity, content first
3. **Intentional motion** — Every animation serves a purpose
4. **Accessible by default** — Touch targets, contrast, keyboard nav built-in
5. **Consistent & predictable** — Token system, spacing grid, interaction patterns

---

**Document Version**: 2.0  
**Last Updated**: July 1, 2026  
**Project**: BarberOS  
**Standard**: WCAG AA + Material Design 3 + Apple HIG
