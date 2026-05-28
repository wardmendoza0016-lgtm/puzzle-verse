# PuzzleVerse - Project Architecture

**Last Updated:** May 28, 2026  
**Project Type:** React + TypeScript Landing Page with Interactive 3D Puzzle Component  
**Build Tool:** Vite 6.3.5  
**Framework:** React 18.3.1 (peer dependency)

---

## 1. Project Overview

**PuzzleVerse** is an interactive landing page for a collaborative, custom jigsaw puzzle platform. The application features:

- **3D Interactive Puzzle Visualization** - A dynamic 4×4 puzzle grid with animated pieces, avatar connections, and parallax effects
- **Mouse-Reactive Scene** - Real-time 3D perspective transforms based on mouse movement
- **Premium UI/UX** - Modern glassmorphism design with smooth animations and gradient accents
- **Multiplayer-Ready** - Visual indication of multiplayer features with avatar representations
- **Custom Image Support** - Ability to create puzzles from user-uploaded images

The project was created from a Figma design and is optimized for desktop viewing with responsive considerations.

---

## 2. Technology Stack

### Frontend Framework & Build
- **React 18.3.1** - UI library (peer dependency)
- **React DOM 18.3.1** - DOM rendering (peer dependency)
- **Vite 6.3.5** - Ultra-fast build tool and dev server
- **TypeScript** - Type-safe JavaScript

### Animation & Motion
- **Motion 12.23.24** - Framer Motion successor, provides `motion` components and hooks for smooth animations
  - Used for: parallax effects, 3D transforms, floating animations, hover states, stagger animations

### UI Components & Design System
- **Radix UI** - Headless component library (40+ components)
  - Accordion, Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu, Hover Card, Label, Navigation Menu, Popover, Select, Tabs, Toggle, Tooltip, and more
  - Provides accessible, unstyled primitives
  
- **Lucide React 0.487.0** - Icon library (~487 icons)
  - Used icons: `Upload`, `Hexagon`, `Play`, `Users`, `ImageIcon`, `CheckCircle2`

- **MUI (Material-UI) 7.3.5** - Material Design components
  - `@mui/material` - Core components
  - `@mui/icons-material` - Icon set

### Styling & CSS
- **Tailwind CSS 4.1.12** - Utility-first CSS framework
  - `@tailwindcss/vite` - Vite plugin for optimized integration
- **PostCSS** - CSS transformation (configured in `postcss.config.mjs`)
- **Class Variance Authority 0.7.1** - CSS class composition utility

### Form & Data
- **React Hook Form 7.55.0** - Performant form state management with validation
- **Input OTP 1.4.2** - OTP input component

### Data Visualization & Carousel
- **Recharts 2.15.2** - React charting library
- **React Slick 0.31.0** - Carousel component
- **Embla Carousel React 8.6.0** - Lightweight carousel solution

### Drag & Drop
- **React DnD 16.0.1** - Drag and drop library
- **React DnD HTML5 Backend 16.0.1** - HTML5 drag/drop backend

### Layout & Resizable
- **React Resizable Panels 2.1.7** - Resizable panel component
- **React Responsive Masonry 2.7.1** - Masonry layout

### Utilities
- **clsx 2.1.1** - Conditional CSS class composition
- **Tailwind Merge 3.2.0** - Merge Tailwind CSS classes intelligently
- **Vaul 1.1.2** - Unstyled drawer/modal library
- **Canvas Confetti 1.9.4** - Confetti animation effect
- **cmdk 1.1.1** - Command menu component
- **date-fns 3.6.0** - Date manipulation library
- **Motion 12.23.24** - Animation library
- **Next Themes 0.4.6** - Theme switching
- **React Day Picker 8.10.1** - Date picker

### Notification & UI Polish
- **Sonner 2.0.3** - Toast notifications
- **Emotion 11.14.0** (`@emotion/react`, `@emotion/styled`) - CSS-in-JS library
- **React Popper 2.3.0** - Popper positioning library
- **@popperjs/core 2.11.8** - Core positioning engine

