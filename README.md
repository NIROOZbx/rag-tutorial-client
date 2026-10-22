# RAG Knowledge Client 🤖

An interactive, physics-enabled frontend for Retrieval-Augmented Generation (RAG) applications. Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Matter.js**.

---

## ✨ Features

- **Physics-Driven Hanging Board**:
  - Realistic 2D physics powered by **Matter.js**.
  - Dynamic procedural SVG ropes anchored to the ceiling that stretch, sway, and react 1:1 to pointer drag interactions.
  - Smooth spring constraints with realistic inertia and natural settling damping.

- **Document Q&A (RAG Workflow)**:
  - **PDF Upload**: Drag-and-drop or file picker with live animated progress feedback.
  - **Document Analysis**: Automatic text extraction and chunk indexing.
  - **Interactive Chat**: Ask context-aware questions against uploaded PDFs with rich Markdown formatting.

- **Resilient & Human-Friendly Error Handling**:
  - **Zero Round-Trip Validation**: Client-side format (`.pdf`) and size ($\le 10\text{ MB}$) checks.
  - **Typed Error Codes**: Categorized codes (`FILE_TOO_LARGE`, `INVALID_FILE_TYPE`, `PDF_PASSWORD_PROTECTED`, `PDF_CORRUPTED`, `RATE_LIMITED`, `NETWORK`, `SERVER_UNAVAILABLE`, `UNKNOWN`).
  - **Smart Action Buttons**: Contextual actions ("Retry upload" for transient network issues; "Choose another file" for non-retryable file issues).
  - **Automatic Retries**: Retries transient network drops automatically before surfacing errors.
  - **Zero Tech Leakage**: No raw stack traces, port numbers, or infrastructure details exposed to users.

- **Cold-Start Pre-Warming**:
  - Silent background `/health` ping on mount to wake up sleeping free-tier backends (e.g., Render) before the user even uploads a document.

- **Desktop-Optimized Layout**:
  - Full hanging physics board active on desktop viewports ($\ge 1140\text{px}$).
  - Clean, minimal fallback gate screen for mobile/tablet screens.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vite.dev/)
- **Physics**: [Matter.js](https://brm.io/matter-js/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown**: [react-markdown](https://github.com/remarkjs/react-markdown)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/NIROOZbx/rag-tutorial-client.git
   cd rag-tutorial-client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Set your backend URL:
   ```env
   VITE_API_BASE_URL=https://rag-tutorial.onrender.com
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`.

---

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 🔌 Backend API Specification

This frontend connects to a RAG backend service (e.g. Go, Python, or Node.js) exposing the following REST endpoints:

| Endpoint | Method | Description |
|---|---|---|
| `/health` | `GET` | Health check endpoint used to wake the server |
| `/upload` | `POST` | Accepts `multipart/form-data` with a `document` file field (PDF up to 10 MB) |
| `/question` | `POST` | Accepts JSON `{"question": "...", "doc_id": "..."}` and returns `{"answer": "..."}` |

> **Note for Cross-Origin Deployments**: Ensure your backend has CORS enabled (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, OPTIONS`, and `Access-Control-Allow-Headers: Content-Type, Authorization`).

---

## 📄 License

This project is licensed under the MIT License.
