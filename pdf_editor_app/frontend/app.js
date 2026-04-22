import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.394/build/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.394/build/pdf.worker.min.mjs";

const backendUrl = "http://localhost:5000";
const renderScale = 1.5;

const fileInput = document.getElementById("fileInput");
const loadBtn = document.getElementById("loadBtn");
const downloadBtn = document.getElementById("downloadBtn");
const editor = document.getElementById("editor");
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");

let hasRenderedLayout = false;

loadBtn.addEventListener("click", loadPDF);
downloadBtn.addEventListener("click", downloadPDF);
editor.addEventListener("keydown", handleEditorKeydown);
editor.addEventListener("paste", handleEditorPaste);

loadCount();
setEmptyEditorState();

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function setEmptyEditorState() {
  if (hasRenderedLayout) {
    editor.classList.remove("is-empty");
    return;
  }

  editor.classList.add("is-empty");
  editor.textContent = "PDF layout will appear here.";
}

async function loadPDF() {
  const file = fileInput.files[0];

  if (!file) {
    setStatus("Please choose a PDF file first.", true);
    return;
  }

  setStatus("Reading PDF layout...");

  try {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pageMarkup = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: renderScale });
      const backgroundImage = await renderPageBackground(page, viewport);
      const textContent = await page.getTextContent();

      pageMarkup.push(
        renderPageMarkup(pageNumber, viewport, backgroundImage, textContent.items)
      );
    }

    hasRenderedLayout = true;
    editor.classList.remove("is-empty");
    editor.innerHTML = pageMarkup.join("");

    setStatus(
      `Loaded ${pdf.numPages} page${pdf.numPages === 1 ? "" : "s"} with original graphics preserved.`
    );
    await loadCount();
  } catch (error) {
    console.error("Failed to read PDF:", error);
    hasRenderedLayout = false;
    setEmptyEditorState();
    setStatus("Could not read that PDF.", true);
  }
}

async function renderPageBackground(page, viewport) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  await page.render({
    canvasContext: context,
    viewport
  }).promise;

  return canvas.toDataURL("image/png");
}

function renderPageMarkup(pageNumber, viewport, backgroundImage, items) {
  const spans = items
    .filter((item) => "str" in item && item.str)
    .map((item, index) => {
      const matrix = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const left = round(matrix[4]);
      const fontSize = round(Math.max(Math.hypot(matrix[2], matrix[3]), 8));
      const top = round(matrix[5] - fontSize);
      const width = round(Math.max(item.width * viewport.scale, 2));
      const height = round(Math.max(fontSize * 1.15, 10));
      const fontFamily = escapeAttribute(item.fontName || "sans-serif");

      return [
        `<span class="editor-text" contenteditable="true" spellcheck="false"`,
        ` data-page="${pageNumber}"`,
        ` data-index="${index}"`,
        ` data-left="${left}"`,
        ` data-top="${top}"`,
        ` data-width="${width}"`,
        ` data-height="${height}"`,
        ` data-font-size="${fontSize}"`,
        ` data-font-family="${fontFamily}"`,
        ` style="left:${left}px; top:${top}px; width:${width}px; min-height:${height}px;`,
        ` font-size:${fontSize}px; font-family:${fontFamily};">`,
        `${escapeHtml(item.str)}`,
        `</span>`
      ].join("");
    })
    .join("");

  return [
    `<div class="editor-page" data-page="${pageNumber}"`,
    ` style="width:${round(viewport.width)}px; height:${round(viewport.height)}px;">`,
    `<img class="editor-page-image" src="${backgroundImage}" alt="PDF page ${pageNumber} background">`,
    `<div class="editor-overlay">`,
    spans,
    `</div>`,
    `</div>`
  ].join("");
}

async function downloadPDF() {
  if (!hasRenderedLayout || !editor.querySelector(".editor-page")) {
    setStatus("Load a PDF layout before exporting.", true);
    return;
  }

  setStatus("Generating PDF...");

  try {
    const response = await fetch(`${backendUrl}/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        html: buildExportHtml()
      })
    });

    if (!response.ok) {
      let message = `Export failed with status ${response.status}`;

      try {
        const errorData = await response.json();
        if (errorData.error) {
          message = errorData.error;
        }
      } catch {
        // Keep the fallback message if the response is not JSON.
      }

      throw new Error(message);
    }

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = "edited.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);

    setStatus("PDF downloaded.");
    await loadCount();
  } catch (error) {
    console.error("Failed to export PDF:", error);
    setStatus(`Could not create the PDF: ${error.message}`, true);
  }
}

function buildExportHtml() {
  const pages = Array.from(editor.querySelectorAll(".editor-page")).map((page) => {
    const width = page.style.width;
    const height = page.style.height;
    const backgroundImage = page.querySelector(".editor-page-image")?.src || "";
    const spans = Array.from(page.querySelectorAll(".editor-text")).map((span) => {
      const left = span.dataset.left;
      const top = span.dataset.top;
      const widthValue = span.dataset.width;
      const heightValue = span.dataset.height;
      const fontSize = span.dataset.fontSize;
      const fontFamily = span.dataset.fontFamily;
      const text = span.textContent || "";

      return [
        `<span style="position:absolute; left:${left}px; top:${top}px; width:${widthValue}px;`,
        ` min-height:${heightValue}px; font-size:${fontSize}px; font-family:${fontFamily};`,
        ` white-space:pre; color:#111827; background:rgba(255,255,255,0.94);">`,
        `${escapeHtml(text)}`,
        `</span>`
      ].join("");
    }).join("");

    return [
      `<div class="pdf-page" style="position:relative; width:${width}; height:${height};">`,
      `<img src="${backgroundImage}" style="position:absolute; inset:0; width:100%; height:100%; object-fit:fill;" alt="">`,
      spans,
      `</div>`
    ].join("");
  });

  return `<div class="pdf-document">${pages.join("")}</div>`;
}

async function loadCount() {
  try {
    const response = await fetch(`${backendUrl}/count`);

    if (!response.ok) {
      throw new Error(`Count request failed with status ${response.status}`);
    }

    const data = await response.json();
    countEl.textContent = `Used: ${data.count} time${data.count === 1 ? "" : "s"}`;
  } catch (error) {
    console.error("Failed to load count:", error);
    countEl.textContent = "Backend not connected.";
  }
}

function handleEditorKeydown(event) {
  if (!event.target.classList.contains("editor-text")) {
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
  }
}

function handleEditorPaste(event) {
  if (!event.target.classList.contains("editor-text")) {
    return;
  }

  event.preventDefault();

  const pastedText = event.clipboardData?.getData("text/plain") || "";
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    event.target.textContent += pastedText.replace(/\r?\n/g, " ");
    return;
  }

  selection.deleteFromDocument();
  selection.getRangeAt(0).insertNode(document.createTextNode(pastedText.replace(/\r?\n/g, " ")));
  selection.collapseToEnd();
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return value.replace(/"/g, "&quot;");
}
