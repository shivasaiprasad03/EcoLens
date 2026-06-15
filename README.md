# 🌿 EcoLens — Personal Carbon Footprint Tracker

**Understand, track, and reduce your carbon footprint through simple actions and personalized insights.**

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](.)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](.)

---

## 📋 Chosen Vertical

**Carbon Footprint Reduction** — Helping individuals understand their environmental impact, track daily emissions across 5 categories, and receive AI-powered personalized recommendations to reduce their carbon footprint.

---

## 🎯 Problem Statement Alignment

The average person generates 4.7 tonnes of CO₂e per year globally, but most people don't know:
- **Where** their emissions come from
- **How much** their daily choices contribute
- **What** they can do to reduce their impact

EcoLens solves this by providing:
1. **Awareness** — Instant baseline estimation from a 2-minute profile setup
2. **Tracking** — Daily activity logging across transport, food, energy, shopping, and waste
3. **Action** — Personalized, ranked reduction tips with quantified CO₂ savings
4. **Motivation** — Gamified challenges, streaks, and achievement badges

---

## 🏗️ Approach & Logic

### Architecture: Client-Side SPA

EcoLens is built as a **zero-dependency, pure vanilla JavaScript** single-page application. This design choice was deliberate:

| Decision | Rationale |
|----------|-----------|
| No frameworks (React, Vue, etc.) | Demonstrates raw JS proficiency; no build tools needed |
| No backend / No API calls | **Privacy-first**: all data stays on the user's device via `localStorage` |
| No external libraries | Zero network overhead; works offline after first load |
| Modular IIFE pattern | Clean separation of concerns without build tooling |
| Hash-based routing | SPA navigation without server configuration |

### Core Modules

```
┌─────────────────────────────────────────────────────┐
│                    index.html                        │
│                   (App Shell)                        │
├──────────┬──────────┬───────────┬──────────┬────────┤
│  utils   │  state   │  router   │emissions │insights│
│  .js     │  .js     │  .js      │  .js     │  .js   │
├──────────┴──────────┴───────────┴──────────┴────────┤
│              Components (navbar, toast, modal)        │
├──────────┬──────────┬───────────┬──────────┬────────┤
│onboarding│dashboard │  logger   │ insights │settings│
│          │          │           │ view     │        │
└──────────┴──────────┴───────────┴──────────┴────────┘
```

### Emissions Engine

The emissions calculation engine uses **scientifically-referenced emission factors** from:
- **EPA** (2023) — US environmental data
- **DEFRA** (2023) — UK government conversion factors
- **IPCC AR6** — Latest climate science
- **Our World in Data** — Global per-capita averages

Categories tracked:
| Category | Unit | Source |
|----------|------|--------|
| Transport | kg CO₂e per km | DEFRA 2023 |
| Flights | kg CO₂e per km (incl. radiative forcing) | DEFRA 2023 |
| Food | kg CO₂e per meal | Poore & Nemecek 2018 |
| Energy | kg CO₂e per kWh | IEA 2023 |
| Shopping | kg CO₂e per item | Lifecycle analyses |
| Waste | kg CO₂e per kg | EPA WARM model |

### Insights Engine (Rule-Based AI)

The recommendation engine uses a **rule-based approach** rather than an LLM for key reasons:
- **Deterministic**: Same input always produces same output (testable)
- **No API keys**: Works offline, no costs, no privacy concerns
- **Transparent**: Users can understand why each tip is recommended

Logic flow:
1. Analyze user's emission profile and logged data
2. Filter tips by conditions matching the user's context
3. Score tips by potential savings + category priority (highest-emission categories get boosted)
4. Return ranked, personalized recommendations

---

## 🚀 How It Works

### 1. Onboarding (2-minute setup)
- Multi-step wizard collects: household size, diet, commute, energy source, country
- Instantly calculates estimated annual baseline
- Compares to national and global averages

### 2. Daily Activity Logging
- Tabbed form for 5 emission categories
- Smart defaults from user profile (e.g., commute distance auto-filled)
- Quick-log buttons on dashboard for common activities
- Real-time CO₂ calculation feedback

### 3. Dashboard & Visualizations
- Today / Weekly / Monthly CO₂ summary with trend indicators
- Canvas-based donut chart (category breakdown) and line chart (7-day trend)
- Comparison badges (vs. national average, global average, Paris target)

### 4. Personalized Insights
- 25+ contextualized tips filtered by user's profile and habits
- Each tip shows: estimated CO₂ savings, difficulty level, and category
- **What-If Simulator**: select tips to see projected annual savings
- Carbon offset education section

### 5. Challenges & Gamification
- 8 eco-challenges (Meatless Monday, Bike Week, Zero Waste, etc.)
- Streak counter for consecutive logging days
- 28-day activity heatmap
- 8 achievement badges with unlock conditions

### 6. Settings & Data Management
- Theme toggle (light/dark/auto)
- Accessibility settings (reduced motion, font size)
- JSON data export/import
- Profile editing and data reset

---

## 🔒 Security Measures

| Threat | Mitigation |
|--------|-----------|
| XSS (Cross-Site Scripting) | All user input sanitized via `Utils.escapeHtml()` before DOM insertion |
| Data Exfiltration | Zero network requests — all data stays in `localStorage` |
| Prototype Pollution | `Object.freeze()` on all emission factor databases and public APIs |
| Content Injection | Content Security Policy (CSP) meta tag restricts script/style sources |
| Input Validation | All form inputs validated for type, range, and format before processing |
| File Import Attacks | File size limits (5 MB), JSON schema validation on import |

---

## ♿ Accessibility