### Routing
- **React Router 7.13.0** - Client-side routing (currently not actively used in main landing page)

---

## 3. Project Structure

```
puzzle-verse/
├── src/
│   ├── main.tsx                          # Application entry point
│   ├── app/
│   │   ├── App.tsx                       # Root component with landing page UI
│   │   └── components/
│   │       ├── figma/
│   │       │   └── ImageWithFallback.tsx # Image component with error fallback
│   │       └── ui/                       # Radix UI + styled components library
│   │           ├── accordion.tsx
│   │           ├── alert.tsx
│   │           ├── button.tsx
│   │           ├── avatar.tsx
│   │           ├── card.tsx
│   │           ├── dialog.tsx
│   │           ├── dropdown-menu.tsx
│   │           ├── form.tsx
│   │           ├── input.tsx
│   │           ├── label.tsx
│   │           ├── tabs.tsx
│   │           ├── tooltip.tsx
│   │           ├── ... (30+ more UI components)
│   │           ├── use-mobile.ts         # Mobile detection hook
│   │           └── utils.ts              # CSS utilities (cn function)
│   │
│   └── styles/
│       ├── index.css                     # Main stylesheet entry
│       ├── fonts.css                     # Google Fonts imports (Outfit, Space Grotesk)
│       ├── tailwind.css                  # Tailwind directives
│       └── theme.css                     # CSS custom properties and design tokens
│
├── index.html                            # HTML entry point
├── vite.config.ts                        # Vite configuration with plugins
├── postcss.config.mjs                    # PostCSS configuration (Tailwind)
├── tsconfig.json                         # TypeScript configuration
├── package.json                          # Dependencies and scripts
├── README.md                             # Project overview
├── ATTRIBUTIONS.md                       # Third-party attributions
├── guidelines/
│   └── Guidelines.md                     # AI development guidelines template
└── ARCHITECTURE.md                       # This file
```

---

## 4. Core Component Architecture

### 4.1 Entry Point Flow

```
index.html
    ↓
src/main.tsx (createRoot & render)
    ↓
src/app/App.tsx (Root Component)
    ↓
MidgroundScene Component
    ├── PuzzlePiece Components (4×4 grid)
    │   ├── SVG Path Generation (getPiecePath)
    │   ├── Image Clipping with Unsplash Images
    │   └── Hover/Float Animations
    │
    ├── StandalonePiece Components (Parallax)
    │   └── Mouse-Following Movement
    │
    ├── Avatar Components (3 players)
    │   └── Connecting Lines with Animations
    │
    └── Upload Node
        └── Interactive Create Button
```

### 4.2 App Component (`src/app/App.tsx`)

**Primary Component:** Renders the complete landing page  
**Responsibility:** Orchestrate layout, handle mouse events, manage 3D transforms

**Key Features:**
- Global mouse tracking via `useMotionValue` and `useSpring` hooks
- 3D perspective transforms based on cursor position
- Navbar with navigation and CTA buttons
- Hero section with animated heading and description
- 3D puzzle scene with responsive scaling

**Motion Hooks Used:**
```typescript
const mouseX = useMotionValue(0.5);
const mouseY = useMotionValue(0.5);
const smoothX = useSpring(mouseX, { stiffness: 40, damping: 20 });
const smoothY = useSpring(mouseY, { stiffness: 40, damping: 20 });
```

**3D Perspective:** Achieves tilt effect with:
```typescript
const rotateX = useTransform(smoothY, [0, 1], [35, 15]);
const rotateY = useTransform(smoothX, [0, 1], [-25, -5]);
```

---

### 4.3 MidgroundScene Component

**Purpose:** Contains the 4×4 puzzle grid visualization  
**3D Rendering:** Uses CSS transforms with `perspective: 1500px`

**Sub-Components:**

