import { MARKSHEET_TEMPLATES, ClassicAcademy } from "../exams/marksheet-templates";
import { createRoot } from "react-dom/client";
import { toast } from "sonner";
import * as React from "react";

const MOCK_PREVIEW_SHEET = {
  sheet: {
    studentName: "Aarav Sharma",
    rollNumber: "2026-A104",
    schoolName: "St. Xavier's High School",
    subjects: [
      {
        subjectName: "Mathematics",
        midtermMarks: "42/50",
        finalMarks: "88/100",
        obtained: "88",
        percentage: 88,
        status: "pass" as const,
      },
      {
        subjectName: "Science",
        midtermMarks: "45/50",
        finalMarks: "92/100",
        obtained: "92",
        percentage: 92,
        status: "pass" as const,
      },
      {
        subjectName: "English Language",
        midtermMarks: "40/50",
        finalMarks: "85/100",
        obtained: "85",
        percentage: 85,
        status: "pass" as const,
      },
      {
        subjectName: "Social Science",
        midtermMarks: "38/50",
        finalMarks: "79/100",
        obtained: "79",
        percentage: 79,
        status: "pass" as const,
      },
      {
        subjectName: "Computer Applications",
        midtermMarks: "48/50",
        finalMarks: "96/100",
        obtained: "96",
        percentage: 96,
        status: "pass" as const,
      },
    ],
    totalMaxMarks: 500,
    totalObtainedMarks: 440,
    overallPercentage: 88,
    grade: "A+",
    remarks: "Excellent academic performance! Aarav demonstrates strong analytical thinking and consistency across all subjects.",
    color: "#1e3a8a",
    status: "pass" as const,
  },
  classNameStr: "Grade X",
  classSection: "A",
  academicYear: "2025–2026",
  marksheetType: "midterm" as const,
};

