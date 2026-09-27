"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useCallback, useReducer } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/store/use-app-store";

// Sub-components
import { TicketHeader } from "./tickets/ticket-header";
import { TicketSkeleton } from "./tickets/ticket-skeleton";
import { TicketList } from "./tickets/ticket-list";
import { CreateTicketDialog } from "./tickets/create-ticket-dialog";
import { TicketDetailSheet } from "./tickets/ticket-detail-sheet";

// Types
import { TicketItem, TicketDetail, CreateFormData } from "./tickets/types";

// Reducer State & Types
interface TicketsState {
  tickets: TicketItem[];
  loading: boolean;
  createOpen: boolean;
  detailOpen: boolean;
  selectedTicket: TicketDetail | null;
  detailLoading: boolean;
}

type TicketsAction =
  | { type: "SET_TICKETS"; payload: TicketItem[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CREATE_OPEN"; payload: boolean }
  | { type: "SET_DETAIL_OPEN"; payload: boolean }
  | { type: "SET_SELECTED_TICKET"; payload: TicketDetail | null }
  | { type: "SET_DETAIL_LOADING"; payload: boolean };

const initialState: TicketsState = {
  tickets: [],
  loading: true,
  createOpen: false,
  detailOpen: false,
  selectedTicket: null,
  detailLoading: false,
};

function ticketsReducer(state: TicketsState, action: TicketsAction): TicketsState {
  switch (action.type) {
    case "SET_TICKETS":
      return { ...state, tickets: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_CREATE_OPEN":
      return { ...state, createOpen: action.payload };
    case "SET_DETAIL_OPEN":
      return { ...state, detailOpen: action.payload };
    case "SET_SELECTED_TICKET":
      return { ...state, selectedTicket: action.payload };
    case "SET_DETAIL_LOADING":
      return { ...state, detailLoading: action.payload };
    default:
      return state;
  }
}

export function StudentTickets() {
  const { currentUser, currentTenantId } = useAppStore();
  const currentUserId = currentUser?.id;

  const [state, dispatch] = useReducer(ticketsReducer, initialState);
  const { tickets, loading, createOpen, detailOpen, selectedTicket, detailLoading } = state;

  // ── Fetch my tickets ──
  const fetchTickets = useCallback(async () => {
    if (!currentTenantId || !currentUserId) return;
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const params = new URLSearchParams({
        tenantId: currentTenantId,
        createdBy: currentUserId,
      });
      const res = await apiFetch(`/api/tickets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "SET_TICKETS", payload: Array.isArray(data) ? data : [] });
      }
    } catch {
      toast.error("Failed to fetch tickets");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [currentTenantId, currentUserId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // ── Quick stats ──
  const openCount = tickets.filter(
    (t) => t.status === "open" || t.status === "in_progress",
  ).length;

  // ── Create ticket ──
  const handleCreateSubmit = async (form: CreateFormData) => {
    if (!currentUser) return;
    try {
      const res = await apiFetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: currentTenantId,
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          category: form.category,
          createdBy: currentUser.id,
        }),
      });
      if (res.ok) {
        toast.success("Ticket submitted successfully");
        dispatch({ type: "SET_CREATE_OPEN", payload: false });
        await fetchTickets();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create ticket");
      }
    } catch {
      toast.error("Error creating ticket");
    }
  };

  // ── Open ticket detail ──
  const openTicketDetail = async (ticketId: string) => {
    dispatch({ type: "SET_DETAIL_OPEN", payload: true });
    dispatch({ type: "SET_DETAIL_LOADING", payload: true });
    try {
      const res = await apiFetch(`/api/tickets/${ticketId}`);
      if (res.ok) {
        dispatch({ type: "SET_SELECTED_TICKET", payload: await res.json() });
      } else {
        toast.error("Failed to load ticket details");
        dispatch({ type: "SET_DETAIL_OPEN", payload: false });
      }
    } catch {
      toast.error("Error loading ticket");
      dispatch({ type: "SET_DETAIL_OPEN", payload: false });
    } finally {
      dispatch({ type: "SET_DETAIL_LOADING", payload: false });
    }
  };

  // ── Send reply ──
  const handleSendReply = async (message: string) => {
    if (!selectedTicket || !currentUser) return;
    try {
      const res = await apiFetch(`/api/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          message: message,
        }),
      });
      if (res.ok) {
        // Refresh detail
        const detailRes = await apiFetch(`/api/tickets/${selectedTicket.id}`);
        if (detailRes.ok) {
          dispatch({ type: "SET_SELECTED_TICKET", payload: await detailRes.json() });
        }
        fetchTickets();
        toast.success("Reply sent");
      } else {
        toast.error("Failed to send reply");
      }
    } catch {
      toast.error("Error sending reply");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <TicketHeader
        totalCount={tickets.length}
        openCount={openCount}
        onNewClick={() => dispatch({ type: "SET_CREATE_OPEN", payload: true })}
      />

      {/* Ticket List / Loading */}
      {loading ? (
        <TicketSkeleton />
      ) : (
        <TicketList tickets={tickets} onOpenDetail={openTicketDetail} />
      )}

      {/* Create Ticket Dialog */}
      <CreateTicketDialog
        open={createOpen}
        onOpenChange={(open) => dispatch({ type: "SET_CREATE_OPEN", payload: open })}
        onSubmit={handleCreateSubmit}
      />

      {/* Ticket Detail Sheet */}
      <TicketDetailSheet
        open={detailOpen}
        onOpenChange={(open) => dispatch({ type: "SET_DETAIL_OPEN", payload: open })}
        ticket={selectedTicket}
        loading={detailLoading}
        currentUserId={currentUserId}
        onSendReply={handleSendReply}
      />
    </div>
  );
}

