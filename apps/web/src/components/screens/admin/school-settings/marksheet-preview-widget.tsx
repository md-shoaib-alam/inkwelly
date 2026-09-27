import React from "react";

export function MarksheetTemplatePreviewWidget({ templateId, isEnabled }: { templateId: string, isEnabled: boolean }) {
  const getTemplateStyle = (id: string) => {
    switch (id) {
      case "classic":
        return {
          title: "Classic Academy Layout",
          badge: "Navy Traditional",
          containerClass: "border-blue-200 dark:border-blue-900/30 bg-white dark:bg-zinc-950/90 shadow-[0_0_12px_rgba(59,130,246,0.08)]",
          headerBg: "bg-blue-50 dark:bg-blue-955/80 border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400",
          accentText: "text-blue-600 dark:text-blue-400",
          tableBorder: "border-blue-100 dark:border-blue-950/50",
          badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
          isCompact: false,
          accentBg: "bg-blue-600",
        };
      case "modern":
        return {
          title: "Modern Minimalist Layout",
          badge: "Clean Slate",
          containerClass: "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 shadow-[0_0_12px_rgba(244,244,245,0.05)]",
          headerBg: "bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300",
          accentText: "text-zinc-700 dark:text-zinc-300",
          tableBorder: "border-zinc-200 dark:border-zinc-850",
          badgeClass: "bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50",
          isCompact: false,
          accentBg: "bg-zinc-400",
        };
      case "royal":
        return {
          title: "Royal Gold Elite Layout",
          badge: "Premium Gold",
          containerClass: "border-amber-200 dark:border-amber-500/30 bg-white dark:bg-zinc-950/90 shadow-[0_0_15px_rgba(245,158,11,0.12)]",
          headerBg: "bg-amber-50/55 dark:bg-slate-900 border-amber-200 dark:border-amber-500/40 text-amber-755 dark:text-amber-400",
          accentText: "text-amber-700 dark:text-amber-400",
          tableBorder: "border-amber-100 dark:border-amber-900/30",
          badgeClass: "bg-amber-500/10 text-amber-755 dark:text-amber-400 border border-amber-500/30 animate-pulse",
          isCompact: false,
          accentBg: "bg-amber-500",
        };
      case "creative":
        return {
          title: "Creative Compact Layout",
          badge: "Indigo Round",
          containerClass: "border-indigo-200 dark:border-indigo-900/30 bg-white dark:bg-zinc-950/90 shadow-[0_0_12px_rgba(99,102,241,0.1)]",
          headerBg: "bg-indigo-50 dark:bg-indigo-955/80 border-indigo-100 dark:border-indigo-900/40 text-indigo-650 dark:text-indigo-400 rounded-lg",
          accentText: "text-indigo-650 dark:text-indigo-400",
          tableBorder: "border-indigo-100 dark:border-indigo-950/50",
          badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
          isCompact: true,
          accentBg: "bg-indigo-600",
        };
      case "cbse":
        return {
          title: "CBSE Public School Layout",
          badge: "Formal CBSE",
          containerClass: "border-red-200 dark:border-red-900/30 bg-white dark:bg-zinc-950/90 shadow-[0_0_12px_rgba(239,68,68,0.08)]",
          headerBg: "bg-red-50 dark:bg-red-955/80 border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400",
          accentText: "text-red-650 dark:text-red-400",
          tableBorder: "border-red-100 dark:border-red-950/50",
          badgeClass: "bg-red-500/10 text-red-650 dark:text-red-400 border border-red-500/20",
          isCompact: false,
          accentBg: "bg-red-600",
        };
      case "icse":
        return {
          title: "ICSE Semester Layout",
          badge: "Academic Semi",
          containerClass: "border-cyan-200 dark:border-cyan-900/30 bg-white dark:bg-zinc-950/90 shadow-[0_0_12px_rgba(6,182,212,0.08)]",
          headerBg: "bg-cyan-50 dark:bg-cyan-955/80 border-cyan-100 dark:border-cyan-900/40 text-cyan-650 dark:text-cyan-400",
          accentText: "text-cyan-650 dark:text-cyan-400",
          tableBorder: "border-cyan-100 dark:border-cyan-950/50",
          badgeClass: "bg-cyan-500/10 text-cyan-650 dark:text-cyan-400 border border-cyan-500/20",
          isCompact: false,
          accentBg: "bg-cyan-600",
        };
      case "stateboard":
      default:
        return {
          title: "State Board Green-Elite",
          badge: "Green Elite",
          containerClass: "border-emerald-200 dark:border-emerald-900/30 bg-white dark:bg-zinc-950/90 shadow-[0_0_12px_rgba(16,185,129,0.08)]",
          headerBg: "bg-emerald-50 dark:bg-emerald-955/80 border-emerald-100 dark:border-emerald-900/40 text-emerald-650 dark:text-emerald-400",
          accentText: "text-emerald-650 dark:text-emerald-400",
          tableBorder: "border-emerald-100 dark:border-emerald-950/50",
          badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
          isCompact: false,
          accentBg: "bg-emerald-600",
        };
    }
  };

  const style = getTemplateStyle(templateId);

  return (
    <div className={`relative w-full max-w-[340px] h-[185px] border rounded-xl overflow-hidden flex flex-col p-2.5 transition-all duration-300 ${style.containerClass}`}>
      {/* Browser bar tab headers */}
      <div className="h-8 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-850 px-2.5 flex items-end gap-1.5 shrink-0 justify-between mb-1.5">
        <div className="flex items-center gap-1 mb-2">
          <span className="size-2 rounded-full bg-red-500/50" />
          <span className="size-2 rounded-full bg-yellow-500/50" />
          <span className="size-2 rounded-full bg-green-500/50" />
        </div>
        
        {/* Real browser tabs */}
        <div className="flex-1 flex gap-1 items-end max-w-[190px] h-6 overflow-hidden">
          <div className={`h-5 px-2 rounded-t-md text-[8px] font-medium flex items-center gap-1 shrink-0 transition-colors ${
            isEnabled ? "bg-white dark:bg-zinc-950 text-violet-655 dark:text-violet-400 border-t border-x border-zinc-200 dark:border-zinc-800" : "bg-zinc-100/60 dark:bg-zinc-900/60 text-zinc-400 dark:text-zinc-500"
          }`}>
            Portal
          </div>
          {!isEnabled && (
            <div className="h-5 px-2 rounded-t-md bg-white dark:bg-zinc-950 text-violet-655 dark:text-violet-400 border-t border-x border-zinc-200 dark:border-zinc-800/80 text-[8px] font-semibold flex items-center gap-1 animate-in slide-in-from-bottom-2 shrink-0">
              Marksheet
            </div>
          )}
        </div>

        <div className="flex items-center gap-0.5 mb-1.5 shrink-0">
          <span className="text-[7.5px] text-zinc-550 dark:text-zinc-400 font-semibold bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-1 py-0.5 rounded leading-none">
            {isEnabled ? "Inline" : "Separate"}
          </span>
        </div>
      </div>

      {/* Main mockup canvas */}
      <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-900/40 relative overflow-hidden flex flex-col justify-between p-1.5">
        {/* Mock dashboard base behind everything */}
        <div className="space-y-1.5 opacity-60">
          <div className="flex justify-between items-center px-1">
            <div className="h-2 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-sm" />
            <div className="h-2.5 w-8 bg-violet-500/10 border border-violet-500/20 rounded-sm" />
          </div>
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-zinc-200/60 dark:bg-zinc-855/55 rounded-sm" />
            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-900/60 rounded-sm" />
          </div>
        </div>

        {/* Mode-specific Overlay Visualizers */}
        {isEnabled ? (
          /* Inline Popover Dialog Modal Mode */
          <div className="absolute inset-0 bg-zinc-950/65 dark:bg-black/65 backdrop-blur-[0.5px] flex flex-col items-center justify-center p-2 transition-all duration-300 z-30 animate-in fade-in">
            {/* Explainer badge */}
            <div className="absolute top-1 text-[7px] text-zinc-700 dark:text-zinc-300 font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow select-none animate-pulse">
              <span className="size-1 bg-violet-500 rounded-full animate-ping" />
              <span>Modal overlay on same screen</span>
            </div>

            {/* Centralized popover report card */}
            <div className="w-[190px] h-[105px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-2xl flex flex-col p-1.5 justify-between scale-100 opacity-100 transition-all duration-300 ease-out transform animate-in zoom-in-95 mt-2.5">
              {/* Mini Modal Title Bar */}
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1 mb-1">
                <div className="flex items-center gap-1 overflow-hidden">
                  <span className="size-1 bg-violet-500 shrink-0" />
                  <span className="text-[6.5px] font-bold text-zinc-700 dark:text-zinc-300 truncate">{style.title}</span>
                </div>
                <span className="text-[6px] text-zinc-400 dark:text-zinc-550">✕</span>
              </div>
              
              {/* Mini Report Sheet Mockup */}
              <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-100 dark:border-zinc-850 p-1 flex flex-col gap-0.5 overflow-hidden">
                <div className="grid grid-cols-4 gap-0.5 border-b border-zinc-200 dark:border-zinc-900 pb-0.5 text-[4.5px] text-zinc-400 dark:text-zinc-555 font-bold">
                  <span>Subject</span>
                  <span>Marks</span>
                  <span>Grade</span>
                  <span className="text-right">Result</span>
                </div>
                <div className="grid grid-cols-4 gap-0.5 items-center text-[4.5px] text-zinc-655 dark:text-zinc-400">
                  <span className="text-zinc-800 dark:text-zinc-300 truncate font-semibold">Maths</span>
                  <span>95/100</span>
                  <span className={`font-semibold ${style.accentText}`}>{style.accentText.includes("blue") ? "A+" : style.accentText.includes("royal") ? "A" : "A+"}</span>
                  <span className="text-right text-emerald-600 dark:text-emerald-500 font-medium">Pass</span>
                </div>
              </div>

              {/* Action close button */}
              <div className="flex justify-between items-center mt-1 border-t border-zinc-100 dark:border-zinc-800 pt-0.5">
                <span className="text-[4.5px] text-zinc-400 dark:text-zinc-550">Esc key to exit</span>
                <span className="px-1 py-0.5 bg-violet-650 dark:bg-violet-600 rounded text-[5px] text-white font-semibold flex items-center leading-none">
                  Print Marksheet
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* New Tab Preview Mode */
          <div className="absolute inset-0 flex items-center justify-center p-2 transition-all duration-300 z-30 pointer-events-none animate-in fade-in">
            {/* Explainer badge */}
            <div className="absolute top-1 text-[7px] text-zinc-700 dark:text-zinc-300 font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow select-none">
              <span className="size-1 bg-violet-500 rounded-full animate-ping" />
              <span>Slides open in a separate tab</span>
            </div>

            {/* Click pointer indicator */}
            <div className="absolute left-[38%] top-[25%] size-5 z-40 animate-ping rounded-full border border-violet-500/40 bg-violet-500/10 duration-1000" />
            
            {/* The second overlapping page representing "New Browser Window/Tab" */}
            <div className="w-[185px] h-[105px] bg-white dark:bg-zinc-950 border border-violet-200 dark:border-violet-500/40 rounded-lg shadow-[0_4px_20px_rgba(139,92,246,0.12)] flex flex-col absolute right-2 bottom-1 translate-x-0 translate-y-0 z-20 scale-100 opacity-100 transition-all duration-500 ease-out transform animate-in slide-in-from-bottom-4 slide-in-from-right-4 mt-2.5">
              {/* Mini browser top bar of the new window */}
              <div className="h-4.5 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800/80 px-1.5 flex items-center gap-1 justify-between">
                <div className="flex items-center gap-0.5">
                  <span className="size-1 rounded-full bg-red-500/60" />
                  <span className="size-1 rounded-full bg-violet-500/60 animate-pulse" />
                </div>
                <div className="flex-1 mx-1.5 h-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded px-1 text-[5px] text-violet-650 dark:text-violet-400 font-mono flex items-center justify-center truncate">
                  school.edu/marksheet-preview-tab
                </div>
                <div className="size-1.5 bg-violet-500 rounded-full animate-ping shrink-0" />
              </div>

              {/* Content of the standalone tab */}
              <div className="flex-1 p-1 bg-white dark:bg-zinc-950 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-900 pb-0.5">
                  <span className="text-[5.5px] text-zinc-700 dark:text-zinc-300 font-semibold truncate">{style.title}</span>
                  <span className="text-[4.5px] text-violet-600 dark:text-violet-400 font-bold bg-violet-500/10 px-0.5 rounded">Standalone</span>
                </div>

                <div className="flex-1 my-1 border border-dashed border-zinc-200 dark:border-zinc-800 rounded p-0.5 flex flex-col gap-0.5 bg-zinc-50/50 dark:bg-zinc-900/40 justify-center">
                  <div className="flex items-center gap-1 justify-center">
                    <div className="flex flex-col gap-0.5 leading-tight">
                      <span className="text-[5px] text-zinc-650 dark:text-zinc-400">Class teacher copy</span>
                      <span className="text-[4px] text-zinc-450 dark:text-zinc-550 font-medium">Dual monitor print preview ready</span>
                    </div>
                  </div>
                </div>


                <div className="flex items-center justify-between text-[4px] text-zinc-400 dark:text-zinc-500">
                  <span>Zoom: 100%</span>
                  <span>Vector PDF Style</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