export function handleMarksheetPreview(templateId: string) {
  const selectedTemplate = MARKSHEET_TEMPLATES.find((t) => t.id === templateId) || MARKSHEET_TEMPLATES[0];
  const PreviewComponent = selectedTemplate.component || ClassicAcademy;

  const previewWindow = window.open("", "_blank");
  if (!previewWindow) {
    toast.error("Popup blocked! Please allow popups to view the marksheet preview.");
    return;
  }

  // Build standard document structure with our custom viewer styling
  previewWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Marksheet Preview - ${selectedTemplate.name}</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
          color: #0f172a;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        
        /* Top bar styling */
        .toolbar {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
          color: #ffffff;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .toolbar-title {
          font-size: 0.875rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          letter-spacing: 0.025em;
        }
        
        .toolbar-badge {
          font-size: 0.7rem;
          font-weight: 600;
          color: #a78bfa;
          background-color: rgba(139, 92, 246, 0.15);
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          border: 1px solid rgba(139, 92, 246, 0.2);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .toolbar-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .zoom-controls {
          display: flex;
          align-items: center;
          background-color: rgba(15, 23, 42, 0.6);
          padding: 0.25rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .zoom-btn {
          background: none;
          border: none;
          color: #94a3b8;
          padding: 0.25rem 0.625rem;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          border-radius: 0.25rem;
          transition: all 0.15s ease;
        }
        
        .zoom-btn:hover {
          color: #ffffff;
          background-color: rgba(255, 255, 255, 0.08);
        }
        
        .zoom-btn.active {
          color: #ffffff;
          background-color: #8b5cf6;
        }
        
        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #10b981;
          border: none;
          color: #ffffff;
          padding: 0.45rem 1rem;
          font-size: 0.75rem;
          font-weight: 700;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
        }
        
        .action-btn:hover {
          background-color: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);
        }
        
        .action-btn-secondary {
          background-color: rgba(255, 255, 255, 0.1);
          color: #f1f5f9;
          box-shadow: none;
        }
        
        .action-btn-secondary:hover {
          background-color: rgba(255, 255, 255, 0.15);
          color: #ffffff;
          box-shadow: none;
        }
        
        .viewer-container {
          flex: 1;
          overflow: auto;
          padding: 2.5rem;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          background-color: #f1f5f9;
          background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
          background-size: 16px 16px;
        }
        
        .paper-shadow {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-radius: 0.5rem;
          background-color: #ffffff;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.05);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #ffffff !important;
          }
          .viewer-container {
            padding: 0 !important;
            background: none !important;
            overflow: visible !important;
          }
          .paper-shadow {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            width: 794px !important;
            height: 1123px !important;
            transform: none !important;
          }
          #preview-root {
            transform: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="toolbar no-print">
        <div class="toolbar-title">
          <span style="font-size: 1.1rem;">📄</span>
          <span>Marksheet Preview</span>
          <span class="toolbar-badge">${selectedTemplate.name}</span>
        </div>
        
        <div class="toolbar-actions">
          <div class="zoom-controls">
            <button class="zoom-btn" id="zoom-out" title="Zoom Out">−</button>
            <span class="zoom-btn active" style="cursor: default;" id="zoom-label">60%</span>
            <button class="zoom-btn" id="zoom-in" title="Zoom In">+</button>
          </div>
          
          <button class="action-btn" id="print-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print
          </button>
          
          <button class="action-btn action-btn-secondary" id="close-btn">
            Close Preview
          </button>
        </div>
      </div>
      
      <div class="viewer-container">
        <div class="paper-shadow" id="paper-sheet" style="width: ${794 * 0.6}px; height: ${1123 * 0.6}px;">
          <div id="preview-root" style="width: 794px; height: 1123px; transform: scale(0.6); transform-origin: top left;">
          </div>
        </div>
      </div>
      
      <script>
        let currentZoom = 0.6;
        const paperSheet = document.getElementById('paper-sheet');
        const previewRoot = document.getElementById('preview-root');
        const zoomLabel = document.getElementById('zoom-label');
        
        function updateZoom(newZoom) {
          currentZoom = Math.min(Math.max(newZoom, 0.4), 1.5);
          previewRoot.style.transform = \`scale(\${currentZoom})\`;
          paperSheet.style.width = \`\${794 * currentZoom}px\`;
          paperSheet.style.height = \`\${1123 * currentZoom}px\`;
          zoomLabel.textContent = \`\${Math.round(currentZoom * 100)}%\`;
        }
        
        document.getElementById('zoom-in').addEventListener('click', () => {
          updateZoom(currentZoom + 0.1);
        });
        
        document.getElementById('zoom-out').addEventListener('click', () => {
          updateZoom(currentZoom - 0.1);
        });
        
        document.getElementById('print-btn').addEventListener('click', () => {
          window.print();
        });
        
        document.getElementById('close-btn').addEventListener('click', () => {
          window.close();
        });
      </script>
    </body>
    </html>
  `);
  previewWindow.document.close();

  // Copy CSS and stylesheets
  // 1. Copy link and style elements
  Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach((styleNode) => {
    previewWindow.document.head.appendChild(styleNode.cloneNode(true));
  });

  // 2. Clone active stylesheets directly
  try {
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        if (sheet.href) {
          const link = previewWindow.document.createElement('link');
          link.rel = 'stylesheet';
          link.href = sheet.href;
          previewWindow.document.head.appendChild(link);
        } else if (sheet.cssRules) {
          const style = previewWindow.document.createElement('style');
          Array.from(sheet.cssRules).forEach((rule) => {
            style.appendChild(previewWindow.document.createTextNode(rule.cssText));
          });
          previewWindow.document.head.appendChild(style);
        }
      } catch (e) {
        // Ignore cross-origin rules access restrictions
      }
    });
  } catch (e) {
    console.warn("Failed to copy stylesheet rules directly:", e);
  }

  // Mount React Component
  const container = previewWindow.document.getElementById("preview-root");
  if (container) {
    const root = createRoot(container);
    root.render(React.createElement(PreviewComponent, MOCK_PREVIEW_SHEET));
  }
}
