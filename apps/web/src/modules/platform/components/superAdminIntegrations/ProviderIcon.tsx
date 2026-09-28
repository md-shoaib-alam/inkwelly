import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Bus,
  Cloud,
  CreditCard,
  FileText,
  Fingerprint,
  Landmark,
  Puzzle,
  Receipt,
  MessageSquare,
  Scale,
  ShieldCheck,
  Smartphone,
  Video,
  Wallet,
} from "lucide-react";

/**
 * Icon per provider id. Lives here rather than in the catalog because the catalog is
 * served by the API and must stay free of frontend dependencies.
 */
const ICONS: Record<string, LucideIcon> = {
  tally: Landmark,
  "zoho-books": Receipt,
  whatsapp: MessageSquare,
  sms: Smartphone,
  biometric: Fingerprint,
  "bus-gps": Bus,
  "video-classes": Video,
  "fee-financing": Wallet,
  esign: FileText,
  "payroll-statutory": ShieldCheck,
  "cbse-udise": Scale,
  razorpay: CreditCard,
  "fcm-push": Bell,
  "s3-storage": Cloud,
};

export function providerIcon(providerId: string): LucideIcon {
  return ICONS[providerId] ?? Puzzle;
}

export function ProviderIcon({
  providerId,
  className,
}: {
  providerId: string;
  className?: string;
}) {
  const Icon = providerIcon(providerId);
  return <Icon className={className} />;
}
