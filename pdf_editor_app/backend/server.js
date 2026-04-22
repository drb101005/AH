const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const { incrementCounter, getCount } = require("./counter");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.post("/export", async (req, res) => {
  let browser;

  try {
    const { html } = req.body;

    if (!html || typeof html !== "string") {
      return res.status(400).json({ error: "Missing HTML content." });
    }

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

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
                padding: 0;
                background: white;
              }

              .pdf-document {
                width: fit-content;
                margin: 0 auto;
              }

              .pdf-page {
                page-break-after: always;
                overflow: hidden;
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
      { waitUntil: "domcontentloaded" }
    );

    const pdfBuffer = await page.pdf({
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
      error: error && error.message ? error.message : "PDF generation failed"
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.get("/count", (req, res) => {
  res.json({ count: getCount() });
});

// app.listen(5000, () => {
//   console.log("Backend running on http://localhost:5000");
// });
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});