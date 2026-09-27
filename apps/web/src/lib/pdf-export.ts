import { toJpeg } from 'html-to-image';
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
  const a4WidthMM = orientation === 'portrait' ? 210 : 297;
  const a4HeightMM = orientation === 'portrait' ? 297 : 210;

  // Create temporary offscreen container
  const tempDiv = document.createElement('div');
  // Use a fixed width for the capture container that matches our 'master' desktop standard
  // This prevents mobile responsive breakpoints from triggering during capture
  const captureWidth = width || (orientation === 'portrait' ? 794 : 1123);

  Object.assign(tempDiv.style, {
    position: 'absolute',
    left: '-9999px',
    top: '0',
    width: `${captureWidth}px`,
    display: 'block',
    backgroundColor: '#ffffff',
    zIndex: '-1',
  });
  document.body.appendChild(tempDiv);

  try {
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const totalPages = pages.length;
    const batchSize = 1; 

    for (let i = 0; i < totalPages; i += batchSize) {
      const currentBatch = pages.slice(i, i + batchSize);

      const imageDataBatch = await Promise.all(currentBatch.map(async (pageEl, index) => {
        const pageIdx = i + index;
        onProgress?.(pageIdx + 1, totalPages);

        const clonedPage = pageEl.cloneNode(true) as HTMLElement;
        
        // Force the clone to ignore all device-specific scaling and responsive hidden/visible classes
        Object.assign(clonedPage.style, {
          width: `${captureWidth}px`,
          height: height ? `${height}px` : 'auto',
          boxShadow: 'none',
          border: 'none',
          margin: '0',
          padding: '0',
          visibility: 'visible',
          opacity: '1',
          transform: 'none', // Critical: ignore any parent scaling
        });

        // Strip any responsive utility classes that might hide elements on mobile
        clonedPage.classList.remove('hidden', 'print:block', 'print:hidden', 'sm:hidden', 'md:hidden', 'lg:hidden');
        clonedPage.querySelectorAll('.hidden, .sm\\:hidden, .md\\:hidden').forEach(el => {
          (el as HTMLElement).style.display = 'block';
        });

        tempDiv.appendChild(clonedPage);

        // Wait for layout stability
        await new Promise(r => setTimeout(r, 150));

        const dataUrl = await toJpeg(clonedPage, {
          quality: 0.98,
          pixelRatio: 2, 
          backgroundColor: '#ffffff',
          width: captureWidth,
          height: height || clonedPage.offsetHeight,
          cacheBust: true,
        });

        tempDiv.removeChild(clonedPage);
        return dataUrl;
      }));

      imageDataBatch.forEach((imgData, index) => {
        const pageIdx = i + index;
        if (pageIdx > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, a4WidthMM, a4HeightMM, undefined, 'FAST');
      });
    }

    // Sanitize filename to be safe
    const safeFilename = filename.replace(/[/\\?%*:|"<>]/g, '_');
    pdf.save(safeFilename);
    onComplete?.();
  } catch (error) {
    console.error('PDF export failed:', error);
    onError?.(error);
  } finally {
    if (tempDiv.parentNode) document.body.removeChild(tempDiv);
  }
}
