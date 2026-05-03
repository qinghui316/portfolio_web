# 3D Scroll Portfolio

A desktop-first React portfolio template with a fixed 3D character, cinematic scroll transitions, and a horizontal pinned project rail.

This repository intentionally keeps the README generic and does not include personal contact details, private project context, or identifying information.

## Features

- Programmatic Three.js character rendered in the viewport
- Scroll-linked character movement, rotation, camera changes, and lighting effects
- Lenis smooth scrolling
- GSAP ScrollTrigger section choreography
- Horizontal pinned project rail for featured work
- Warm editorial visual system inspired by cream surfaces, muted coral accents, dark product panels, serif display typography, Inter body text, and JetBrains Mono technical labels
- React 19 + TypeScript + Vite + Tailwind CSS 4

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Three.js
- GSAP / ScrollTrigger
- Lenis
- lucide-react

## Local Development

Requirements:

- Node.js 18+
- npm

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run TypeScript checks:

```bash
npm run lint
```

## Environment Variables

The app can run as a static front-end portfolio. Optional environment values are documented in `.env.example` for future integrations.

```bash
GEMINI_API_KEY="your_api_key"
APP_URL="your_app_url"
```

## Design References

- 3D scroll interaction reference: <https://red1-for-hek.vercel.app/>
- Color and typography direction reference: <https://getdesign.md/claude/design-md>

## Notes

- Do not commit `.env.local` or any real secret values.
- Keep public documentation free of personal contact information unless intentionally publishing it.
- The generated `dist/` output and `node_modules/` are ignored by Git.