#### A. PuzzlePiece Component
- **Parameters:** `r` (row), `c` (column), `detachedProps` (3D positioning for floating pieces)
- **Rendering:** SVG-based puzzle piece shapes with clip paths
- **Animation Types:**
  - Floating animation (detached pieces only) - infinity loop
  - Hover effect - scale & z-axis transform
- **Image:** All pieces use the same mountain image (Unsplash)
- **Detached Pieces:** Positions defined in `DETACHED` object:
  - `[3,1]`, `[2,3]`, `[0,3]`, `[3,3]` - float above the grid

#### B. StandalonePiece Component
- **Purpose:** Parallax effect pieces in the background/foreground
- **Positioning:** Fixed viewport percentages (e.g., "5vw", "75vh")
- **Motion:** Responds to mouse position with `useTransform`
- **Rendered 4 Times:** Creating depth layers at different speeds (0.8-1.2)

#### C. Avatar Component
- **Count:** 3 avatars representing players
- **Data Structure:**
  ```typescript
  {
    id: 1-3,
    x: number,        // DOM x position
    y: number,        // DOM y position
    z: number,        // z-index/3D depth
    img: string,      // Unsplash URL
    target: { r, c }, // Target puzzle piece grid position
    color: string,    // Connection line color (cyan, purple, lime)
  }
  ```
- **Animation:** Vertical bounce + rotateY wobble
- **Visual:** Circular frames with glowing blur effect

#### D. Connecting Lines (SVG)
- **Purpose:** Animate flow from avatars and upload node to puzzle pieces
- **Implementation:** Quadratic Bézier curves (`Q` path commands)
- **Animation:** Stroke dasharray animation for flowing effect
- **Colors:** Match avatar colors (cyan, purple, lime) with varying opacity

#### E. Upload Node
- **Position:** Floating node on the left side (x: -200)
- **Visual:** Rounded card with gradient background, backdrop blur
- **Icon:** `ImageIcon` with "Create" label
- **Interactive:** Cursor pointer on hover

---

### 4.4 ImageWithFallback Component (`src/app/components/figma/ImageWithFallback.tsx`)

**Purpose:** Wrapper for avatar images with error handling  
**Features:**
- Renders `<img>` tag normally on load success
- Shows SVG placeholder on load error
- Integrates with React state for error tracking
- Used in: Avatar circular image renders

---

### 4.5 UI Components Library (`src/app/components/ui/`)

**Type:** Radix UI-based, Tailwind-styled component collection  
**Count:** 40+ components (all implemented, most unused in current landing)

**Actively Used in Main App:**
- Basic HTML elements only (divs, buttons, nav)
- No component imports in `App.tsx` currently

**Available for Future Implementation:**
- Form components (form, input, textarea, select)
- Dialog/Modal system (dialog, alert-dialog, drawer)
- Navigation (navigation-menu, breadcrumb)
- Data display (table, tabs, accordion)
- Interactive (carousel, resizable panels, context-menu)

**Key Utilities:**
- `use-mobile.ts` - Hook to detect mobile viewport
- `utils.ts` - Contains `cn()` function for class merging (uses `clsx` + `tailwind-merge`)

---

## 5. Styling & Design System

### 5.1 Design Tokens (CSS Variables)

Located in `src/styles/theme.css`, defined in `:root` selector:

**Color Palette:**
- Primary: `#030213` (Deep dark)
- Background: `#090B12` (Space black)
- Accent: Gradients from cyan `#00f0ff`, indigo `#b966ff`, lime `#00ffaa`
- Chart colors: 5 oklch-based variants

**Spacing & Sizing:**
- `--radius: 0.625rem` - Consistent border radius
- Font sizes, font weights defined
- Sidebar & card tokens

**Design Variables by Scope:**
- Light mode (default)
- Dark mode (`.dark` class)

### 5.2 Font System

`src/styles/fonts.css` imports from Google Fonts:
- **Outfit** (300-800 weights) - Primary font for headings
- **Space Grotesk** (400-700 weights) - Secondary/Body font

