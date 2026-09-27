import { Metadata } from 'next';
import ResetPasswordClient from './reset-password-client';

export const metadata: Metadata = {
  title: 'Reset Password | SchoolSaaS',
  description: 'Recover your account access by resetting your secure password.',
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
