import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.394/build/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.394/build/pdf.worker.min.mjs";

const backendUrl = "http://localhost:5000";

const fileInput = document.getElementById("fileInput");
const loadBtn = document.getElementById("loadBtn");
const downloadBtn = document.getElementById("downloadBtn");
const editor = document.getElementById("editor");
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");

loadBtn.addEventListener("click", loadPDF);
downloadBtn.addEventListener("click", downloadPDF);

loadCount();

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

async function loadPDF() {
  const file = fileInput.files[0];

  if (!file) {
    setStatus("Please choose a PDF file first.", true);
    return;
  }

  setStatus("Reading PDF...");

  try {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .trim();

      pages.push(pageText);
    }

    editor.value = pages.join("\n\n").trim();
    setStatus(`Loaded ${pdf.numPages} page${pdf.numPages === 1 ? "" : "s"}.`);
    await loadCount();
  } catch (error) {
    console.error("Failed to read PDF:", error);
    setStatus("Could not read that PDF.", true);
  }
}

async function downloadPDF() {
  const text = editor.value.trim();

  if (!text) {
    setStatus("There is no text to export.", true);
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
        html: toSafeHtml(text)
      })
    });

    if (!response.ok) {
      throw new Error(`Export failed with status ${response.status}`);
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
    setStatus("Could not create the PDF.", true);
  }
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

function toSafeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\r?\n/g, "<br>");
}
