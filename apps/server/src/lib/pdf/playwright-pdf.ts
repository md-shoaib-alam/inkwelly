import { chromium, type Browser } from 'playwright';
import { logger } from '../logger';

let browserInstance: Browser | null = null;
let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  if (browserPromise) {
    return browserPromise;
  }

  browserPromise = (async () => {
    try {
      // Prefer installed playwright chromium, fallback to system chrome
      let browser: Browser;
      try {
        browser = await chromium.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--font-render-hinting=medium',
          ],
        });
      } catch (err: any) {
        logger.warn({ msg: 'Default chromium launch failed, falling back to chrome channel', error: err?.message });
        browser = await chromium.launch({
          channel: 'chrome',
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
          ],
        });
      }

      browserInstance = browser;
      browser.on('disconnected', () => {
        browserInstance = null;
        browserPromise = null;
      });

      return browser;
    } catch (error) {
      browserPromise = null;
      logger.error({ msg: 'Failed to launch Playwright browser', error });
      throw error;
    }
  })();

  return browserPromise;
}

export interface GeneratePdfOptions {
  html: string;
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
}

/**
 * Generates an A4 vector PDF directly from an HTML string using Playwright (Chromium Skia/PDF).
 */
export async function generatePdfFromHtml({ html, margin }: GeneratePdfOptions): Promise<Buffer> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: 794, height: 1123 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  try {
    // Set HTML content and wait for network/images to finish loading
    await page.setContent(html, {
      waitUntil: 'load',
      timeout: 15000,
    });

    // Generate A4 PDF with exact print background colors
    const pdfUint8 = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: margin || {
        top: '10mm',
        bottom: '10mm',
        left: '12mm',
        right: '12mm',
      },
    });

    return Buffer.from(pdfUint8);
  } finally {
    await context.close().catch(() => {});
  }
}
