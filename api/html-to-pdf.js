// api/html-to-pdf.js
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { html } = req.body || {};

    if (!html || typeof html !== 'string') {
      res.status(400).json({ error: 'Missing or invalid html' });
      return;
    }

    const executablePath = await chromium.executablePath;

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        bottom: '15mm',
        left: '10mm',
        right: '10mm'
      }
    });

    await browser.close();

    const base64 = pdfBuffer.toString('base64');

    res.status(200).json({ pdf: base64 });
  } catch (error) {
    console.error('Vercel html-to-pdf error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}
