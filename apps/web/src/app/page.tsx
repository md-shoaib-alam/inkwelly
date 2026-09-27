import { Metadata } from 'next';
import { cookies } from 'next/headers';
import HomeClient from './home-client';

export const metadata: Metadata = {
  title: 'SchoolSaaS | All-in-One School Management Platform',
  description: 'The most powerful, intuitive, and modern platform to manage your school ecosystem. From attendance to exams, we have you covered.',
};

export default async function Home() {
  const cookieStore = await cookies();
  const hasToken = cookieStore.has('school_token');
  return <HomeClient initialHasToken={hasToken} />;
}