Applied via Tailwind classes:
- `font-['Space_Grotesk']` - Body text
- `font-['Outfit']` - Headings

### 5.3 Tailwind CSS 4

**Integration:** Via `@tailwindcss/vite` plugin in Vite config  
**Key Configs:**
- Custom class utilities (cn function)
- Gradient utilities: `bg-gradient-to-r`, `bg-clip-text`
- Backdrop blur: `backdrop-blur-xl`, `backdrop-blur-md`
- Shadow utilities with rgba colors
- Animation utilities: `animate-pulse`

**Color Classes:**
- Cyan: `from-cyan-500`, `text-cyan-400`
- Purple: `to-purple-400`, `from-indigo-500`
- White with opacity: `text-white/60`, `bg-white/10`
- Green: `bg-emerald-400`

### 5.4 Styling Patterns

**Backdrop/Glassmorphism:**
```html
class="bg-white/5 backdrop-blur-xl border border-white/20"
```

**Glowing Shadows:**
```html
style={{ boxShadow: '0_0_40px_rgba(255,255,255,0.15)' }}
```

**Responsive Typography:**
```html
class="text-5xl md:text-7xl"
```

**Gradient Text:**
```html
class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400"
```

---

## 6. Animation & Motion Patterns

### 6.1 Motion Library Usage

**Provider:** Framer Motion successor (`motion/react`)  
**Key Hooks:**
- `useMotionValue()` - Track numeric values
- `useSpring()` - Smooth spring animation
- `useTransform()` - Map one value to another range
- `motion.div` - Animated wrapper component

### 6.2 Animation Types

**1. Parallax (Mouse-Driven)**
```typescript
const moveX = useTransform(smoothX, [0, 1], [-100 * speed, 100 * speed]);
// Translates based on mouse position with configurable speed
```

**2. Floating Loop**
```typescript
animate={{ 
  y: [start, start - 15, start],
  transition: { repeat: Infinity, duration: 4, ease: "easeInOut" }
}}
```

**3. Hover Effects**
```typescript
whileHover={{ 
  z: 20, 
  scale: 1.05, 
  transition: { duration: 0.3 } 
}}
```

**4. Staggered Entrance**
```typescript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
```

**5. SVG Stroke Animation**
```typescript
<animate 
  attributeName="stroke-dashoffset" 
  from="100" 
  to="0" 
  dur="1.5s" 
  repeatCount="indefinite" 
/>
```

**6. 3D Rotations**
```typescript
style={{ 
  rotateX: 20, 
  rotateY: 30, 
  rotateZ: 15,
  transformStyle: 'preserve-3d'
}}
```

---

## 7. Configuration Files

### 7.1 Vite Configuration (`vite.config.ts`)

**Plugins:**
1. `figmaAssetResolver()` - Custom plugin to resolve `figma:asset/` imports
2. `react()` - React JSX transform
3. `tailwindcss()` - Tailwind CSS support

**Module Resolution:**
- Alias: `@` → `./src` (allows `@/components/...` imports)

**Assets:**
- Includes SVG and CSV files for raw imports

### 7.2 PostCSS Configuration (`postcss.config.mjs`)

**Status:** Minimal - Tailwind v4 via Vite plugin handles PostCSS automatically  
**Purpose:** Can add additional PostCSS plugins if needed

### 7.3 TypeScript Configuration

**Language:** TypeScript (`.ts`, `.tsx` files)  
**JSX:** React 18 (via `@vitejs/plugin-react`)

---

## 8. Build & Development

### 8.1 Scripts (from `package.json`)

```json
{
  "scripts": {
    "dev": "vite",           // Start Vite dev server
    "build": "vite build"    // Production build
  }
}
```

### 8.2 Development Workflow

```bash
npm install              # Install dependencies
npm run dev             # Start local dev server (typically :5173)
npm run build           # Build for production
```

### 8.3 Output

**Dev Server:** Vite hot module replacement (HMR) enabled  
**Build Output:** Optimized static assets for deployment

---

## 9. Key Features & Implementation Details

