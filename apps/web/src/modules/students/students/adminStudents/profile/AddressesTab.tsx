"use client";

import { useState } from "react";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Languages,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { PROFILE_QUERY_KEY } from "./tabs";
import type { AddressesPayload } from "./use-student-profile";

export interface StudentAddressItem {
  id: string;
  addressType: "current" | "permanent" | "other";
  line1: string;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  landmark?: string | null;
  isPrimary: boolean;
}

interface AddressesTabProps {
  studentRef: string;
  data?: AddressesPayload;
}

function TranslationButton() {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 mt-1 cursor-pointer transition-colors select-none"
    >
      <Languages className="size-3.5" />
      <span>Add translations</span>
      <ChevronDown className="size-3" />
    </button>
  );
}

export function AddressesTab({ studentRef, data }: AddressesTabProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<StudentAddressItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [addressType, setAddressType] = useState<"current" | "permanent" | "other">("permanent");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [postalCode, setPostalCode] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  // Fetch structured addresses from /api/student-address
  const { data: addressData, isLoading } = useQuery({
    queryKey: ["student-address", studentRef],
    enabled: Boolean(studentRef),
    queryFn: async () => {
      try {
        const res = await apiFetch(`/api/student-address?student=${encodeURIComponent(studentRef)}`);
        if (!res.ok) return { items: [] };
        return (await res.json()) as { items: StudentAddressItem[] };
      } catch (err) {
        console.error("Failed to load addresses:", err);
        return { items: [] };
      }
    },
  });

  const items = addressData?.items ?? [];

  // Fallback to legacy single address from User table if no student addresses exist
  const hasLegacyEntries = items.length === 0 && (data?.entries?.length ?? 0) > 0;

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setAddressType("permanent");
    setLine1("");
    setLine2("");
    setLandmark("");
    setCity("");
    setState("");
    setCountry("India");
    setPostalCode("");
    setIsPrimary(items.length === 0);
    setDialogOpen(true);
  };

  const handleOpenEdit = (addr: StudentAddressItem) => {
    setEditingAddress(addr);
    setAddressType(addr.addressType);
    setLine1(addr.line1 || "");
    setLine2(addr.line2 || "");
    setLandmark(addr.landmark || "");
    setCity(addr.city || "");
    setState(addr.state || "");
    setCountry(addr.country || "India");
    setPostalCode(addr.postalCode || "");
    setIsPrimary(addr.isPrimary);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!line1.trim() || !city.trim() || !state.trim() || !postalCode.trim()) {
      toast.error("Please fill in address line, city, state, and postal code");
      return;
    }

    setSaving(true);
    try {
      if (editingAddress) {
        // PUT update
        const res = await apiFetch("/api/student-address", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingAddress.id,
            addressType,
            line1: line1.trim(),
            line2: line2.trim() || null,
            landmark: landmark.trim() || null,
            city: city.trim(),
            state: state.trim(),
            country: country.trim() || "India",
            postalCode: postalCode.trim(),
            isPrimary,
          }),
        });
        const resData = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(resData?.error || "Failed to update address");
        toast.success("Address updated successfully");
      } else {
        // POST create
        const res = await apiFetch("/api/student-address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: studentRef,
            addressType,
            line1: line1.trim(),
            line2: line2.trim() || null,
            landmark: landmark.trim() || null,
            city: city.trim(),
            state: state.trim(),
            country: country.trim() || "India",
            postalCode: postalCode.trim(),
            isPrimary,
          }),
        });
        const resData = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(resData?.error || "Failed to add address");
        toast.success("Address added successfully");
      }

      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["student-address", studentRef] });
      queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/student-address?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(resData?.error || "Failed to delete address");
      toast.success("Address deleted");
      queryClient.invalidateQueries({ queryKey: ["student-address", studentRef] });
      queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/80 dark:bg-emerald-950/60 dark:text-emerald-400 dark:ring-emerald-900/40">
            <MapPin className="size-4.5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
              Addresses
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              All address records on file
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpenAdd}
          className="h-8.5 rounded-xl border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <Plus className="mr-1.5 size-3.5" />
          Add address
        </Button>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Loader2 className="mx-auto size-6 animate-spin text-slate-400 dark:text-zinc-500" />
          <p className="mt-2 text-xs text-slate-400">Loading addresses...</p>
        </div>
      ) : items.length === 0 && !hasLegacyEntries ? (
        /* Empty State matching Screenshot 2 */
        <div className="rounded-2xl border border-dashed border-slate-200/90 bg-white p-14 text-center flex flex-col items-center justify-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-50 text-slate-400 mb-3 dark:bg-zinc-800 dark:text-zinc-500">
            <MapPin className="size-5.5 stroke-[1.8]" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
            No address added
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-zinc-400">
            Add a permanent and current address for communication.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenAdd}
            className="mt-4 h-8.5 rounded-xl border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <Plus className="mr-1.5 size-3.5" />
            Add address
          </Button>
        </div>
      ) : (
        /* Address Cards Grid */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="capitalize text-xs font-medium bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {item.addressType} address
                  </Badge>
                  {item.isPrimary && (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[11px] font-semibold dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/80"
                    >
                      Primary
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    aria-label="Edit address"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    aria-label="Delete address"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 dark:text-zinc-300">
                <p className="font-semibold text-slate-900 dark:text-zinc-100 text-sm">
                  {item.line1}
                </p>
                {item.line2 && <p>{item.line2}</p>}
                {item.landmark && (
                  <p className="text-slate-500 dark:text-zinc-400">
                    <span className="font-medium text-slate-700 dark:text-zinc-300">Landmark:</span>{" "}
                    {item.landmark}
                  </p>
                )}
                <p className="font-medium">
                  {[item.city, item.state, item.postalCode].filter(Boolean).join(", ")}
                </p>
                {item.country && (
                  <p className="text-slate-500 dark:text-zinc-400">{item.country}</p>
                )}
              </div>
            </div>
          ))}

          {/* Legacy fallback if studentAddresses table had none yet */}
          {hasLegacyEntries &&
            data?.entries.map((e, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
                  <Badge variant="secondary" className="capitalize text-xs font-medium">
                    {e.label}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[11px] font-semibold dark:bg-emerald-950/50 dark:text-emerald-400"
                  >
                    Primary
                  </Badge>
                </div>
                <p className="mt-3.5 whitespace-pre-line text-xs font-medium leading-relaxed text-slate-800 dark:text-zinc-100">
                  {e.value}
                </p>
              </div>
            ))}
        </div>
      )}

      {/* Add / Edit Address Dialog Modal matching Reference Image */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl sm:max-w-[540px] p-6 rounded-2xl border-slate-100 shadow-xl [&>button]:hidden">
          <form onSubmit={handleSave}>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#dff8f1] text-[#0d9488]">
                  <MapPin className="size-5 text-[#0d9488]" />
                </div>
                <DialogTitle className="text-[17px] font-bold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
                  {editingAddress ? "Edit address" : "Add new address"}
                </DialogTitle>
              </div>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Form Fields */}
            <div className="space-y-4 pt-5 pb-2 text-xs">
              {/* Row 1: Address Type & Set Primary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="addressType" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Address Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={addressType}
                    onValueChange={(val) => setAddressType(val as "current" | "permanent" | "other")}
                  >
                    <SelectTrigger id="addressType" className="h-11 rounded-xl border-slate-200 text-sm px-3.5 capitalize focus:ring-1 focus:ring-[#0d9488] focus:border-[#0d9488]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="current">Current</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex h-11 items-center gap-2.5 rounded-xl border border-slate-100 bg-[#f8fafc] px-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                  <Checkbox
                    id="isPrimary"
                    checked={isPrimary}
                    onCheckedChange={(checked) => setIsPrimary(checked === true)}
                    className="size-4.5 rounded-[4px] border-slate-300 data-[state=checked]:bg-[#0d9488] data-[state=checked]:border-[#0d9488]"
                  />
                  <Label htmlFor="isPrimary" className="text-sm font-medium text-slate-700 dark:text-zinc-200 cursor-pointer select-none">
                    Set as primary address
                  </Label>
                </div>
              </div>

              {/* Row 2: Address Line 1 */}
              <div className="space-y-1">
                <Label htmlFor="line1" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Address Line 1 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="line1"
                  required
                  placeholder="House/Flat No., Street Name"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 text-sm px-3.5 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                />
                <TranslationButton />
              </div>

              {/* Row 3: Address Line 2 */}
              <div className="space-y-1">
                <Label htmlFor="line2" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Address Line 2
                </Label>
                <Input
                  id="line2"
                  placeholder="Area, Colony (Optional)"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 text-sm px-3.5 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                />
                <TranslationButton />
              </div>

              {/* Row 4: City & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <Label htmlFor="city" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    required
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 text-sm px-3.5 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                  />
                  <TranslationButton />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="state" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="state"
                    required
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 text-sm px-3.5 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                  />
                  <TranslationButton />
                </div>
              </div>

              {/* Row 5: Country & Postal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <Label htmlFor="country" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Country <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="country"
                    required
                    placeholder="India"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 text-sm px-3.5 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                  />
                  <TranslationButton />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="postalCode" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Postal Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="postalCode"
                    required
                    placeholder="Postal Code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 text-sm px-3.5 font-mono placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                  />
                </div>
              </div>

              {/* Row 6: Landmark */}
              <div className="space-y-1">
                <Label htmlFor="landmark" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Landmark
                </Label>
                <Input
                  id="landmark"
                  placeholder="Nearby landmark (Optional)"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 text-sm px-3.5 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                />
                <TranslationButton />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
                className="h-10 px-5 rounded-xl border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-10 px-6 rounded-xl bg-[#0f172a] text-sm font-semibold text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-xs cursor-pointer"
              >
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                {editingAddress ? "Save changes" : "Create address"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
