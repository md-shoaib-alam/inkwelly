import React from "react";

export function PrintSheetModePreview({ isEnabled }: { isEnabled: boolean }) {
  return (
    <div className="relative w-full max-w-[340px] h-[185px] bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xl select-none mx-auto lg:mx-0 flex flex-col transition-all duration-300">
      {/* Dynamic Simulated Browser Tabs Bar */}
      <div className="h-8 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-850 px-2.5 flex items-end gap-1.5 shrink-0 justify-between">
        {/* Window controls */}
        <div className="flex items-center gap-1 mb-2">
          <span className="size-2 rounded-full bg-red-500/50" />
          <span className="size-2 rounded-full bg-yellow-500/50" />
          <span className="size-2 rounded-full bg-green-500/50" />
        </div>
        
        {/* Real-looking browser tabs! */}
        <div className="flex-1 flex gap-1 items-end max-w-[210px] h-6 overflow-hidden">
          {/* Main App Tab */}
          <div className={`h-5 px-2 rounded-t-md text-[8px] font-medium flex items-center gap-1 shrink-0 transition-colors duration-200 ${
            isEnabled ? "bg-white dark:bg-zinc-950 text-emerald-650 dark:text-emerald-400 border-t border-x border-zinc-200 dark:border-zinc-800" : "bg-zinc-100/60 dark:bg-zinc-900/60 text-zinc-400 dark:text-zinc-500"
          }`}>
            Admin Portal
          </div>
          
          {/* Standalone Tab */}
          {!isEnabled && (
            <div className="h-5 px-2 rounded-t-md bg-white dark:bg-zinc-950 text-emerald-650 dark:text-emerald-400 border-t border-x border-zinc-200 dark:border-zinc-800/80 text-[8px] font-semibold flex items-center gap-1 animate-in slide-in-from-bottom-2 duration-300 shrink-0">
              Print Sheet
            </div>
          )}
        </div>

        {/* Tab badge indicator */}
        <div className="flex items-center gap-1 mb-1.5">
          <span className="text-[7.5px] text-zinc-600 dark:text-zinc-400 font-semibold bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-1 py-0.5 rounded leading-none shrink-0">
            {isEnabled ? "Inline" : "Separate"}
          </span>
        </div>
      </div>

      {/* Main mockup canvas */}
      <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-900/40 p-3 relative overflow-hidden flex flex-col justify-between">
        {/* Mock dashboard base behind everything */}
        <div className="space-y-2 opacity-60">
          {/* Header Row */}
          <div className="flex justify-between items-center">
            <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-sm" />
            <div className="h-3.5 w-10 bg-emerald-500/10 border border-emerald-500/20 rounded-sm" />
          </div>
          
          {/* Fake Table Grid */}
          <div className="space-y-1">
            <div className="h-2 w-full bg-zinc-200/55 dark:bg-zinc-800/50 rounded-sm flex items-center px-1 gap-1">
              <div className="h-1 w-4 bg-zinc-300 dark:bg-zinc-700 rounded-sm" />
              <div className="h-1 w-6 bg-zinc-300 dark:bg-zinc-700 rounded-sm" />
              <div className="h-1 w-8 bg-zinc-300 dark:bg-zinc-700 rounded-sm" />
            </div>
            {["row-1", "row-2"].map((rowId) => (
              <div key={rowId} className="h-2 w-full bg-zinc-105/60 dark:bg-zinc-900/60 rounded-sm flex items-center px-1 gap-1 border-t border-zinc-100 dark:border-zinc-800/30">
                <div className="h-1 w-3 bg-zinc-200 dark:bg-zinc-800 rounded-sm" />
                <div className="h-1 w-5 bg-zinc-200 dark:bg-zinc-800 rounded-sm" />
                <div className="h-1 w-7 bg-zinc-200 dark:bg-zinc-800 rounded-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Mode-specific Overlay Visualizers */}
        {isEnabled ? (
          /* Inline Popover Dialog Modal Mode */
          <div className="absolute inset-0 bg-zinc-950/65 dark:bg-black/65 backdrop-blur-[0.5px] flex flex-col items-center justify-center p-2.5 transition-all duration-300 z-30 animate-in fade-in">
            {/* Explainer badge */}
            <div className="absolute top-1 text-[7.5px] text-zinc-700 dark:text-zinc-300 font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded-full flex items-center gap-1 select-none shadow">
              <span className="size-1 bg-emerald-500 rounded-full animate-ping" />
              <span>Modal overlay on the current screen</span>
            </div>

            <div className="w-[190px] h-[105px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-2xl flex flex-col p-2 justify-between scale-100 opacity-100 transition-all duration-300 ease-out transform animate-in zoom-in-95 mt-2.5">
              {/* Mini Modal Title Bar */}
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1 mb-1">
                <div className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[7px] font-bold text-zinc-755 dark:text-zinc-300">Inline Preview Dialog</span>
                </div>
                <span className="text-[7px] text-zinc-400 dark:text-zinc-555 hover:text-zinc-650 dark:hover:text-zinc-300 cursor-pointer">✕</span>
              </div>
              
              {/* Mini Report Sheet Mockup */}
              <div className="flex-1 bg-zinc-50 dark:bg-zinc-950/95 rounded border border-zinc-150 dark:border-zinc-800/60 p-1 flex flex-col gap-1 overflow-hidden">
                <div className="grid grid-cols-4 gap-0.5 border-b border-zinc-200 dark:border-zinc-900 pb-0.5">
                  <span className="text-[5px] text-zinc-400 dark:text-zinc-555 font-bold">Roll</span>
                  <span className="text-[5px] text-zinc-400 dark:text-zinc-555 font-bold">Student</span>
                  <span className="text-[5px] text-zinc-400 dark:text-zinc-555 font-bold">GPA</span>
                  <span className="text-[5px] text-zinc-400 dark:text-zinc-555 font-bold">Status</span>
                </div>
                <div className="grid grid-cols-4 gap-0.5 items-center">
                  <span className="text-[5px] text-zinc-550 dark:text-zinc-400">101</span>
                  <span className="text-[5px] text-zinc-700 dark:text-zinc-300 truncate font-medium">A. Khan</span>
                  <span className="text-[5px] text-emerald-600 dark:text-emerald-400 font-bold">4.00</span>
                  <span className="text-[4px] px-0.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-sm font-semibold w-fit">Pass</span>
                </div>
              </div>

              {/* Mini Modal Action Button */}
              <div className="flex justify-between items-center mt-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-[5px] text-zinc-400 dark:text-zinc-500">Esc key to exit modal</span>
                <span className="px-1 py-0.5 bg-emerald-600 rounded text-[5px] text-white font-semibold flex items-center leading-none">
                  Print
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* New Tab Preview Mode */
          <div className="absolute inset-0 flex items-center justify-center p-3 transition-all duration-300 z-30 pointer-events-none animate-in fade-in">
            {/* Explainer badge */}
            <div className="absolute top-1 text-[7.5px] text-zinc-700 dark:text-zinc-300 font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded-full flex items-center gap-1 select-none shadow">
              <span className="size-1 bg-emerald-500 rounded-full animate-ping" />
              <span>Slides open in a separate new tab</span>
            </div>

            {/* Click pointer indicator */}
            <div className="absolute left-[38%] top-[25%] size-5 z-40 animate-ping rounded-full border border-emerald-500/40 bg-emerald-500/10 duration-1000" />
            
            {/* The second overlapping page representing "New Browser Window/Tab" */}
            <div className="w-[185px] h-[105px] bg-white dark:bg-zinc-950 border border-emerald-250 dark:border-emerald-500/40 rounded-lg shadow-[0_4px_20px_rgba(16,185,129,0.12)] flex flex-col absolute right-2 bottom-1 translate-x-0 translate-y-0 z-20 scale-100 opacity-100 transition-all duration-500 ease-out transform animate-in slide-in-from-bottom-4 slide-in-from-right-4 mt-2">
              {/* Mini browser top bar of the new window */}
              <div className="h-4 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800/80 px-1.5 flex items-center gap-1 justify-between">
                <div className="flex items-center gap-0.5">
                  <span className="size-1 rounded-full bg-red-500/60" />
                  <span className="size-1 rounded-full bg-emerald-500/60 animate-pulse" />
                </div>
                <div className="flex-1 mx-1.5 h-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded px-1 text-[5px] text-emerald-650 dark:text-emerald-400 font-mono flex items-center justify-center truncate">
                  school.edu/print-sheet-tab
                </div>
                <div className="size-1.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
              </div>

              {/* Content of the standalone tab */}
              <div className="flex-1 p-1.5 bg-white dark:bg-zinc-950 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-900 pb-0.5">
                  <span className="text-[6px] text-zinc-700 dark:text-zinc-350 font-semibold truncate">Tabulation Report Sheet</span>
                  <span className="text-[5px] text-emerald-605 dark:text-emerald-400 font-bold bg-emerald-500/10 px-0.5 rounded">Standalone</span>
                </div>

                <div className="flex-1 my-1 border border-dashed border-zinc-200 dark:border-zinc-800 rounded p-0.5 flex flex-col gap-0.5 bg-zinc-50/50 dark:bg-zinc-900/40 justify-center">
                  <div className="flex items-center gap-1 justify-center">
                    <div className="flex flex-col gap-0.5 leading-tight">
                      <span className="text-[5px] text-zinc-600 dark:text-zinc-400 font-medium">Class 10 - Section A</span>
                      <span className="text-[4px] text-zinc-400 dark:text-zinc-550 font-medium">Press Ctrl+P to print immediately</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[4px] text-zinc-400 dark:text-zinc-500">
                  <span>Zoom: 100%</span>
                  <span>Print-Ready Grid</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
