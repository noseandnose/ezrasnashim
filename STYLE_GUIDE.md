# Ezras Nashim - Style Guide

## Brand Colors

### Primary Palette
| Name | CSS Variable | HSL Value | Description |
|------|-------------|-----------|-------------|
| Blush | `--blush` | `hsl(350, 45%, 85%)` | Rose pink - primary brand color |
| Lavender | `--lavender` | `hsl(260, 30%, 85%)` | Soft purple - secondary brand color |
| Sage | `--sage` | `hsl(120, 20%, 75%)` | Muted green - completion/success color |

### Theme Colors
| Name | CSS Variable | HSL Value | Usage |
|------|-------------|-----------|-------|
| Background | `--background` | `hsl(0, 0%, 100%)` | Page background |
| Foreground | `--foreground` | `hsl(0, 0%, 0%)` | All text is pure black |
| Primary | `--primary` | `hsl(345, 55%, 82%)` | Primary interactive elements |
| Accent | `--accent` | `hsl(262, 40%, 88%)` | Accent highlights |
| Muted | `--muted` | `hsl(300, 18%, 94%)` | Muted backgrounds |
| Border | `--border` | `hsl(300, 18%, 90%)` | Border color |
| Ring | `--ring` | `hsl(345, 55%, 82%)` | Focus ring color |
| Destructive | `--destructive` | `hsl(0, 84.2%, 60.2%)` | Error/destructive actions |

### Extended Palette
| Name | CSS Variable | HSL Value | Usage |
|------|-------------|-----------|-------|
| Rose Blush | `--rose-blush` | `hsl(350, 45%, 85%)` | Same as blush |
| Ivory | `--ivory` | `hsl(45, 70%, 96%)` | Warm white backgrounds |
| Sand Gold | `--sand-gold` | `hsl(40, 35%, 80%)` | Warm accent |
| Muted Lavender | `--muted-lavender` | `hsl(260, 30%, 85%)` | Softer lavender |
| Soft White | `--soft-white` | `hsl(45, 70%, 98%)` | Off-white backgrounds |

### Tailwind Custom Colors
Use these in Tailwind classes: `bg-blush`, `text-sage`, `border-lavender`, etc.
```
blush    → var(--blush)
sage     → var(--sage)
lavender → var(--lavender)
```

---

## Gradients

| Name | CSS Class | Value | Usage |
|------|-----------|-------|-------|
| Feminine | `.bg-gradient-feminine` | Blush → Lavender (135deg) | Icon backgrounds, buttons |
| Soft | `.bg-gradient-soft` | Light blush → Light lavender (135deg) | Page backgrounds |
| Soft Glow | `.gradient-soft-glow` | Soft white → Rose → Lavender (135deg) | Highlighted sections |
| Blush to Lavender | `from-blush to-lavender` | Blush → Lavender (135deg) | Buttons, accents |
| Lavender to Sage | `from-lavender to-sage` | Lavender → Sage (135deg) | Completion states |
| Sage to Blush | `.gradient-sage-to-blush` | Sage → Blush (left to right) | Special accents |

---

## Fonts

### English Text
| Font | Class | Weight | Usage |
|------|-------|--------|-------|
| Platypi Regular | `.platypi-regular` | 400 | Body text, descriptions |
| Platypi Medium | `.platypi-medium` | 500 | Slightly emphasized text |
| Platypi Semibold | `.platypi-semibold` | 600 | Subheadings |
| Platypi Bold | `.platypi-bold` | 700 | Headings, labels, buttons |

Platypi is the default font for all English text across the entire app.

### Hebrew Text
| Font | Class | Usage |
|------|-------|-------|
| VC Koren | `.vc-koren-hebrew` | Hebrew prayer text (default) |
| VC Koren Bold | `.vc-koren-hebrew` + bold | Bold Hebrew prayer text |
| Koren Siddur | `.koren-siddur-hebrew` | Siddur/prayer content |

