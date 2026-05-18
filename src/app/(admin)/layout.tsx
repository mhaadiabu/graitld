import { redirect } from 'next/navigation';

import { AdminSidebar } from '@/components/admin-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { isAuthenticated } from '@/lib/auth-server';

/**
 * Admin layout — uses the same authentication gate as the dashboard layout.
 * A separate sidebar is provided that reflects the admin navigation structure.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthenticated();
  if (!authed) {
    redirect('/sign-in');
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className='flex w-full flex-1 flex-col overflow-x-hidden px-4 pt-4 pb-8 sm:px-6'>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
