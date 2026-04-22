const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const { incrementCounter, getCount } = require("./counter");

const app = express();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

// EXPORT PDF ROUTE
app.post("/export", async (req, res) => {
  let browser;

  try {
    const { html } = req.body;

    if (!html || typeof html !== "string") {
      return res.status(400).json({ error: "Missing HTML content." });
    }

    // 🔥 Puppeteer launch FIXED for Render
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    });

    const page = await browser.newPage();

    // Set HTML content
    await page.setContent(
      `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @page {
              margin: 0;
            }

            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              background: white;
            }

            .pdf-page {
              page-break-after: always;
            }

            .pdf-page:last-child {
              page-break-after: auto;
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
      `,
      {
        waitUntil: "networkidle0",
        timeout: 30000
      }
    );

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true
    });

    incrementCounter();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=edited.pdf"
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error("PDF generation failed:", error);

    res.status(500).json({
      error: error?.message || "PDF generation failed"
    });

  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// COUNTER ROUTE
app.get("/count", (req, res) => {
  res.json({ count: getCount() });
});

// PORT FIX FOR RENDER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});