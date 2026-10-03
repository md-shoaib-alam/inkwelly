"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Link2, PanelLeft, PanelLeftClose, Plug, Plus } from "lucide-react";
import MorphOrb from "@/components/ui/ai-thinking-orb-and-input";
import AiConnectModal from "./AiConnectModal";

/** The Inkwelly asterisk brand mark, same path the login header uses. */
function InkwellyMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12 2a1.5 1.5 0 0 1 1.5 1.5v3.636l2.571-2.571a1.5 1.5 0 1 1 2.122 2.121L15.621 9.257H19.25a1.5 1.5 0 1 1 0 3h-3.629l2.571 2.571a1.5 1.5 0 1 1-2.121 2.122L13.5 14.379v3.621a1.5 1.5 0 1 1-3 0v-3.621l-2.571 2.571a1.5 1.5 0 1 1-2.122-2.121L8.379 12.257H4.75a1.5 1.5 0 1 1 0-3h3.629L5.808 6.686a1.5 1.5 0 1 1 2.121-2.122L10.5 7.136V3.5A1.5 1.5 0 0 1 12 2z" />
    </svg>
  );
}

/**
 * There is no model wired to this surface yet — the connected-assistant path is AI
 * Connect (MCP) — so a send returns an honest "not connected" line instead of
 * pretending to answer, and the sidebar's footer says the same rather than showing a
 * fabricated token meter. The card bleeds `main`'s padding so its edges align with the
 * black content card; MorphOrb owns the stage to the right of the sidebar and recentres
 * itself in CSS, so opening or closing the rail needs no resize handling.
 */
const honestAnswer = () =>
  "No assistant is connected yet. Connect one under AI Connect (MCP) to bring your own model, and I can answer here.";

const SIDEBAR_W = 280;

export function AdminAiChat() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // The sidebar item opens this promo rather than navigating straight away; the CTA
  // inside it is what actually pushes to the AI Connect screen.
  const [connectOpen, setConnectOpen] = useState(false);
  // Bumping this remounts MorphOrb, which is the only honest "New chat": it drops the
  // current answer back to the idle pill. There is no conversation store to append to.
  const [chatKey, setChatKey] = useState(0);
  const connectHref = pathname.replace(/\/+$/, "").replace(/\/ai$/, "/ai-connect");

  return (
    <div className="-m-4 flex h-[calc(100%+2rem)] w-[calc(100%+2rem)] overflow-hidden lg:-m-6 lg:h-[calc(100%+3rem)] lg:w-[calc(100%+3rem)] lg:rounded-[24px]">
      <aside
        aria-label="Inkwelly AI navigation"
        className={`shrink-0 overflow-hidden bg-sidebar transition-[width] duration-300 ease-out ${
          open ? "w-[280px] border-r border-sidebar-border" : "w-0"
        }`}
      >
        <div className="flex h-full flex-col" style={{ width: SIDEBAR_W }}>
          <div className="flex items-center gap-2.5 px-4 py-4">
            <InkwellyMark className="size-6 shrink-0 text-foreground" />
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Inkwelly <span className="text-muted-foreground">AI</span>
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Hide sidebar"
              className="ml-auto grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              <PanelLeftClose className="size-5" />
            </button>
          </div>

          <div className="space-y-1 px-3">
            <button
              type="button"
              onClick={() => setChatKey((k) => k + 1)}
              className="flex w-full items-center gap-2.5 rounded-xl bg-sidebar-accent px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:brightness-105"
            >
              <Plus className="size-4 shrink-0" />
              New chat
            </button>
            <button
              type="button"
              onClick={() => setConnectOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              <Plug className="size-4 shrink-0" />
              AI Connect (MCP)
            </button>
          </div>

          <div className="mt-6 flex-1 overflow-y-auto px-4">
            <p className="text-xs text-muted-foreground">Your conversations will show up here.</p>
          </div>

          <div className="flex items-center gap-2 border-t border-sidebar-border px-4 py-3 text-xs text-muted-foreground">
            <Link2 className="size-4 shrink-0" />
            <span>No assistant connected</span>
          </div>
        </div>
      </aside>

      <div className="relative min-w-0 flex-1">
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Show sidebar"
            className="absolute left-4 top-4 z-20 grid size-10 place-items-center rounded-full border border-sidebar-border bg-sidebar/80 text-sidebar-foreground shadow-sm backdrop-blur transition-colors hover:bg-sidebar-accent"
          >
            <PanelLeft className="size-5" />
          </button>
        )}

        <MorphOrb key={chatKey} onSubmit={honestAnswer} />
      </div>

      <AiConnectModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onConnect={() => {
          setConnectOpen(false);
          router.push(connectHref);
        }}
      />
    </div>
  );
}
