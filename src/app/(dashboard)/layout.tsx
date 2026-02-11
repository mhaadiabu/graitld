import { Authenticated } from 'convex/react';

import { AppSidebar } from '@/src/components/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/src/components/ui/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Authenticated>
      <SidebarProvider>
        <AppSidebar />
        <main>
          <SidebarTrigger />
          {children}
        </main>
      </SidebarProvider>
    </Authenticated>
  );
}
