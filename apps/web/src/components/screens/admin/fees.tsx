"use client";

import { Eye } from 'lucide-react';
import { useModulePermissions } from '@/hooks/use-permissions';
import { useAppStore } from '@/store/use-app-store';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic loading for "Low Stack" performance optimization
const SetFeesTab = dynamic(() => import('./fees/SetFeesTab').then(m => m.SetFeesTab), {
  loading: () => <TabLoadingSkeleton />
});
const FeeCategoriesTab = dynamic(() => import('./fees/FeeCategoriesTab').then(m => m.FeeCategoriesTab), {
  loading: () => <TabLoadingSkeleton />
});
const ConcessionsTab = dynamic(() => import('./fees/ConcessionsTab').then(m => m.ConcessionsTab), {
  loading: () => <TabLoadingSkeleton />
});
const MakePaymentTab = dynamic(() => import('./fees/MakePaymentTab').then(m => m.MakePaymentTab), {
  loading: () => <TabLoadingSkeleton />
});
const CheckReceiptTab = dynamic(() => import('./fees/CheckReceiptTab').then(m => m.CheckReceiptTab), {
  loading: () => <TabLoadingSkeleton />
});
const FeeStatusTab = dynamic(() => import('./fees/FeeStatusTab').then(m => m.FeeStatusTab), {
  loading: () => <TabLoadingSkeleton />
});
const CheckPaymentsTab = dynamic(() => import('./fees/CheckPaymentsTab').then(m => m.CheckPaymentsTab), {
  loading: () => <TabLoadingSkeleton />
});
const TransportFeeTab = dynamic(() => import('./fees/TransportFeeTab').then(m => m.TransportFeeTab), {
  loading: () => <TabLoadingSkeleton />
});

function TabLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-44 rounded-md" />
        <Skeleton className="h-10 w-44 rounded-md" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  );
}

export function AdminFees() {
  const { canCreate, canEdit, canDelete } = useModulePermissions('fees');
  const { currentSubScreen } = useAppStore();
  const { screen } = useParams();
  
  // Sync tab with URL screen or internal store state
  let activeTab = 'set-fees';
  
  if (screen === 'fee-categories') activeTab = 'categories';
  else if (screen === 'fee-concessions') activeTab = 'concessions';
  else if (screen === 'make-payment') activeTab = 'payment';
  else if (screen === 'check-receipt') activeTab = 'receipts';
  else if (screen === 'fee-status') activeTab = 'status';
  else if (screen === 'check-payments') activeTab = 'check-payments';
  else if (screen === 'transport-fee') activeTab = 'transport-fee';
  else if (screen === 'fees') activeTab = 'set-fees';
  else activeTab = currentSubScreen || 'set-fees';

  return (
    <div className="space-y-6">
      {/* Read-only banner */}
      {!canCreate && !canEdit && !canDelete && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-3 py-2">
          <Eye className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
            Read-only mode: you have view permission only for this module.
          </span>
        </div>
      )}

      {/* Render active tab content - sidebar handles navigation */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'set-fees' && (
          <SetFeesTab canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />
        )}
        {activeTab === 'categories' && (
          <FeeCategoriesTab canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />
        )}
        {activeTab === 'concessions' && (
          <ConcessionsTab canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />
        )}
        {activeTab === 'payment' && (
          <MakePaymentTab canCreate={canCreate} />
        )}
        {activeTab === 'receipts' && (
          <CheckReceiptTab canEdit={canEdit} canDelete={canDelete} />
        )}
        {activeTab === 'status' && (
          <FeeStatusTab />
        )}
        {activeTab === 'check-payments' && (
          <CheckPaymentsTab />
        )}
        {activeTab === 'transport-fee' && (
          <TransportFeeTab />
        )}
      </div>
    </div>
  );
}
