# Lanternlight — Ray-Traced 3D Dungeon Crawler

A first-person 3D dungeon crawler built with **React**, **Three.js**, and **Tailwind CSS**. Navigate dark maze chambers with your lantern, collect emerald crystals, and escape through golden portals.

## 🎮 Play

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Or run locally:

```bash
cd app
npm install
npm run dev
```

## ✨ Features

- **First-person 3D** — Explore maze chambers in full 3D with mouse-look controls
- **Ray-traced flashlight** — Dynamic spotlight follows your camera, creating realistic lighting
- **5 levels** — Increasingly complex mazes with more crystals to find
- **Lanternlight character** — You are the Lantern Bearer, wielding light in the darkness
- **Collect & escape** — Gather emerald crystals to unlock the golden exit portal
- **Amber/Emerald palette** — Warm torchlight tones against deep dungeon darkness
- **Vercel-ready** — Optimized for one-click deployment

## 🎯 How to Play

| Key | Action |
|-----|--------|
| W/A/S/D or Arrow Keys | Move |
| Mouse | Look around |
| Click | Lock pointer (required to play) |
| Escape | Release pointer / pause |

1. **Find crystals** — Emerald green dodecahedrons scattered through the maze
2. **Collect them all** — Walk near a crystal to pick it up (HUD tracks progress)
3. **Find the exit** — Once all crystals are collected, the golden portal activates
4. **Escape** — Walk into the glowing portal to complete the level

## 🏗 Project Structure

```
ray-tracing/
├── app/                              # React + Three.js game (deployable)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Game3D.jsx            # Three.js 3D game engine
│   │   │   ├── HUD.jsx               # In-game HUD overlay
│   │   │   ├── MainMenu.jsx          # Start screen
│   │   │   ├── LevelComplete.jsx     # Level transition
│   │   │   └── Victory.jsx           # Victory screen
│   │   ├── game/
│   │   │   └── levels.js             # 5 maze level definitions
│   │   ├── App.jsx                   # Game state machine
│   │   ├── main.jsx                  # Entry point
│   │   └── index.css                 # Tailwind + custom theme
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── python/                           # Original Pygame prototypes
│   ├── v1_basic_rays.py
│   ├── v2_collision_detection.py
│   ├── v3_advanced_features.py
│   ├── v4.py
│   └── v5.py
└── web/                              # Original vanilla JS version
    ├── index.html
    ├── styles.css
    └── script.js
```

## 🚀 Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your repo
4. Set **Root Directory** to `app`
5. Framework will be auto-detected as Vite
6. Deploy!

The build command `npm run build` and output directory `dist` are already configured.

## 🛠 Tech Stack

- [React 19](https://react.dev/) — UI framework
- [Three.js](https://threejs.org/) — 3D rendering
- [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) — React renderer for Three.js
- [@react-three/drei](https://github.com/pmndrs/drei) — Three.js helpers (PointerLockControls)
- [Tailwind CSS v4](https://tailwindcss.com/) — Utility-first styling
- [Vite](https://vitejs.dev/) — Build tool

## 📜 License

MIT
