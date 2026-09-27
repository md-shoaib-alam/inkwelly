export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import GenericSlugDispatcherClient from './generic-slug-dispatcher';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  // Format slug for title (e.g. school-20 -> School 20)
  const displaySlug = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${displaySlug} | SchoolSaaS`,
    description: `Access your portal for ${displaySlug}. Manage students, attendance, exams, and more on SchoolSaaS.`,
  };
}

export default function GenericSlugDispatcher() {
  return <GenericSlugDispatcherClient />;
}
