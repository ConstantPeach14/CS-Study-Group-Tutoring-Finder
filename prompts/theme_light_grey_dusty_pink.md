# Implementation Prompt: Project-Wide Visual Theme — Light Grey + Dusty Pink / Light Pink

## Objective
Update the complete application's visual colour theme to strictly **Light Grey and Dusty Pink / Light Pink**, completely removing **Green** and **White** across every component, layout, card, button, badge, input, and page in the project.

---

## 1. Palette & Design Token System

Strictly enforce two colour families throughout the entire application:

### A. Light Grey (Neutral Surfaces, Structure, Backgrounds & Text)
- **Page Background**: Light Grey (`#e8edf2` / `#eceff4`)
- **Card & Elevated Surfaces**: Soft Light Grey (`#f1f4f8` / `#e2e8f0`)
- **Subtle / Inset Surfaces**: Muted Light Grey (`#dce3ec` / `#d8e0ea`)
- **Borders & Dividers**: Mid Light Grey (`#cbd5e1` / `#b0bec5`)
- **Primary Text**: Deep Slate / Dark Grey (`#0f172a` / `#1e293b`) for maximum readability on light grey
- **Secondary / Muted Text**: Slate Grey (`#475569` / `#64748b`)
- **Input Surfaces**: Clean Light Grey (`#f4f7fa`) with Mid Grey borders (`#cbd5e1`) and Dark Grey text (`#0f172a`)

### B. Dusty Pink & Light Pink (Primary Accents, Badges, Links, Actions & Focus)
- **Primary Accent / Brand**: Dusty Pink (`#d88299`)
- **Hover Action**: Deeper Dusty Pink (`#c46982`)
- **Active / Pressed Action**: Rich Dusty Pink (`#a8526a`)
- **Light Pink Pill / Badge Background**: Soft Light Pink (`#fce7ec` / `#f8d7df`)
- **Pink Border**: Subtle Dusty Pink (`#e89aae` / `#d47b93`)
- **Accent Text & Headings**: Deep Dusty Pink (`#9c4f65` / `#80384d`) for strong contrast on light surfaces
- **Status & Indicators**: Dusty Pink / Light Pink (replacing all previous green and purple badges)

### C. Strict Removals
- **Zero Green**:
  - Replace all green pills, checkmarks, open status badges, accepted requests, verified tutor icons, and success alerts with Light Pink / Dusty Pink tones (`#fce7ec` background, `#e89aae` border, `#9c4f65` text/icon).
- **Zero Pure White**:
  - Replace all pure white card surfaces (`#ffffff`, `bg-white`) with Soft Light Grey (`#f1f4f8` / `#e2e8f0`).
  - Replace all pure white text (`text-white`) on buttons with high-contrast text:
    - On Dusty Pink buttons (`#d88299` / `#c46982`): use Deep Charcoal / Near-Black (`#111827`) or Deep Maroon/Plum (`#3a0e1a`) for crisp readability.
    - On light surfaces: use Deep Slate (`#0f172a` / `#1e293b`).

---

## 2. Global Token Architecture (`client/my-app/app/globals.css`)

Update root variables and utility classes:
```css
:root {
  /* Light Grey + Dusty Pink / Light Pink Theme */
  --bg-page: #e8edf2;
  --bg-card: #f1f4f8;
  --bg-card-subtle: #dce3ec;

  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #64748b;

  --dusty-pink: #d88299;
  --dusty-pink-hover: #c46982;
  --dusty-pink-subtle: #fce7ec;
  --dusty-pink-border: #e89aae;
  --dusty-pink-text: #9c4f65;

  /* Aliased to Dusty Pink to prevent regressions */
  --purple: var(--dusty-pink);
  --purple-hover: var(--dusty-pink-hover);
  --purple-subtle: var(--dusty-pink-subtle);
  --purple-border: var(--dusty-pink-border);

  /* Green eliminated - re-routed to Dusty Pink / Light Pink */
  --light-green: var(--dusty-pink);
  --light-green-hover: var(--dusty-pink-hover);
  --light-green-subtle: var(--dusty-pink-subtle);
  --light-green-border: var(--dusty-pink-border);

  --border-neutral: #cbd5e1;
  --border-neutral-dark: #94a3b8;
}
```

---

## 3. Scope of Affected Files

1. **Global Styles & Shell**:
   - `client/my-app/app/globals.css`
   - `client/my-app/app/layout.tsx`
   - `client/my-app/components/Navbar.tsx`
   - `client/my-app/components/Footer.tsx`

2. **Core Pages**:
   - `client/my-app/app/page.tsx` (Landing Page)
   - `client/my-app/app/about/page.tsx` (About Page)
   - `client/my-app/app/login/page.tsx` (Login Page)
   - `client/my-app/app/register/page.tsx` (Register Page)

3. **Student Portal**:
   - `client/my-app/app/student/dashboard/page.tsx`
   - `client/my-app/app/student/profile/page.tsx`

4. **Tutor Portal & Finder**:
   - `client/my-app/app/tutor/dashboard/page.tsx`
   - `client/my-app/app/tutor/profile/page.tsx`
   - `client/my-app/app/tutors/page.tsx` (Tutor Catalog)
   - `client/my-app/app/tutors/[id]/page.tsx` (Tutor Detail & Request Modal)
   - `client/my-app/app/tutors/profile/page.tsx`

5. **Study Groups**:
   - `client/my-app/app/study-groups/page.tsx` (Catalog)
   - `client/my-app/app/study-groups/[id]/page.tsx` (Detail & Modals)
   - `client/my-app/app/study-groups/create/page.tsx` (Create)
   - `client/my-app/app/study-groups/[id]/edit/page.tsx` (Edit)

---

## 4. Verification & Quality Gates

1. **Lint Verification**:
   - Run `npm run lint` in `client/my-app` — zero errors, zero warnings.
2. **Production Build**:
   - Run `npm run build` in `client/my-app` — clean Next.js 16 / Turbopack compilation across all 15 routes.
3. **Backend Test Suite Regression**:
   - Run `npm test` in `server` — verify all 51 tests across Phase 1, Phase 2, Sprint 3, and Sprint 4 remain 100% passing.
