# CubeMaster – AI Rubik's Cube Solver

A professional, modern, 3D interactive Rubik's Cube solving web application built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Three.js / React Three Fiber**.

![CubeMaster](https://img.shields.io/badge/CubeMaster-AI%20Vision%20%26%203D%20Solver-06b6d4?style=for-the-badge)
![Vercel Ready](https://img.shields.io/badge/Vercel-Deploy%20Ready-black?style=for-the-badge&logo=vercel)
![React 19](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Three.js](https://img.shields.io/badge/Three.js-WebGL%203D-black?style=for-the-badge&logo=threedotjs)

---

## 🌟 Key Features

1. **Dual Input System**:
   - **AI Camera Vision**: Scan all 6 cube faces using your device camera or photo upload with a 3x3 alignment targeting grid and real-time color classifier.
   - **3D Manual Painter**: Unfolded 2D net and live interactive 3D cube with color palette and sticker counters.
2. **Integrity & Parity Validator**:
   - Verifies 54 stickers, 9 stickers per color, 6 unique center pieces, and valid 2-color edge piece geometry.
3. **Interactive 3D Visualizer**:
   - Step-by-step 3D playback of moves with rotate, pause, step forward/backward, and speed controls.
   - Singmaster move notation guide (`R`, `U'`, `F2`) with plain-English instructions.
   - Celebration confetti animation on solve completion.
4. **Universal Puzzle Engine**:
   - Modular architecture supporting 3x3 Standard, 2x2 Pocket Cube, 4x4 Rubik's Revenge, and Pyraminx.
5. **Interactive Move Test Pad & Guide**:
   - 18 instant move buttons to practice and test Singmaster notations directly on the 3D cube.

---

## 🚀 Deploying to Vercel

The project is pre-configured for Vercel with [`vercel.json`](./vercel.json) (handling SPA rewrites, build commands, and static asset caching).

### Method 1: Deploy with GitHub (Recommended)

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit: CubeMaster AI Rubik's Cube Solver"
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. Go to [Vercel Dashboard](https://vercel.com/dashboard).
3. Click **Add New...** -> **Project**.
4. Select your GitHub repository.
5. Vercel will automatically detect:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Click **Deploy**. Your site will be live in ~30 seconds with automatic CI/CD on every push!

### Method 2: Deploy with Vercel CLI

1. Run the Vercel CLI in this folder:
   ```bash
   npx vercel
   ```
2. Follow the interactive prompts (select your Vercel account, accept default build settings).
3. For production deployment:
   ```bash
   npx vercel --prod
   ```

---

## 🛠 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Lint codebase
npm run lint

# 4. Create production build
npm run build

# 5. Preview production build locally
npm run preview
```

---

## 🎨 Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 6
- **Styling**: Tailwind CSS v4
- **3D Graphics**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Icons**: Lucide React
- **Celebration Effects**: Canvas Confetti
