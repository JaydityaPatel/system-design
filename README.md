# System Design — Interactive Visual Engineering Guide (Recreation)

An isolated React + TypeScript + Vite recreation of the **System Design** interactive learning platform featuring dark & light retro-technical themes, an animated isometric queueing & throughput simulation, 40 structured curriculum lessons, a live Design Lab sandbox, interactive Practice quizzes, and searchable Cheatsheets.

## Project Isolation
This project lives entirely inside `/system-design-recreation/` with its own `package.json`, `vite.config.ts`, and `tsconfig.json`. Zero parent project files were modified.

## Prerequisites
- Node.js 18+
- npm 9+

## Setup & Run

```bash
cd system-design-recreation
npm install
npm run dev
```

Open [http://localhost:5174](http://localhost:5174) in your browser.

## Production Build

```bash
npm run build
npm run preview
```

## Implemented Features & Shortcuts
- **Dark & Light Themes**: Toggle smoothly via the top-right Sun/Moon button.
- **Isometric SVG Simulation**: Animated `requestAnimationFrame` particles (`request`, `response`, `slow request`, `waiting in queue`), dynamic utilization pill, multi-server scaling, fan-out topology, and real-time `LATENCY VS. HOW BUSY` curve.
- **Full Curriculum**: 9 categories, 40 interactive lessons, expandable folder tree, persistent progress tracking (`2 / 40`), and `YOU'LL LEARN` objective checklists.
- **Keyboard Shortcuts**:
  - `Ctrl+K` / `Cmd+K`: Open Search Modal
  - `←` / `→`: Previous / Next lesson step
  - `R`: Replay current simulation
  - `Space`: Pause / Resume simulation
  - `Esc`: Close open modals
