"use client";

import { useState } from "react";
import Script from "next/script";
import { useAppStore } from "@/store/use-app-store";
import { useTenantMetadata } from "@/lib/graphql/hooks/platform.hooks";
import { PricingPlans, SchoolPlan } from "./subscription/pricing-plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, ShieldCheck } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function ManagePlanScreen() {
  const { push, back } = useRouter();
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const { currentTenantId } = useAppStore();
  const { data: detailData, isLoading: isDetailLoading } = useTenantMetadata(currentTenantId || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const tenant = detailData?.tenant;

  const handleUpgrade = async (plan: SchoolPlan) => {
    setIsUpdating(true);
    try {
      // 1. Create Order on Backend (server derives the price from its plan catalog)
      const orderData = await api.post("/tenants/create-subscription-order", { 
        planId: plan.id
      });

      const { orderId, amount, currency, keyId } = orderData;

      // 2. Configure Razorpay Options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "Eylisia School SaaS",
        description: `Upgrade to ${plan.name} Plan`,
        image: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
        order_id: orderId,
        handler: async (response: any) => {
          setIsUpdating(true);
          try {
            // 3. Verify Payment Signature (server resolves plan + limits from the order it created)
            await api.post("/tenants/verify-subscription-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            toast.success("Subscription Active!", {
              description: `You are now on the ${plan.name} plan.`
            });
            
            // Invalidate cache to reflect new limits immediately
            queryClient.invalidateQueries({ queryKey: ["tenant-detail", currentTenantId] });
            push(`/${slug}/school-subscription`);
          } catch (verifyErr: any) {
            toast.error("Verification Failed", {
              description: "Please contact support if your payment was debited."
            });
          } finally {
            setIsUpdating(false);
          }
        },
        prefill: {
          name: tenant?.name || "",
          email: tenant?.email || "",
          contact: tenant?.phone || ""
        },
        notes: {
          tenantId: currentTenantId,
          planId: plan.id
        },
        theme: {
          color: "#4f46e5"
        },
        modal: {
          ondismiss: () => setIsUpdating(false)
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error("Payment Initiation Failed", {
        description: err.message || "Could not connect to payment gateway."
      });
      setIsUpdating(false);
    }
  };

  if (isDetailLoading || !tenant) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin size-8 border-4 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <Script
        id="razorpay-checkout"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => back()}
            className="rounded-full hover:bg-violet-50 dark:hover:bg-violet-900/20 text-violet-600 dark:text-violet-400 shrink-0"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h2 className="text-xl sm:text-3xl font-semibold tracking-tight flex items-center gap-2">
              Upgrade Institution
              <Crown className="size-5 sm:size-6 text-amber-500 fill-amber-500/20" />
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Scale your school's digital operations.</p>
          </div>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-violet-700 via-violet-800 to-violet-900 dark:from-violet-950 dark:via-violet-900 dark:to-violet-950 border-none overflow-hidden text-white relative shadow-2xl shadow-violet-200 dark:shadow-none">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldCheck className="size-40" />
        </div>
        <CardHeader className="relative z-10">
          <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] opacity-70">Current Active Plan</CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 py-4 sm:py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-4xl sm:text-6xl font-semibold capitalize tracking-tighter mb-1 sm:mb-2 drop-shadow-md">{tenant.plan}</h3>
            <p className="text-violet-100 flex items-center gap-2 font-medium text-xs sm:text-base">
              <span className="size-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              Institutions using this tier have unlocked full {tenant.plan} capabilities.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="px-5 py-4 bg-white/10 dark:bg-black/20 rounded-2xl backdrop-blur-xl border border-white/20 dark:border-white/10 min-w-[140px] shadow-lg">
              <p className="text-[10px] uppercase font-black text-violet-200 mb-1 tracking-widest">Students</p>
              <p className="text-2xl font-black">{tenant.maxStudents.toLocaleString()}</p>
            </div>
            <div className="px-5 py-4 bg-white/10 dark:bg-black/20 rounded-2xl backdrop-blur-xl border border-white/20 dark:border-white/10 min-w-[140px] shadow-lg">
              <p className="text-[10px] uppercase font-black text-violet-200 mb-1 tracking-widest">Staff</p>
              <p className="text-2xl font-black">{tenant.maxTeachers}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6 sm:space-y-8 pt-4">
        <div className="flex items-center justify-center">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
          <span className="px-4 sm:px-8 text-[10px] sm:text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.4em]">Available Upgrades</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />
        </div>
        
        <PricingPlans 
          currentPlan={tenant.plan} 
          onSelectPlan={handleUpgrade}
          isLoading={isUpdating}
        />
      </div>

      <div className="mt-8 sm:mt-16 p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] bg-violet-50/50 dark:bg-violet-950/20 border border-dashed border-violet-200 dark:border-violet-800/50 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
          <div className="size-14 sm:size-16 rounded-xl sm:rounded-2xl bg-white dark:bg-zinc-900 flex items-center justify-center shadow-xl shadow-violet-100 dark:shadow-none border border-violet-50 dark:border-violet-900/50 shrink-0">
            <ShieldCheck className="size-7 sm:size-8 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base sm:text-lg">Enterprise-Grade Security</h4>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md">Every plan features 256-bit encryption and automated daily backups.</p>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-end gap-2">
          <Button variant="link" className="text-violet-600 dark:text-violet-400 font-black tracking-tight hover:no-underline hover:text-violet-700 dark:hover:text-violet-300 transition-colors p-0 h-auto text-sm sm:text-lg">
            Need a custom configuration?
          </Button>
          <p className="text-xs text-muted-foreground font-medium">Contact our school-chain specialists</p>
        </div>
      </div>
    </div>
  );
}