### 9.1 3D Puzzle Grid

**Generation Algorithm:**

1. **Piece Path Generation** (`getPiecePath`)
   - Takes grid position (column, row)
   - Consults `vEdges` and `hEdges` arrays for tab directions
   - Generates SVG path with Bézier curves for puzzle tabs
   - Returns path string for clipping

2. **Image Clipping**
   - Single mountain image tiled across all 16 pieces
   - SVG `<clipPath>` element applies piece shape
   - Image offset calculated per piece: `x={-c * 100}`, `y={-r * 100}`

3. **Detached Pieces**
   - Configuration object `DETACHED` defines which pieces float
   - Floating animation: Sinusoidal y-axis movement + z-axis depth variation
   - Applied to 4 corner pieces: `[3,1]`, `[2,3]`, `[0,3]`, `[3,3]`

### 9.2 Interactive 3D Scene

**Mouse Tracking:**
```typescript
const handleMouseMove = (e: React.MouseEvent) => {
  mouseX.set(e.clientX / window.innerWidth);   // 0-1 range
  mouseY.set(e.clientY / window.innerHeight);  // 0-1 range
};
```

**Transform Mapping:**
- Mouse X (0→1) maps to rotateY (-25° → -5°)
- Mouse Y (0→1) maps to rotateX (35° → 15°)
- Spring smoothing applied with stiffness=40, damping=20

**3D Perspective:**
- Container: `perspective: 1500px`
- `preserve-3d` on all transform-3d elements

### 9.3 Avatar Connection System

**Flow:**
1. Avatar positioned at absolute DOM coordinates
2. SVG canvas overlays entire scene
3. Quadratic Bézier curves connect avatar center to target piece center
4. Two stroke layers: base (subtle) + animated dash
5. Colors: Cyan, Purple, Lime with varying opacity

**Coordinate System:**
- DOM coordinates converted to SVG space: `[domX + 400, domY + 400]`
- Piece centers calculated: `[c * 100 + 50, r * 100 + 50]`
- Control point: Midpoint between start/end, offset vertically for arc effect

### 9.4 Landing Page Sections

**1. Navbar**
- Logo with hexagon icon and "PuzzleVerse" branding
- Navigation links (desktop-hidden on mobile)
- CTA buttons: "Log In" and "Get Started"

**2. Hero Section**
- Status badge: "Multiplayer Lobbies Live" with pulsing dot
- Main heading: "Your Images. Your Friends. Your World. Puzzled."
- Gradient accent text in heading
- Description: "The ultimate collaborative, custom jigsaw experience..."
- CTA button: "Start Your First Puzzle Free" with play icon

**3. 3D Scene**
- Takes up remaining vertical space
- Responsive sizing
- Contains 4×4 puzzle grid + surrounding elements

### 9.5 Responsive Design

**Breakpoints (Tailwind):**
- `sm:` (640px) - Small devices
- `md:` (768px) - Tablets/medium screens
- Default - Mobile

**Adaptive UI:**
- Navbar nav links: `hidden md:flex` (tablet+)
- Log In button: `hidden sm:block`
- Hero text sizes: `text-5xl md:text-7xl`

---

## 10. Performance Considerations

### 10.1 Rendering Optimization

1. **SVG Usage:** Complex puzzle geometry rendered via SVG (scalable, CPU-efficient)
2. **CSS Transforms:** 3D transforms use GPU acceleration (`will-change`, `preserve-3d`)
3. **Motion Values:** Framer Motion uses `requestAnimationFrame` internally
4. **Pointer Events:** Non-interactive elements have `pointer-events-none`

### 10.2 Assets

- **Images:** External Unsplash URLs (lazy-loaded)
- **Icons:** Lucide React (tree-shakeable)
- **Fonts:** Google Fonts with `display=swap` (prevents FOIT)

### 10.3 Bundle Size Factors

