"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Script from "next/script";
import { apiFetch } from "@/lib/api";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Crown,
  Shield,
  Clock,
  TrendingUp,
  Receipt,
  Loader2,
  Users as UsersIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAppStore } from "@/store/use-app-store";

// Sub-components
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PlanCard } from "./subscription/PlanCard";
import { HistoryTable } from "./subscription/HistoryTable";
import { PurchaseDialog } from "./subscription/PurchaseDialog";
import { CurrentPlanBanner } from "./subscription/CurrentPlanBanner";

// Types & Constants
import { Plan, SubscriptionRecord } from "./subscription/types";
import { PLANS } from "./subscription/constants";

export function ParentSubscription() {
  const { currentUser } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [parentId, setParentId] = useState<string | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<SubscriptionRecord | null>(null);
  const [allSubscriptions, setAllSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "quarterly" | "yearly">("quarterly");
  
  // Dialog States
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [purchasingPlan, setPurchasingPlan] = useState<Plan | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [subToCancel, setSubToCancel] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && carouselRef.current && typeof window !== "undefined" && window.innerWidth < 768) {
      const container = carouselRef.current;
      // Use a small timeout to ensure layout is calculated
      const timer = setTimeout(() => {
        const secondCard = container.children[1] as HTMLElement;
        if (secondCard) {
          const scrollAmount = secondCard.offsetLeft - (container.offsetWidth / 2) + (secondCard.offsetWidth / 2);
          container.scrollLeft = scrollAmount;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);


  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await apiFetch("/api/subscriptions");
      if (!res.ok) throw new Error("Failed to fetch subscriptions");
      const data = await res.json();
      setParentId(data.parent?.id || null);
      setActiveSubscription(data.activeSubscription || null);
      setAllSubscriptions(data.subscriptions || []);
    } catch {
      toast.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handlePurchase = (plan: Plan) => {
    if (plan.id === "basic") {
      if (activeSubscription) {
        handleCancelSubscription(activeSubscription.id);
      }
      return;
    }
    setPurchasingPlan(plan);
    setPurchaseDialogOpen(true);
  };

  const confirmPurchase = async () => {
    if (!purchasingPlan || !parentId) return;
    setProcessing(true);
    try {
      // 🚀 UPGRADE/DOWNGRADE LOGIC
      if (activeSubscription && activeSubscription.transactionId?.startsWith('sub_')) {
        const currentPrice = activeSubscription.amount;
        const newPrice = purchasingPlan.pricing[billingCycle].price;
        const immediate = newPrice > currentPrice; // Upgrade = immediate, Downgrade = next cycle

        const res = await apiFetch("/api/subscriptions/razorpay/update-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscriptionId: activeSubscription.transactionId,
            planId: purchasingPlan.id,
            period: billingCycle,
            immediate
          }),
        });

        const updateData = await res.json();
        if (!res.ok) throw new Error(updateData.error || "Failed to update subscription");

        toast.success(immediate ? "Plan Upgraded!" : "Plan Downgrade Scheduled", {
          description: immediate 
            ? `Your ${purchasingPlan.name} features are now active.` 
            : `Your downgrade to ${purchasingPlan.name} will happen after this month.`
        });
        
        setPurchaseDialogOpen(false);
        fetchSubscriptions();
        setProcessing(false);
        return;
      }

      // 1. Create New Subscription Order on Backend
      const res = await apiFetch("/api/subscriptions/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: purchasingPlan.id,
          period: billingCycle,
          parentId
        }),
      });
      
      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || "Failed to initiate subscription");

      // 2. Open Razorpay Checkout for Subscriptions
      const options = {
        key: orderData.keyId,
        subscription_id: orderData.subscriptionId,
        name: currentUser?.tenantName ? `${currentUser.tenantName} - Premium` : "Eylisia Premium",
        description: `Unlocking ${purchasingPlan.name} Access`,
        image: currentUser?.tenantLogo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
        handler: async (response: any) => {
          setProcessing(true);
          try {
            // 3. Verify Payment and Activate
            const verifyRes = await apiFetch("/api/subscriptions/razorpay/verify-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
                parentId,
                planId: purchasingPlan.id,
                planName: purchasingPlan.name,
                amount: purchasingPlan.pricing[billingCycle].price,
                period: billingCycle
              }),
            });

            if (!verifyRes.ok) throw new Error("Verification failed");

            toast.success("Welcome to Premium!", {
              description: `Your ${purchasingPlan.name} features are now active.`
            });
            
            setPurchaseDialogOpen(false);
            fetchSubscriptions();
          } catch (err: any) {
            toast.error("Activation Failed", {
              description: "We could not verify your payment. Please contact support."
            });
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: currentUser?.name || "",
          email: currentUser?.email || "",
          contact: (currentUser as any)?.phone || ""
        },
        theme: {
          color: "#f59e0b",
          backdrop_color: "#0f172a",
          hide_topbar: false
        },
        modal: {
          ondismiss: () => setProcessing(false),
          backdrop_close: false,
          confirm_close: true
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast.error("Purchase failed", {
        description: error.message || "Could not connect to payment gateway."
      });
      setProcessing(false);
    }
  };

  const handleCancelSubscription = (subscriptionId: string) => {
    setSubToCancel(subscriptionId);
    setCancelDialogOpen(true);
  };

  const confirmCancellation = async () => {
    if (!subToCancel) return;
    
    setProcessing(true);
    try {
      const targetSub = allSubscriptions.find(s => s.id === subToCancel);
      const rzpSubId = targetSub?.transactionId || subToCancel;

      const res = await apiFetch("/api/subscriptions/razorpay/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: rzpSubId }),
      });

      if (!res.ok) throw new Error("Cancel failed");
      toast.success("Cancelled at period end", {
        description: "Auto-pay is now off. Your access remains for now."
      });
      await fetchSubscriptions();
    } catch (error: any) {
      toast.error("Failed to cancel subscription", { description: error.message });
    } finally {
      setProcessing(false);
      setCancelDialogOpen(false);
      setSubToCancel(null);
    }
  };


  const currentPlanId = (activeSubscription?.planId || activeSubscription?.planName?.toLowerCase().replace(" plan", "") || "basic").toLowerCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-amber-500" />
        <span className="ml-3 text-zinc-500 dark:text-zinc-400">Loading subscriptions...</span>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 pb-12">
      <Script
        id="razorpay-checkout"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto px-4 relative">
        <div className="inline-flex items-center justify-center size-12 sm:size-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white mb-4 shadow-lg shadow-amber-200 dark:shadow-amber-900/30">
          <Crown className="size-6 sm:size-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Premium Subscriptions</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
          Unlock advanced analytics, AI-powered insights, and real-time parent-teacher engagement tools.
        </p>
      </div>

      {/* Current Plan Banner */}
      {activeSubscription && currentPlanId !== "basic" && (
        <div className="px-4">
          <CurrentPlanBanner 
            subscription={activeSubscription} 
            onCancel={handleCancelSubscription} 
          />
        </div>
      )}

      {/* Cycle Switcher */}
      <div className="flex justify-center px-4">
        <Tabs 
          value={billingCycle} 
          onValueChange={(v) => setBillingCycle(v as any)} 
          className="bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl shadow-sm w-full max-w-md border border-zinc-200 dark:border-zinc-700"
        >
          <TabsList className="bg-transparent h-10 sm:h-12 flex w-full gap-1 p-0">
            <TabsTrigger 
              value="monthly" 
              className="flex-1 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm data-[state=active]:text-amber-600 transition-all font-semibold text-xs sm:text-sm"
            >
              Monthly
            </TabsTrigger>
            <TabsTrigger 
              value="quarterly" 
              className="flex-1 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm data-[state=active]:text-amber-600 transition-all font-semibold text-xs sm:text-sm"
            >
              Quarterly <span className="hidden sm:inline ml-1.5 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Save 23%</span>
            </TabsTrigger>
            <TabsTrigger 
              value="yearly" 
              className="flex-1 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm data-[state=active]:text-amber-600 transition-all font-semibold text-xs sm:text-sm"
            >
              Yearly <span className="hidden sm:inline ml-1.5 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Save 50%</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Plan Cards */}
      <div 
        ref={carouselRef}
        className="flex md:grid md:grid-cols-3 gap-4 sm:gap-6 px-4 pt-4 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory"
      >
        {PLANS.map((plan) => (
          <div 
            key={plan.id} 
            id={`plan-${plan.id}`}
            className="min-w-[85%] sm:min-w-0 snap-center"
          >
            <PlanCard
              plan={plan}
              isActive={currentPlanId === plan.id}
              cycle={billingCycle}
              onPurchase={handlePurchase}
            />
          </div>
        ))}
      </div>


      {/* Trust Badges */}
      <div className="flex flex-wrap justify-center gap-6 py-4 text-sm text-zinc-400 dark:text-zinc-500 border-y border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-1.5"><Shield className="size-4" /><span>Secure Payment</span></div>
        <div className="flex items-center gap-1.5"><Clock className="size-4" /><span>Cancel Anytime</span></div>
        <div className="flex items-center gap-1.5"><TrendingUp className="size-4" /><span>Upgrade Anytime</span></div>
        <div className="flex items-center gap-1.5"><UsersIcon className="size-4" /><span>5000+ Parents Trust Us</span></div>
      </div>

      {/* Payment History */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Receipt className="size-5 text-zinc-600 dark:text-zinc-400" />
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Payment History</h3>
        </div>
        <Card className="rounded-xl border-zinc-200 dark:border-zinc-700 shadow-none overflow-hidden">
          <CardContent className="p-0">
            <HistoryTable subscriptions={allSubscriptions} />
          </CardContent>
        </Card>
      </div>

      {/* Purchase Confirmation Dialog */}
      <PurchaseDialog
        open={purchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
        plan={purchasingPlan}
        cycle={billingCycle}
        processing={processing}
        onConfirm={confirmPurchase}
        userName={currentUser?.name}
      />

      {/* Cancellation Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-amber-100 dark:border-amber-900/30 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
              <span className="size-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">⚠️</span>
              Cancel Subscription?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-600 dark:text-zinc-400 py-2">
              Your premium features will remain active until the end of the current billing cycle. 
              After that, you will be moved to the free plan and auto-payments will stop.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-end gap-3">
            <AlertDialogCancel className="rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              Keep Premium
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCancellation}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-all active:scale-95"
            >
              Confirm Cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
