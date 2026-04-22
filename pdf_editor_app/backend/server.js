const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const { incrementCounter, getCount } = require("./counter");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Export edited HTML → PDF
app.post("/export", async (req, res) => {
  try {
    const { html } = req.body;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(`
      <html>
        <body style="font-family: Arial; padding: 40px;">
          ${html}
        </body>
      </html>
    `);

    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    incrementCounter();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=edited.pdf"
    });

    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).send("PDF generation failed");
  }
});

// usage count
app.get("/count", (req, res) => {
  res.json({ count: getCount() });
});

app.listen(5000, () => console.log("Backend running on port 5000"));