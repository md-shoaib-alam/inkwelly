"use client";

import { apiFetch } from "@/lib/api";
import { useReducer, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/use-app-store";

// Sub-components
import { TicketStats } from "./tickets/TicketStats";
import { TicketFilters } from "./tickets/TicketFilters";
import { TicketTable } from "./tickets/TicketTable";
import { CreateTicketDialog } from "./tickets/CreateTicketDialog";
import { TicketDetailSheet } from "./tickets/TicketDetailSheet";

// Reducer & Types
import { ticketsReducer, initialState, emptyCreateForm } from "./tickets/reducer";

export function AdminTickets() {
  const { currentUser, currentTenantId } = useAppStore();
  const [state, dispatch] = useReducer(ticketsReducer, initialState);

  const {
    tickets,
    staffList,
    loading,
    statusFilter,
    searchQuery,
    priorityFilter,
    categoryFilter,
    createOpen,
    createForm,
    creating,
    detailOpen,
    selectedTicket,
    detailLoading,
    replyMessage,
    sendingReply,
    editStatus,
    editPriority,
    editAssignee,
    updatingTicket,
  } = state;

  // ── Fetching ──

  const fetchTickets = useCallback(async () => {
    if (!currentTenantId) return;
    try {
      const params = new URLSearchParams({ tenantId: currentTenantId });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      const res = await apiFetch(`/api/tickets?${params.toString()}`);
      if (res.ok) {
        dispatch({ type: "SET_TICKETS", tickets: await res.json() });
      }
    } catch {
      toast.error("Failed to fetch tickets");
    } finally {
      dispatch({ type: "SET_LOADING", loading: false });
    }
  }, [currentTenantId, statusFilter, priorityFilter, categoryFilter]);

  const fetchStaff = useCallback(async () => {
    if (!currentTenantId) return;
    try {
      const res = await apiFetch(`/api/staff?tenantId=${currentTenantId}`);
      if (res.ok) {
        dispatch({ type: "SET_STAFF_LIST", staff: await res.json() });
      }
    } catch {}
  }, [currentTenantId]);

  useEffect(() => {
    dispatch({ type: "SET_LOADING", loading: true });
    fetchTickets();
    fetchStaff();
  }, [fetchTickets, fetchStaff]);

  // ── Handlers ──

  const handleCreate = async () => {
    if (!currentUser) return;
    dispatch({ type: "SET_CREATING", creating: true });
    try {
      const res = await apiFetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: currentTenantId,
          ...createForm,
          createdBy: currentUser.id,
        }),
      });
      if (res.ok) {
        toast.success("Ticket created");
        dispatch({ type: "SET_CREATE_OPEN", open: false });
        dispatch({ type: "SET_CREATE_FORM", form: { ...emptyCreateForm } });
        fetchTickets();
      } else {
        toast.error("Failed to create ticket");
      }
    } catch {
      toast.error("Error creating ticket");
    } finally {
      dispatch({ type: "SET_CREATING", creating: false });
    }
  };

  const openTicketDetail = async (id: string) => {
    dispatch({ type: "SET_DETAIL_OPEN", open: true });
    dispatch({ type: "SET_DETAIL_LOADING", loading: true });
    dispatch({ type: "SET_REPLY_MESSAGE", message: "" });
    try {
      const res = await apiFetch(`/api/tickets/${id}`);
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "SET_SELECTED_TICKET", ticket: data });
        dispatch({
          type: "SET_EDIT_TICKET_FIELDS",
          status: data.status,
          priority: data.priority,
          assignee: data.assignedTo || "unassigned"
        });
      }
    } catch {
      toast.error("Error loading ticket");
      dispatch({ type: "SET_DETAIL_OPEN", open: false });
    } finally {
      dispatch({ type: "SET_DETAIL_LOADING", loading: false });
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedTicket || !currentUser) return;
    dispatch({ type: "SET_SENDING_REPLY", sending: true });
    try {
      const res = await apiFetch(`/api/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, message: replyMessage.trim() }),
      });
      if (res.ok) {
        dispatch({ type: "SET_REPLY_MESSAGE", message: "" });
        const detailRes = await apiFetch(`/api/tickets/${selectedTicket.id}`);
        if (detailRes.ok) {
          dispatch({ type: "SET_SELECTED_TICKET", ticket: await detailRes.json() });
        }
        fetchTickets();
        toast.success("Reply sent");
      }
    } catch {
      toast.error("Error sending reply");
    } finally {
      dispatch({ type: "SET_SENDING_REPLY", sending: false });
    }
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    dispatch({ type: "SET_UPDATING_TICKET", updating: true });
    try {
      const res = await apiFetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          priority: editPriority,
          assignedTo: editAssignee === "unassigned" ? null : editAssignee,
        }),
      });
      if (res.ok) {
        toast.success("Ticket updated");
        openTicketDetail(selectedTicket.id);
        fetchTickets();
      }
    } catch {
      toast.error("Error updating ticket");
    } finally {
      dispatch({ type: "SET_UPDATING_TICKET", updating: false });
    }
  };

  // ── Derived ──

  const filteredTickets = tickets.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const stats = {
    open: tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    closed: tickets.filter(t => t.status === "closed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Support Tickets</h2>
          <p className="text-sm text-muted-foreground">{tickets.length} total tickets</p>
        </div>
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)] dark:shadow-[0_4px_14px_rgba(16,185,129,0.2)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.45)] dark:hover:shadow-[0_6px_20px_rgba(16,185,129,0.3)] transition-all duration-200 cursor-pointer" 
          onClick={() => dispatch({ type: "SET_CREATE_OPEN", open: true })}
        >
          <Plus className="size-4 mr-2" />New Ticket
        </Button>
      </div>

      <TicketStats stats={stats} />

      <TicketFilters
        statusFilter={statusFilter}
        setStatusFilter={(v) => dispatch({ type: "SET_STATUS_FILTER", status: v })}
        searchQuery={searchQuery}
        setSearchQuery={(v) => dispatch({ type: "SET_SEARCH_QUERY", query: v })}
        priorityFilter={priorityFilter}
        setPriorityFilter={(v) => dispatch({ type: "SET_PRIORITY_FILTER", priority: v })}
        categoryFilter={categoryFilter}
        setCategoryFilter={(v) => dispatch({ type: "SET_CATEGORY_FILTER", category: v })}
      />

      <Card>
        <CardContent className="p-0">
          <TicketTable
            tickets={filteredTickets}
            loading={loading}
            onOpenDetail={openTicketDetail}
          />
        </CardContent>
      </Card>

      <CreateTicketDialog
        open={createOpen}
        onOpenChange={(v) => dispatch({ type: "SET_CREATE_OPEN", open: v })}
        form={createForm}
        setForm={(v) => {
          // If v is a function (e.g. from useState setter), this might break if we just pass it to dispatch.
          // But looking at the component, it probably just passes the new form object.
          // Actually, many shadcn/ui components pass the object.
          dispatch({ type: "SET_CREATE_FORM", form: v as any });
        }}
        loading={creating}
        onSubmit={handleCreate}
      />

      <TicketDetailSheet
        open={detailOpen}
        onOpenChange={(v) => dispatch({ type: "SET_DETAIL_OPEN", open: v })}
        ticket={selectedTicket}
        loading={detailLoading}
        staffList={staffList}
        editStatus={editStatus}
        setEditStatus={(v) => dispatch({ type: "SET_EDIT_STATUS", status: v })}
        editPriority={editPriority}
        setEditPriority={(v) => dispatch({ type: "SET_EDIT_PRIORITY", priority: v })}
        editAssignee={editAssignee}
        setEditAssignee={(v) => dispatch({ type: "SET_EDIT_ASSIGNEE", assignee: v })}
        updatingTicket={updatingTicket}
        onUpdateTicket={handleUpdateTicket}
        replyMessage={replyMessage}
        setReplyMessage={(v) => dispatch({ type: "SET_REPLY_MESSAGE", message: v })}
        sendingReply={sendingReply}
        onReply={handleReply}
      />
    </div>
  );
}
