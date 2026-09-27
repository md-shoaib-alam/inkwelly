import { SuperAdminBilling } from '@/components/screens/super-admin/billing';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billing & Subscriptions | Platform Admin',
  description: 'Manage school subscriptions, parent payments, and financial analytics for the platform.',
};

export default function BillingPage() {
  return <SuperAdminBilling />;
}