### English in Prayer Context
| Font | Class | Usage |
|------|-------|-------|
| Platypi | `.koren-siddur-english` | English text within prayer modals |

### Legacy Hebrew Classes
| Class | Actual Font |
|-------|-------------|
| `.heebo-regular` | VC Koren (redirected) |

---

## Text Formatting (Database Content)

Content stored in the database supports these markdown-style formatting markers:

| Marker | Example | Result |
|--------|---------|--------|
| `**text**` | `**bold text**` | **Bold text** |
| `##text##` | `##Title##` | Title text (1.5em, bold, block) |
| `---` | `---` | Line break (double spacing) |
| `~~text~~` | `~~greyed out~~` | Grey text (color: #9CA3AF, 80% opacity) |
| `++text++` | `++larger bold++` | Larger bold text (1.2em, bold) |
| `--text--` | `--smaller text--` | Smaller text (0.85em) |
| `[[text]]` | `[[grey box]]` | Grey box (background: #f3f4f6, left border) |
| `{{text}}` | `{{english box}}` | Grey box for English content |
| `[text](url)` | `[Click here](https://...)` | Hyperlink (color: #E91E63, underlined) |
| `* text` or `- text` | `* bullet item` | Bullet point with dot marker |

### Footnote Formatting
Numbered references (e.g., ". 39 Rashi") are automatically converted to small superscripts for better readability.

### Conditional Formatting (Tefilla)
| Tag | Usage |
|-----|-------|
| `[[CHANUKA]]...[[/CHANUKA]]` | Chanuka-specific content |
| `[[PURIM]]...[[/PURIM]]` | Purim-specific content |
| `[[PESACH]]...[[/PESACH]]` | Pesach-specific content |
| `[[SUKKOT]]...[[/SUKKOT]]` | Sukkot-specific content |
| `[[ROSH_CHODESH]]...[[/ROSH_CHODESH]]` | Rosh Chodesh content |
| `[[FAST_DAY]]...[[/FAST_DAY]]` | Fast day content |
| `[[ASERET_YEMEI_TESHUVA]]...[[/ASERET_YEMEI_TESHUVA]]` | Ten Days of Repentance |
| `[[ONLY_ISRAEL]]...[[/ONLY_ISRAEL]]` | Israel-only content |
| `[[OUTSIDE_ISRAEL]]...[[/OUTSIDE_ISRAEL]]` | Diaspora-only content |
| `[[SPECIAL_REMOVE]]...[[/SPECIAL_REMOVE]]` | Hidden during any special day |
| `[[MONDAY]]`, `[[TUESDAY]]`, etc. | Day-specific content |

---

## Text Color Rules
- All text uses pure black (`#000000`) by default
- Bold headings for emphasis
- Grey text only via `~~` formatting markers (color: #9CA3AF)
- Links use pink (#E91E63) with underline
- Never use orange or amber colors

---

## Component Styling Patterns

### Cards & Buttons
- Background: `bg-white` or `bg-white/85` with glass effect
- Border: `border border-blush/10`
- Shadow: `shadow-lg`
- Border radius: `rounded-xl` (buttons) or `rounded-2xl` (cards)
- Hover: `hover:scale-105` with `transition-all duration-300`

### Completion States
- Incomplete: `bg-gradient-feminine` (blush → lavender) icon background
- Complete: `bg-sage` icon background with check mark

### Glass Effect (Apple style)
```css
background: rgba(255, 255, 255, 0.85);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6);
border: 1px solid rgba(255, 255, 255, 0.4);
```

### Spacing
- Section padding: `px-3`, `py-3`
- Between items: `space-y-2` or `space-y-3`
- Grid gaps: `gap-2`
- Border radius: `--radius: 1.25rem` (20px)

---

## Design Principles
- Mobile-first (99% mobile users)
- Feminine color palette (blush, lavender, sage)
- Subtle animations and transitions
- Consistent drop shadows across similar elements
- Input fields minimum 16px font size (prevents mobile zoom)
