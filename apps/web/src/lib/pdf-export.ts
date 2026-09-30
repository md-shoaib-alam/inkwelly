import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export interface PDFExportOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  pageClassName: string;
  filename: string;
  orientation?: 'portrait' | 'landscape';
  width?: number; // in pixels
  height?: number; // in pixels
  onStart?: () => void;
  onProgress?: (current: number, total: number) => void;
  onComplete?: () => void;
  onError?: (error: any) => void;
}

export async function downloadContainerAsPDF({
  containerRef,
  pageClassName,
  filename,
  orientation = 'portrait',
  width = 794,
  height = 1123,
  onStart,
  onProgress,
  onComplete,
  onError,
}: PDFExportOptions) {
  if (!containerRef.current) {
    const err = new Error('Container reference not found');
    onError?.(err);
    return;
  }

  onStart?.();

  const container = containerRef.current;
  const pages = Array.from(container.getElementsByClassName(pageClassName));

  if (pages.length === 0) {
    const err = new Error(`No pages found with class name: ${pageClassName}`);
    console.error(err);
    onError?.(err);
    return;
  }

  // A4 dimensions in mm
  const a4WidthMM  = orientation === 'portrait' ? 210 : 297;
  const a4HeightMM = orientation === 'portrait' ? 297 : 210;

  const captureWidth = width || (orientation === 'portrait' ? 794 : 1123);

  // Offscreen container — must be visible so html-to-image can read styles
  const tempDiv = document.createElement('div');
  Object.assign(tempDiv.style, {
    position: 'fixed',
    left: '-9999px',
    top: '0',
    width: `${captureWidth}px`,
    display: 'block',
    backgroundColor: '#ffffff',
    // DO NOT set zIndex negative — html-to-image won't capture hidden layers
    zIndex: '9999',
  });
  document.body.appendChild(tempDiv);

  try {
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      // compress: false keeps PNG lossless inside the PDF
      compress: false,
    });

    const totalPages = pages.length;

    for (let i = 0; i < totalPages; i++) {
      const pageEl = pages[i];
      onProgress?.(i + 1, totalPages);

      const clonedPage = pageEl.cloneNode(true) as HTMLElement;

      Object.assign(clonedPage.style, {
        width: `${captureWidth}px`,
        height: height ? `${height}px` : 'auto',
        boxShadow: 'none',
        margin: '0',
        padding: '0',
        visibility: 'visible',
        opacity: '1',
        transform: 'none',
        // Force background colours to render — critical for coloured section bands
        colorScheme: 'light',
      });

      clonedPage.classList.remove('hidden', 'print:block', 'print:hidden', 'sm:hidden', 'md:hidden', 'lg:hidden');
      clonedPage.querySelectorAll('.hidden, .sm\\:hidden, .md\\:hidden').forEach(el => {
        (el as HTMLElement).style.display = 'block';
      });

      tempDiv.appendChild(clonedPage);

      // Give the browser time to paint fully (layout + CSS background colours)
      await new Promise(r => setTimeout(r, 200));

      // ── KEY FIX: toPng instead of toJpeg ─────────────────────────────
      // PNG is lossless: no compression artefacts, exact colours, sharp borders.
      // pixelRatio:3 means we render at 3× resolution → silky text when scaled to A4.
      const dataUrl = await toPng(clonedPage, {
        pixelRatio: 3,                      // 3× sharpness (was 2×)
        backgroundColor: '#ffffff',
        width: captureWidth,
        height: height || clonedPage.offsetHeight,
        cacheBust: true,
        // Force all background colours to paint (works around Safari/mobile quirks)
        style: {
          colorScheme: 'light',
        },
        // Skip CORS-blocked external images rather than crashing
        skipFonts: false,
        fetchRequestInit: { mode: 'cors' },
      });

      tempDiv.removeChild(clonedPage);

      if (i > 0) pdf.addPage();

      // Add as PNG — no lossy recompression, exact colours
      pdf.addImage(
        dataUrl,
        'PNG',            // was 'JPEG'
        0, 0,
        a4WidthMM, a4HeightMM,
        undefined,
        'NONE',           // was 'FAST' — no additional compression on the already-lossless PNG
      );
    }

    const safeFilename = filename.replace(/[/\\?%*:|"<>]/g, '-');
    pdf.save(safeFilename);
    onComplete?.();
  } catch (error) {
    console.error('PDF export failed:', error);
    onError?.(error);
  } finally {
    if (tempDiv.parentNode) document.body.removeChild(tempDiv);
  }
}
