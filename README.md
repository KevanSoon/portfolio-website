# Japan Portfolio — Next.js

A parallax scrolling portfolio for Kevan Soon, built with Next.js 14 (App Router) and TypeScript. No external scroll libraries — pure `setTimeout` loop for reliable smooth scroll in all contexts.

---

## Quick Start

### 1. Create a new Next.js project

```bash
npx create-next-app@latest kevan-portfolio \
  --typescript \
  --app \
  --no-tailwind \
  --eslint \
  --src-dir \
  --import-alias "@/*"

cd kevan-portfolio
```

### 2. Copy these files into your project

Replace the contents of `src/` and `public/` with the files from this export:

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── page.module.css
└── components/
    └── ui/
        ├── parallax-portfolio.tsx
        └── parallax-portfolio.module.css
public/
└── images/
    ├── blue_sky.png
    ├── mount_fuji.png
    ├── red_gate.png
    └── Sakura.png
```

### 3. Add your images

Copy your 4 photos into `public/images/`:
- `blue_sky.png`
- `mount_fuji.png`
- `red_gate.png`
- `Sakura.png`

### 4. Run

```bash
npm run dev
# open http://localhost:3000
```

---

## Scroll Architecture

- **`#parallax-scroll-track`** — tall invisible div providing scroll distance (`N_SCENES × pinDistance`)
- **`#scenes-stage`** — `position:fixed`, all 4 scenes stacked as `position:absolute` layers
- **`setTimeout(tick, 16)`** — ~60fps loop, runs regardless of tab/iframe focus
- Each scene's opacity, `translateY`, and content fade driven by a `progress` value (0→1)

### Transition — Option B (rises from below)
- Current scene bg **stays still** during the transition zone (first 30% of progress)
- Incoming scene bg **rises up** from `+depth%` → `0%` while cross-fading in
- Once established (30%+), bg drifts upward slowly for parallax depth feel

---

## Customising

Edit `src/app/page.tsx` to change:
- Name, role, typing phrases
- Education & experience entries
- Project cards
- Hackathon achievements
- Contact link

Tune physics via `<ParallaxPortfolio>` props:

| Prop | Default | Description |
|---|---|---|
| `pinDistance` | `250` | vh of scroll distance per scene |
| `parallaxDepth` | `30` | bg drift amount (%) |
| `easeAmount` | `0.10` | lerp smoothness (lower = silkier) |

---

## No extra npm packages needed
