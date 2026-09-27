export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import TenantScreenDispatcherClient from './tenant-screen-dispatcher';

type Props = {
  params: Promise<{ slug: string; screen: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, screen } = await params;
  
  // Format slug for title (e.g. school-20 -> School 20)
  const displaySlug = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Format screen name for title (e.g. results-entry -> Results Entry)
  const displayScreen = screen
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${displayScreen} | ${displaySlug} | SchoolSaaS`,
    description: `Manage ${displayScreen} for ${displaySlug}. Access all your school management tools on SchoolSaaS.`,
  };
}

export default function TenantScreenDispatcher() {
  return <TenantScreenDispatcherClient />;
}
