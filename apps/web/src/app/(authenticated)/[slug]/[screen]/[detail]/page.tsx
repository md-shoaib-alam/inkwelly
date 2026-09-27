export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import TenantScreenDispatcherClient from '../tenant-screen-dispatcher';

type Props = {
  params: Promise<{ slug: string; screen: string; detail: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, screen, detail } = await params;
  
  const displaySlug = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const displayScreen = screen
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const displayDetail = decodeURIComponent(detail);

  return {
    title: `${displayDetail} - ${displayScreen} | ${displaySlug} | SchoolSaaS`,
    description: `Manage details of ${displayDetail} on ${displayScreen} for ${displaySlug}.`,
  };
}

export default function TenantScreenDispatcher() {
  return <TenantScreenDispatcherClient />;
}
