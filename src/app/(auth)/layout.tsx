import { redirect } from 'next/navigation';

import { isAuthenticated } from '@/lib/auth-server';
import { AuthLayoutClient } from './AuthLayoutClient';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();
  if (authed) {
    redirect('/');
  }

  return <AuthLayoutClient>{children}</AuthLayoutClient>;
}
