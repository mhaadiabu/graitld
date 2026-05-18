'use client';

import {
  DashboardSquare02Icon,
  Settings01Icon,
  Clock01Icon,
  Logout03Icon,
  Database02Icon,
  ArrowLeft01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from './ui/sidebar';

const navItems: {
  title: string;
  href: string;
  icon: typeof DashboardSquare02Icon;
}[] = [
  {
    title: 'Platform Overview',
    href: '/admin',
    icon: DashboardSquare02Icon,
  },
  {
    title: 'System Configuration',
    href: '/admin/system-config',
    icon: Settings01Icon,
  },
  {
    title: 'Audit Log',
    href: '/admin/audit-log',
    icon: Clock01Icon,
  },
  {
    title: 'Data & Queues',
    href: '/admin/queues',
    icon: Database02Icon,
  },
];

export const AdminSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/sign-in');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <Sidebar className='border-r border-sidebar-border bg-sidebar text-sidebar-foreground'>
      <SidebarHeader className='px-4 py-6'>
        <div className='flex flex-col items-start gap-3.5'>
          <Image alt='GRA logo' src='/logo.png' width={80} height={60} className='shadow' />
          <div className='flex flex-col gap-0.5'>
            <span className='font-heading text-sm font-bold tracking-tight text-sidebar-primary'>
              Platform Administration
            </span>
            <span className='text-[10px] font-medium tracking-wider text-sidebar-foreground/50 uppercase'>
              GRA Command Center
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className='px-2'>
        <SidebarGroup>
          <SidebarGroupLabel className='mb-2 px-2 text-[10px] font-bold tracking-widest text-sidebar-foreground/40 uppercase'>
            Administration
          </SidebarGroupLabel>
          <SidebarMenu className='space-y-1'>
            {navItems.map(({ icon, href, title }) => {
              const active = isActive(href);
              return (
                <SidebarMenuItem key={title}>
                  <SidebarMenuButton
                    isActive={active}
                    render={<Link href={href as Route} />}
                    className={`
                      relative h-10 w-full justify-start gap-3 overflow-hidden rounded-lg px-3 transition-all duration-200
                      ${
                        active
                          ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-sm'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      }
                    `}
                  >
                    {active && (
                      <span className='absolute top-1/2 left-0 h-full w-0.75 -translate-y-1/2 bg-sidebar-primary shadow-[0_0_12px_rgba(var(--sidebar-primary),0.5)]' />
                    )}
                    <HugeiconsIcon
                      icon={icon}
                      size={18}
                      className={`shrink-0 transition-colors ${active ? 'text-sidebar-primary' : 'text-sidebar-foreground/60'}`}
                    />
                    <span className='truncate tracking-tight'>{title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className='p-4'>
        <SidebarSeparator className='my-1 opacity-50' />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href='/' />}
              className='flex items-center gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={18}
              />
              <span className='font-medium'>Back to Operations</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              variant='destructive'
              onClick={handleSignOut}
              className='flex items-center gap-3'
            >
              <HugeiconsIcon
                icon={Logout03Icon}
                size={18}
                className='transition-colors group-hover:text-destructive'
              />
              <span className='font-medium'>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
