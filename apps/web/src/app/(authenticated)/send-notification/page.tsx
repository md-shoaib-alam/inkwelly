import { SendNotificationScreen } from '@/modules/communication/components/SuperAdminSendNotification';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Send Push Notifications | Platform Admin',
  description: 'Send test and global FCM push notifications to platform users.',
};

export default function SendNotificationPage() {
  return <SendNotificationScreen />;
}