**Heavy Dependencies:**
- Motion (`motion/react`): ~50KB gzipped
- Radix UI components (full suite): ~100KB+ gzipped
- Tailwind CSS (compiled): ~15-30KB gzipped
- React/React-DOM: Peer dependencies (not included)

---

## 11. Potential Future Enhancements

### 11.1 Currently Implemented but Unused

- **React Router** - No multi-page routing active yet (ready for expand)
- **Form Components** - Full Radix UI form library available
- **Dialogs/Modals** - Alert dialog, drawer components available
- **Data Visualization** - Recharts imported but unused

### 11.2 Suggested Improvements

1. **State Management** - Add Context API or state library for global state
2. **API Integration** - Connect to backend for user auth, puzzle creation
3. **WebSocket Support** - Real-time multiplayer collaboration
4. **Image Upload** - Replace Unsplash with user-uploaded images
5. **Accessibility Enhancements** - Screen reader support, keyboard navigation
6. **Performance** - Implement code splitting, lazy-load heavy components
7. **Testing** - Add unit/integration tests (Jest, Vitest, Testing Library)
8. **i18n** - Multi-language support

---

## 12. Development Guidelines

### 12.1 Component Creation

1. Use `.tsx` extension for React components
2. Leverage Tailwind for styling (no CSS modules by default)
3. Use `clsx` or `cn` utility for conditional classes
4. Wrap animations with `motion.div` for smooth performance

### 12.2 File Organization

- UI components in `src/app/components/ui/`
- Figma-specific components in `src/app/components/figma/`
- Styles in `src/styles/`
- Main app logic in `src/app/App.tsx`

### 12.3 Naming Conventions

- Components: PascalCase (e.g., `MidgroundScene`, `PuzzlePiece`)
- Utilities: camelCase (e.g., `getPiecePath`, `getSvgCoords`)
- Constants: UPPER_SNAKE_CASE (e.g., `DETACHED`, `AVATARS`, `UPLOAD_NODE`)

---

## 13. Deployment

### 13.1 Build Process

```bash
npm run build
# Output: dist/ folder with optimized static files
```

### 13.2 Deployment Targets

- **Static Hosting:** Vercel, Netlify, GitHub Pages, AWS S3 + CloudFront
- **Node Server:** Can be served from any Node.js server
- **Docker:** Create Docker image with Node.js base

### 13.3 Environment Configuration

Currently: No `.env` files needed (all assets are public URLs)  
Future: May need `.env` for API endpoints, CDN URLs, etc.

---

## 14. Attributions & References

**Figma Design Source:** https://www.figma.com/design/FdyYHnufuxASc5SlOaWjzB/Landing-Page-Visual-Concept

**Third-Party Libraries:** See [ATTRIBUTIONS.md](ATTRIBUTIONS.md)

---

## 15. File Reference Summary

| File | Purpose | Type | Lines |
|------|---------|------|-------|
| `src/main.tsx` | Entry point, renders React app | TypeScript | ~5 |
| `src/app/App.tsx` | Root component, landing page | TypeScript + React | ~400+ |
| `src/app/components/figma/ImageWithFallback.tsx` | Image component with fallback | TypeScript + React | ~30 |
| `src/app/components/ui/*.tsx` | Radix UI component library | TypeScript + React | 1000+ |
| `src/styles/index.css` | Main stylesheet | CSS | ~5 |
| `src/styles/theme.css` | Design tokens/CSS variables | CSS | ~100+ |
| `src/styles/fonts.css` | Google Fonts imports | CSS | ~1 |
| `src/styles/tailwind.css` | Tailwind directives | CSS | ~10 |
| `vite.config.ts` | Vite build configuration | TypeScript | ~30 |
| `postcss.config.mjs` | PostCSS configuration | JavaScript | ~15 |
| `package.json` | Dependencies and scripts | JSON | ~100 |
| `index.html` | HTML entry point | HTML | ~20 |

---

**Document Generated:** May 28, 2026  
**Architecture Version:** 1.0  
**Status:** Production-Ready Landing Page (Extended Demo Features Available)
