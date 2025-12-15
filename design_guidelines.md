# Design Guidelines: Portal de BI para Help Desk

## Design Approach

**Selected Approach**: Design System - Carbon Design (IBM) / Fluent Design hybrid
**Justification**: Enterprise BI dashboards require proven patterns for data-heavy interfaces, professional aesthetics, and exceptional clarity. Drawing inspiration from Tableau, Power BI, and Linear's data presentation excellence.

## Core Design Principles

1. **Clarity Over Decoration**: Every visual element serves data comprehension
2. **Action-Centric Hierarchy**: Guide users toward decisions, not just data display
3. **Consistent Information Architecture**: Predictable patterns across all dashboards
4. **Professional Restraint**: Minimal decoration, maximum insight

---

## Typography

**Font Stack**: 
- Primary: Inter (via Google Fonts CDN) - exceptional legibility for data-dense interfaces
- Monospace: 'JetBrains Mono' for numerical data, code, and metrics

**Type Scale**:
- Dashboard Titles: text-2xl font-semibold (section headers)
- Card Headers/KPI Labels: text-sm font-medium uppercase tracking-wide (subtle hierarchy)
- Primary Metrics: text-4xl font-bold (large numerical displays)
- Body Text/Descriptions: text-sm (compact, scannable)
- Table Content: text-xs to text-sm (maximize data density)
- Microcopy/Tooltips: text-xs (contextual help)

---

## Layout System

**Spacing Primitives**: Tailwind units of **2, 4, 6, and 8** (p-2, p-4, p-6, p-8, m-4, gap-6, etc.)

**Grid Structure**:
- Container: max-w-7xl mx-auto px-4 to px-8
- Dashboard Cards: grid with gap-4 to gap-6
- 12-column grid system for flexible dashboard layouts
- Responsive breakpoints: Full-width mobile → 2-column tablet → 3-4 column desktop

**Card Padding**: Consistent p-6 for dashboard cards, p-4 for compact widgets

---

## Component Library

### Navigation
- **Sidebar Navigation**: Fixed left sidebar (w-64) with hierarchical menu structure
  - Main sections with icons (Heroicons via CDN)
  - Active state with subtle accent treatment
  - Collapsible on mobile
- **Top Bar**: Breadcrumbs, global filters, user menu, notification center

### Dashboard Cards
- **KPI Cards**: Compact metric displays with large numbers, small labels, trend indicators (↑↓)
- **Chart Cards**: White background, subtle border, consistent header with title + filter/export actions
- **Alert Cards**: Warning/critical indicators with visual hierarchy (border accent, icon)

### Data Display
- **Tables**: Striped rows, sortable headers, hover states, fixed headers for scroll
- **Charts**: Use Chart.js or Recharts libraries
  - Line charts for trends (FRT, AHT over time)
  - Bar charts for comparisons (tickets by priority, by channel)
  - Donut charts for distributions (status breakdown, satisfaction scores)
  - Avoid 3D, excessive gradients
- **Filters**: Dropdown selects, date range pickers, multi-select with tags

### Interactive Elements
- **Buttons**: Primary (solid), Secondary (outline), Ghost (text-only)
  - Size variants: sm, base, lg
  - Icons from Heroicons only
- **Tooltips**: Small, dark overlay with white text on hover (data explanations)
- **Drill-down Indicators**: Clickable chart elements with cursor-pointer, subtle underline on table rows

### Status Indicators
- **SLA Compliance**: Visual badges (Em dia, Em risco, Estourado)
- **Priority Levels**: Subtle pill badges (Alta, Média, Baixa)
- **Trend Arrows**: Simple SVG arrows with directional indicators

---

## Visual Treatment

**Background Hierarchy**:
- App background: Neutral light gray
- Card backgrounds: Pure white
- Hover states: Subtle gray tint
- Active states: Minimal border accent

**Borders**: 
- Subtle 1px borders on cards
- No heavy shadows (max shadow-sm)
- Focus on clean separation through spacing

---

## Animations

**Minimal Motion**:
- Smooth transitions for hover states (150ms)
- Subtle loading spinners for data fetching
- NO scroll animations, parallax, or decorative motion
- Chart animations: Brief initial render only (300ms max)

---

## Accessibility

- High contrast text (WCAG AA minimum)
- Keyboard navigation for all interactive elements
- Screen reader labels for chart data points
- Focus indicators on all interactive components
- Semantic HTML structure (nav, main, section, article)

---

## Page-Specific Layouts

**Dashboard Pages** (Home, Operacional, SLA, Satisfação, etc.):
- Top: Key metrics in 3-4 column card grid (KPI summary)
- Middle: 2-column layout for primary charts
- Bottom: Full-width table with detailed data
- Persistent filter bar at top

**Biblioteca de Métricas**:
- Left sidebar with metric categories
- Right content area with metric definitions (grid of cards)
- Each metric card: Name, formula (in monospace), objective, decision guidance

**Análises Detalhadas**:
- Filter-heavy interface with multi-level drill-down
- Breadcrumb navigation showing filter path
- Dynamic chart updates based on selections

---

## Critical Implementation Notes

- Use established chart libraries (Chart.js recommended for consistency)
- Icons: Heroicons ONLY via CDN
- Fonts: Inter + JetBrains Mono via Google Fonts CDN
- No custom illustrations or decorative graphics
- Focus on data clarity, professional presentation, and decision enablement
- Every dashboard element should answer: "What action does this enable?"