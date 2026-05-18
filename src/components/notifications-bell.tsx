'use client';

import {
  Alert01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Notification03Icon,
  Tick01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { api } from '~convex/_generated/api';
import type { Id } from '~convex/_generated/dataModel';

import { Button } from '@/components/ui/button';

type Notification = {
  _id: Id<'notifications'>;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  actionUrl?: string;
  readBy?: string[];
  createdAt: number;
};

const SEVERITY_STYLES = {
  info: {
    dot: 'bg-primary',
    icon: Notification03Icon,
    iconClass: 'text-primary',
  },
  warning: {
    dot: 'bg-warning',
    icon: Alert01Icon,
    iconClass: 'text-warning',
  },
  error: {
    dot: 'bg-destructive',
    icon: Cancel01Icon,
    iconClass: 'text-destructive',
  },
  success: {
    dot: 'bg-success',
    icon: CheckmarkCircle02Icon,
    iconClass: 'text-success',
  },
};

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const notifications = useQuery(api.notifications.getMyNotifications, { limit: 10 });
  const unreadCount = useQuery(api.notifications.getUnreadCount, {});
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const dismiss = useMutation(api.notifications.dismiss);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => setOpen((prev) => !prev);

  const handleNotificationClick = async (n: Notification) => {
    await markRead({ notificationId: n._id });
    if (n.actionUrl) {
      router.push(n.actionUrl as any);
      setOpen(false);
    }
  };

  const handleDismiss = async (e: React.MouseEvent, id: Id<'notifications'>) => {
    e.stopPropagation();
    await dismiss({ notificationId: id });
  };

  const count = unreadCount ?? 0;

  return (
    <div className='relative' ref={panelRef}>
      <Button
        variant='ghost'
        size='icon'
        className='relative h-9 w-9'
        onClick={handleOpen}
        title='Notifications'
        id='notifications-bell'
      >
        <HugeiconsIcon icon={Notification03Icon} size={18} />
        {count > 0 && (
          <span className='absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white'>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </Button>

      {open && (
        <div className='absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border/60 bg-popover shadow-2xl sm:w-96'>
          {/* Header */}
          <div className='flex items-center justify-between border-b border-border/60 px-4 py-3'>
            <span className='font-heading text-sm font-semibold'>Notifications</span>
            {count > 0 && (
              <button
                onClick={() => markAllRead()}
                className='flex items-center gap-1.5 text-xs text-primary hover:underline'
              >
                <HugeiconsIcon icon={Tick01Icon} size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className='max-h-96 overflow-y-auto'>
            {notifications === undefined ? (
              <div className='flex h-24 items-center justify-center text-sm text-muted-foreground'>
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div className='flex h-24 items-center justify-center text-sm text-muted-foreground'>
                No notifications
              </div>
            ) : (
              notifications.map((n) => {
                const style = SEVERITY_STYLES[n.severity];
                const isUnread = !n.readBy?.length;
                return (
                  <div
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`group flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30 ${
                      isUnread ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className={`mt-0.5 shrink-0 ${style.iconClass}`}>
                      <HugeiconsIcon icon={style.icon} size={16} />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-start justify-between gap-2'>
                        <p className={`text-sm font-medium ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {n.title}
                        </p>
                        <button
                          onClick={(e) => handleDismiss(e, n._id)}
                          className='shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground'
                          title='Dismiss'
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={12} />
                        </button>
                      </div>
                      <p className='mt-0.5 text-xs text-muted-foreground line-clamp-2'>{n.message}</p>
                      <p className='mt-1 text-[10px] text-muted-foreground/60'>{timeAgo(n.createdAt)}</p>
                    </div>
                    {isUnread && (
                      <div className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {(notifications?.length ?? 0) > 0 && (
            <div className='border-t border-border/60 px-4 py-2.5'>
              <button
                onClick={() => {
                  router.push('/admin/audit-log' as any);
                  setOpen(false);
                }}
                className='w-full text-center text-xs text-primary hover:underline'
              >
                View all in Audit Log →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
