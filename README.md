# Framecraft

Framecraft is the high-performance foundation for a next-generation, purely client-side video editor built with React, WebCodecs, and WebAssembly.

Unlike traditional HTML5 `<video>` tags that abstract away rendering, Framecraft takes full control of the decoding and rendering pipeline to enable the precise frame-by-frame scrubbing required for video editing. By leveraging a custom WASM demuxer, Web Workers, and an `OffscreenCanvas`, Framecraft achieves exact frame alignment, accurate A/V synchronization, and ultra-smooth UI interactions—without relying on any server-side processing.

## 🚀 Key Features

* **WASM Demuxing**: Uses a custom WebAssembly demuxer (`web-demuxer`) to parse video containers natively in the browser.
* **WebCodecs API**: Hardware-accelerated decoding of video and audio frames directly in JavaScript.
* **Multi-Threaded Architecture**: Offloads heavy demuxing and frame rendering to dedicated Web Workers, ensuring the main React UI thread stays at a locked 60fps.
* **OffscreenCanvas**: Renders decoded video frames to a decoupled canvas element, completely avoiding main-thread DOM repaints.
* **Master Clock Sync**: Custom A/V synchronization engine ensuring perfect alignment between the WebAudio API and the video render loop.
* **Modern UI**: Smooth, glassmorphism-inspired player interface with fluid animations powered by Motion (motion.dev).
* **Zustand State**: Clean, centralized state management for the entire player lifecycle.

## 🛠 Tech Stack

- **React 19** (TypeScript, Vite)
- **WebCodecs & OffscreenCanvas** (Rendering & Decoding)
- **Web Workers** (Multi-threading)
- **Zustand** (State Management)
- **Motion** (motion.dev, UI Animations)
- **Tabler Icons** (UI Assets)

## 📦 Getting Started

### Prerequisites
Make sure you have Node.js (v18+) and npm installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yannamsellem/framecraft.git
   cd framecraft
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the local server address (usually `http://localhost:5173`).

## 🎮 Controls

- **Click / Tap**: Toggle Play/Pause
- **Spacebar**: Toggle Play/Pause
- **Left / Right Arrows**: Seek backward or forward by 10 seconds
- **Esc**: Exit fullscreen mode

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
