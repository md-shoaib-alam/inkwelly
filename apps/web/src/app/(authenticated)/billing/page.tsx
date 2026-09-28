import { SuperAdminBilling } from '@/modules/finance/components/SuperAdminBilling';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billing & Subscriptions | Platform Admin',
  description: 'Manage school subscriptions, parent payments, and financial analytics for the platform.',
};

export default function BillingPage() {
  return <SuperAdminBilling />;
}
