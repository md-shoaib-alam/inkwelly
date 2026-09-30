"use client";

import { useState, useEffect } from "react";
import {
  Landmark,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  Building,
  Loader2,
  X,
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
import { copyToClipboard } from "@/lib/utils";
import { toast } from "sonner";

export interface BankAccountItem {
  id: string;
  accountHolder: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: "savings" | "current";
  remarks?: string;
  isPrimary: boolean;
}

const STORAGE_KEY_PREFIX = "inkwelly:student-bank:";

export function BankTab({ studentRef }: { studentRef: string }) {
  const [accounts, setAccounts] = useState<BankAccountItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccountItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State matching Screenshot 3
  const [accountHolder, setAccountHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountType, setAccountType] = useState<"savings" | "current">("savings");
  const [remarks, setRemarks] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  // Load from localStorage for studentRef
  useEffect(() => {
    if (!studentRef) return;
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${studentRef}`);
      if (stored) {
        setAccounts(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, [studentRef]);

  const saveAccounts = (newAccounts: BankAccountItem[]) => {
    setAccounts(newAccounts);
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${studentRef}`, JSON.stringify(newAccounts));
    } catch {
      // ignore
    }
  };

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setAccountHolder("");
    setBankName("");
    setBranchName("");
    setAccountNumber("");
    setConfirmAccountNumber("");
    setIfscCode("");
    setAccountType("savings");
    setRemarks("");
    setIsPrimary(accounts.length === 0);
    setDialogOpen(true);
  };

  const handleOpenEdit = (acc: BankAccountItem) => {
    setEditingAccount(acc);
    setAccountHolder(acc.accountHolder);
    setBankName(acc.bankName);
    setBranchName(acc.branchName || "");
    setAccountNumber(acc.accountNumber);
    setConfirmAccountNumber(acc.accountNumber);
    setIfscCode(acc.ifscCode);
    setAccountType(acc.accountType || "savings");
    setRemarks(acc.remarks || "");
    setIsPrimary(acc.isPrimary);
    setDialogOpen(true);
  };

  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Account number copied");
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to remove this bank account?")) return;
    const next = accounts.filter((a) => a.id !== id);
    if (next.length > 0 && accounts.find((a) => a.id === id)?.isPrimary) {
      next[0].isPrimary = true;
    }
    saveAccounts(next);
    toast.success("Bank account removed");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountHolder.trim() || !bankName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!editingAccount && accountNumber.trim() !== confirmAccountNumber.trim()) {
      toast.error("Account numbers do not match");
      return;
    }

    setSaving(true);
    const newAcc: BankAccountItem = {
      id: editingAccount ? editingAccount.id : `bank_${Date.now()}`,
      accountHolder: accountHolder.trim(),
      bankName: bankName.trim(),
      branchName: branchName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      accountType,
      remarks: remarks.trim() || undefined,
      isPrimary,
    };

    let next: BankAccountItem[];
    if (editingAccount) {
      next = accounts.map((a) => (a.id === editingAccount.id ? newAcc : a));
    } else {
      next = [...accounts, newAcc];
    }

    if (isPrimary) {
      next = next.map((a) => ({
        ...a,
        isPrimary: a.id === newAcc.id,
      }));
    }

    saveAccounts(next);
    setSaving(false);
    setDialogOpen(false);
    toast.success(editingAccount ? "Bank account updated" : "Bank account added successfully");
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/80 dark:bg-emerald-950/60 dark:text-emerald-400 dark:ring-emerald-900/40">
            <Landmark className="size-4.5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
              Bank Accounts
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              For fee refunds, scholarships, and stipend transfers
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
          Add account
        </Button>
      </div>

      {/* Main Content */}
      {accounts.length === 0 ? (
        /* Empty State matching Screenshot 3 */
        <div className="rounded-2xl border border-dashed border-slate-200/90 bg-white p-16 text-center flex flex-col items-center justify-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-50 text-slate-400 mb-3 dark:bg-zinc-800 dark:text-zinc-500">
            <Landmark className="size-5.5 stroke-[1.8]" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
            No bank account linked
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-zinc-400">
            Add a bank account to receive refunds and scholarship payments.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenAdd}
            className="mt-4 h-8.5 rounded-xl border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <Plus className="mr-1.5 size-3.5" />
            Add bank account
          </Button>
        </div>
      ) : (
        /* Bank Account Cards Grid */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <Building className="size-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                        {acc.bankName}
                      </h3>
                      {acc.isPrimary && (
                        <span className="rounded-full bg-[#e0f7f3] px-2 py-0.5 text-[11px] font-semibold text-[#0d9488] border border-teal-100 dark:border-teal-900/40 dark:bg-teal-950/50 dark:text-teal-300">
                          Primary
                        </span>
                      )}
                    </div>
                    {acc.branchName && (
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        {acc.branchName} Branch
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(acc)}
                    aria-label="Edit account"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(acc.id)}
                    aria-label="Delete account"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Account holder</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100">
                    {acc.accountHolder}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Account number</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-medium text-slate-800 dark:text-zinc-200">
                      {acc.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(acc.accountNumber, acc.id)}
                      className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
                      aria-label="Copy account number"
                    >
                      {copiedId === acc.id ? (
                        <Check className="size-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">IFSC code</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">
                    {acc.ifscCode}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500 dark:text-zinc-400">Account type</span>
                  <Badge variant="outline" className="capitalize text-[11px] font-medium">
                    {acc.accountType}
                  </Badge>
                </div>

                {acc.remarks && (
                  <div className="flex items-center justify-between pt-1 text-[11.5px] text-slate-500 dark:text-zinc-400">
                    <span>Remarks</span>
                    <span className="italic">{acc.remarks}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Bank Account Dialog matching Screenshot 3 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl sm:max-w-[540px] p-6 rounded-2xl border-slate-100 shadow-xl [&>button]:hidden">
          <form onSubmit={handleSave}>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#dff8f1] text-[#0d9488]">
                  <Landmark className="size-5 text-[#0d9488]" />
                </div>
                <DialogTitle className="text-[17px] font-bold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
                  {editingAccount ? "Edit bank account" : "Add bank account"}
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

            {/* Modal Form Fields matching Reference Screenshot 3 */}
            <div className="space-y-4 pt-5 pb-2 text-xs">
              {/* Row 1: Account Holder Name & Bank Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="accountHolder" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Account Holder Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="accountHolder"
                    required
                    placeholder="Full name as on bank account"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 text-sm px-3.5 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bankName" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Bank Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bankName"
                    required
                    placeholder="e.g. State Bank of India"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 text-sm px-3.5 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                  />
                </div>
              </div>

              {/* Row 2: Branch Name */}
              <div className="space-y-1.5">
                <Label htmlFor="branchName" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Branch Name
                </Label>
                <Input
                  id="branchName"
                  placeholder="Branch name (Optional)"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 text-sm px-3.5 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                />
              </div>

              {/* Row 3: Account Number & Confirm Account Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="accountNumber" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Account Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="accountNumber"
                    required
                    placeholder="Bank account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 text-sm px-3.5 font-mono placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmAccountNumber" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Confirm Account Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmAccountNumber"
                    required
                    placeholder="Re-enter account number"
                    value={confirmAccountNumber}
                    onChange={(e) => setConfirmAccountNumber(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 text-sm px-3.5 font-mono placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                  />
                </div>
              </div>

              {/* Row 4: IFSC Code & Account Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="ifscCode" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    IFSC Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ifscCode"
                    required
                    placeholder="E.G. SBIN0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="h-11 rounded-xl border-slate-200 text-sm px-3.5 font-mono uppercase placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="accountType" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Account Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={accountType}
                    onValueChange={(val) => setAccountType(val as "savings" | "current")}
                  >
                    <SelectTrigger id="accountType" className="h-11 rounded-xl border-slate-200 text-sm px-3.5 focus:ring-1 focus:ring-[#0d9488] focus:border-[#0d9488]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="current">Current</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 5: Set as primary bank account */}
              <div className="flex h-11 items-center gap-2.5 rounded-xl border border-slate-100 bg-[#f8fafc] px-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                <Checkbox
                  id="isPrimaryBank"
                  checked={isPrimary}
                  onCheckedChange={(checked) => setIsPrimary(checked === true)}
                  className="size-4.5 rounded-[4px] border-slate-300 data-[state=checked]:bg-[#0d9488] data-[state=checked]:border-[#0d9488]"
                />
                <Label htmlFor="isPrimaryBank" className="text-sm font-medium text-slate-700 dark:text-zinc-200 cursor-pointer select-none">
                  Set as primary bank account
                </Label>
              </div>

              {/* Row 6: Remarks */}
              <div className="space-y-1.5">
                <Label htmlFor="remarks" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Remarks
                </Label>
                <textarea
                  id="remarks"
                  rows={2}
                  placeholder="Any additional notes (Optional)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 text-sm p-3.5 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#0d9488] focus:border-[#0d9488] dark:border-zinc-800 dark:bg-zinc-900 resize-none"
                />
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
                {editingAccount ? "Save changes" : "Add bank account"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