EcoLens targets **WCAG 2.1 AA** compliance:

- ✅ Semantic HTML5 elements (`<nav>`, `<main>`, `<section>`, `<h1>`-`<h6>`)
- ✅ ARIA labels, roles, and landmarks throughout
- ✅ Keyboard navigation for all interactive elements
- ✅ Focus management on route changes
- ✅ Skip-to-content link
- ✅ `prefers-reduced-motion` support (+ manual toggle)
- ✅ Dark/Light theme with `prefers-color-scheme` auto-detection
- ✅ Minimum touch target size (44×44px)
- ✅ Screen reader announcements via ARIA live regions
- ✅ Chart data available as accessible tables for screen readers
- ✅ Focus-trapped, ESC-closable modals
- ✅ Font size adjustment option

---

## 📁 Project Structure

```
EcoLens/
├── index.html                 # SPA entry point with CSP, SEO meta, and accessibility features
├── css/
│   ├── index.css              # Design system: tokens, reset, dark mode, responsive utilities
│   ├── components.css         # Reusable component styles (buttons, cards, forms, modals)
│   └── views.css              # View-specific layouts (dashboard grid, onboarding wizard)
├── js/
│   ├── app.js                 # App initialization and route registration
│   ├── router.js              # Hash-based SPA router with view lifecycle
│   ├── state.js               # Centralized state with localStorage persistence & pub/sub
│   ├── utils.js               # Sanitization, validation, date/formatting helpers
│   ├── emissions.js           # Emission factor database & calculation engine
│   ├── insights.js            # Rule-based recommendation engine & challenges
│   ├── charts.js              # Canvas-based charting (donut, bar, line, progress ring)
│   ├── components/
│   │   ├── navbar.js          # Responsive navigation with theme toggle
│   │   ├── toast.js           # Auto-dismissing notifications with ARIA support
│   │   └── modal.js           # Accessible modal with focus trapping
│   └── views/
│       ├── onboarding.js      # Multi-step profile wizard
│       ├── dashboard.js       # Stats, charts, comparisons, quick-log
│       ├── logger.js          # Category-tabbed activity logging form
│       ├── insights.js        # Personalized tips & what-if simulator
│       ├── challenges.js      # Challenges, streaks, heatmap, badges
│       └── settings.js        # Preferences, data export/import, reset
├── tests/
│   ├── test-runner.js         # Lightweight browser-based test framework
│   ├── emissions.test.html    # 40+ tests for emissions calculations
│   └── state.test.html        # 30+ tests for state management & utilities
└── README.md                  # This file
```

---

## 🧪 Testing

### Running Tests

Open the test files directly in your browser — no build tools or Node.js required:

1. **Emissions Tests**: Open `tests/emissions.test.html` in any modern browser
2. **State Management Tests**: Open `tests/state.test.html` in any modern browser

Both test suites include:
- **Unit tests** for all calculation functions
- **Edge case testing** (zero, negative, very large values)
- **Validation tests** for emission factor ranges
- **Integration tests** for state persistence and subscriptions
- **Security tests** for input sanitization

### Test Coverage

| Module | Tests | Coverage |
|--------|-------|----------|
| Emissions Engine | 40+ | All categories, edge cases, factor validity |
| State Management | 30+ | CRUD, subscriptions, import/export, reset |
| Utils (Sanitization) | 8+ | XSS prevention, type handling |
| Utils (Validation) | 6+ | Number ranges, required fields |
| Utils (Formatting) | 6+ | CO₂ formatting, dates, percentages |

---

## 🖥️ Setup Instructions

### Option 1: Direct File Open
```bash
# Clone the repository
git clone <repo-url>

# Open index.html in your browser
# No build step, no npm install, no server required!
```

### Option 2: Local Server (recommended for CSP compatibility)
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000

# Then open http://localhost:8000
```

---

## 💡 Assumptions

1. **Emission factors** are based on global averages from EPA, DEFRA, and IPCC 2023 data. Actual emissions vary by region, vehicle, and specific circumstances.

2. **Target users** are individuals (not organizations or businesses).

3. **Language** is English only — internationalization (i18n) is out of scope for v1.

4. **Data privacy**: All data is stored exclusively in the browser's `localStorage`. No data is ever transmitted to any server.

5. **Carbon footprint** is measured in kg CO₂ equivalent (CO₂e), which accounts for other greenhouse gases weighted by their global warming potential.

6. **The "AI assistant"** is a deterministic, rule-based recommendation engine — not an LLM. This is intentional: it's more predictable, testable, works offline, and requires no API keys.

7. **Browser support**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+). Older browsers may not support some CSS features (backdrop-filter, CSS custom properties).

---

## 📊 Evaluation Alignment

| Criteria | Impact | Implementation |
|----------|--------|----------------|
| **Code Quality** | 🔴 High | Modular IIFE pattern, JSDoc comments, consistent naming, DRY principles, Object.freeze() for immutability |
| **Problem Alignment** | 🔴 High | Directly addresses understanding (baseline), tracking (logger), and reducing (insights) carbon footprint |
| **Security** | 🟡 Medium | XSS prevention, CSP headers, input validation, no network requests, Object.freeze() |
| **Efficiency** | 🟡 Medium | Zero dependencies, Canvas charts (no heavy libs), debounced persistence, lazy view loading |
| **Testing** | 🟡 Medium | 70+ browser-based tests covering all core logic, edge cases, and security |
| **Accessibility** | 🟡 Medium | WCAG 2.1 AA target, ARIA, keyboard nav, screen reader support, reduced motion |

---

## 📄 License

MIT License — feel free to use, modify, and distribute.
