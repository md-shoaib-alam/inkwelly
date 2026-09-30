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
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
}

/**
 * Generates an A4 or Letter vector PDF directly from an HTML string using Playwright (Chromium Skia/PDF).
 */
export async function generatePdfFromHtml({ html, format = 'A4', margin }: GeneratePdfOptions): Promise<Buffer> {
  const browser = await getBrowser();
  const paperFormat = format === 'Letter' ? 'Letter' : 'A4';
  const viewport = paperFormat === 'Letter'
    ? { width: 816, height: 1056 }
    : { width: 794, height: 1123 };

  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  try {
    await page.setContent(html, {
      waitUntil: 'load',
      timeout: 15000,
    });

    const defaultMargin = paperFormat === 'Letter'
      ? { top: '6mm', bottom: '6mm', left: '10mm', right: '10mm' }
      : { top: '8mm', bottom: '8mm', left: '10mm', right: '10mm' };

    const pdfUint8 = await page.pdf({
      format: paperFormat,
      printBackground: true,
      preferCSSPageSize: true,
      margin: margin || defaultMargin,
    });

    return Buffer.from(pdfUint8);
  } finally {
    await context.close().catch(() => {});
  }
}
