# 🎬 Framecraft

Framecraft is an experimental client-side video player and editor foundation built with React, WebCodecs, and WebAssembly.

Unlike traditional HTML5 `<video>` tags that abstract away rendering, Framecraft takes manual control of the decoding and rendering pipeline. By leveraging a custom WASM demuxer, Web Workers, and `OffscreenCanvas`, the project aims to enable precise frame-by-frame scrubbing, exact frame alignment, and accurate A/V synchronization entirely in the browser without server-side processing.

## 🚀 Key Features

* **Multi-threaded Architecture:** Offloads demuxing and frame rendering to dedicated Web Workers to keep the main UI thread responsive.
* **Hardware-accelerated Decoding:** Uses a custom WebAssembly demuxer (`web-demuxer`) and the WebCodecs API to decode video directly in JavaScript.
* **Canvas Rendering:** Renders decoded video frames to a decoupled `OffscreenCanvas` to avoid main-thread DOM repaints.
* **Custom A/V Sync:** Implements a custom synchronization engine to align the WebAudio API with the video render loop.
* **Timeline Interface:** Includes an interactive timeline with zoom controls, dynamic scaling, and block dragging.
* **State Management:** Uses Zustand for centralized player state management.

## 🛠 Tech Stack

- **React 19** (TypeScript, Vite)
- **WebCodecs & OffscreenCanvas** 
- **Web Workers** 
- **Zustand** 
- **Motion** 
- **Tabler Icons** 

## 📦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+) 
- npm

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

4. Navigate to `http://localhost:5173`.

## 🎮 Controls

- **Timeline**: Scrub through the timeline, drag blocks, and use the zoom in/out/reset controls.
- **Click / Tap**: Toggle Play/Pause on the video canvas.
- **Spacebar**: Toggle Play/Pause.
- **Left / Right Arrows**: Seek backward or forward by 10 seconds.
- **Esc**: Exit fullscreen mode.

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue to discuss architecture, report a bug, or open a Pull Request for new features and improvements.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
