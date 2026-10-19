# PDF Text Editor

A browser-based PDF text editor. Load a PDF to preserve its page graphics and
positioned text, edit the text in the browser, and export the edited document as
a PDF.

## Project layout

- `frontend/` contains the static browser app (HTML, CSS, and JavaScript).
- `backend/` contains the Express API, which uses Puppeteer to generate PDFs.

## Requirements

- Node.js and npm
- Python 3 (for the simple frontend development server), or another static
  file server
- Internet access when loading the frontend, to download PDF.js from jsDelivr
- A supported Chrome/Chromium installation for Puppeteer. The backend's npm
  install runs Puppeteer's browser installation step.

## Run locally

Open two terminals in the `pdf_editor_app` directory.

### 1. Install and start the backend

In the first terminal:

```bash
cd backend
npm install
npm start
```

The API listens on `http://localhost:5000` by default. Leave this terminal
running.

### 2. Serve the frontend

In the second terminal, from the `pdf_editor_app` directory:

```bash
python3 -m http.server 8000 --directory frontend
```

On Windows, use `python` if `python3` is not available. Alternatively, change
into `frontend/` and run `python -m http.server 8000`.

Open <http://localhost:8000> in your browser. Choose a PDF, select **Load PDF
Layout**, edit the displayed text, and select **Download PDF** to export it.

The frontend is static and does not have a separate build or npm start command.
It loads PDF.js from a CDN, so the browser needs internet access.

## Backend API

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/export` | Accepts JSON with an `html` string and returns a generated PDF. |
| `GET` | `/count` | Returns the number of successful PDF exports as JSON. |

The export endpoint expects a request body like:

```json
{
  "html": "<div>Content to render</div>"
}
```

## Configuration

- The backend uses the `PORT` environment variable if set; otherwise it listens
  on port `5000`.
- If Puppeteer should use a specific Chrome/Chromium executable, set
  `PUPPETEER_EXECUTABLE_PATH` before starting the backend.
- The frontend currently connects to `http://localhost:5000`. If you change the
  backend host or port, update `backendUrl` near the top of
  `frontend/app.js` to match.
- Export counts are stored in `backend/count.txt`. Keep this file writable by
  the backend process.

## Troubleshooting

- **“Backend not connected” or export fails:** Make sure the backend is running
  on port `5000` and that the frontend's `backendUrl` matches it.
- **Puppeteer cannot find Chrome:** Run `npm install` in `backend/` to trigger
  the browser installation, or set `PUPPETEER_EXECUTABLE_PATH` to an installed
  Chrome/Chromium executable.
- **PDF.js does not load:** Check the browser's internet connection and allow
  access to `cdn.jsdelivr.net`.
- **The page does not load correctly:** Serve the frontend over HTTP as shown
  above instead of opening `index.html` directly as a `file://` URL.
