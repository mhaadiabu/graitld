'use client';

import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import {
  Activity01Icon,
  Database02Icon,
  UserGroupIcon,
  ChartRadarIcon,
  LinkSquare02Icon,
  Alert01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { api } from '~convex/_generated/api';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function MetricCard({
  label,
  value,
  icon,
  accentClass,
}: {
  label: string;
  value: string | number;
  icon: typeof Activity01Icon;
  accentClass?: string;
}) {
  return (
    <Card className='glass-panel hover-card-effect relative overflow-hidden rounded-2xl border-0 p-0 transition-all duration-300'>
      <CardContent className='relative z-10 p-6 flex flex-col gap-4'>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm ${accentClass ?? 'text-foreground'}`}>
          <HugeiconsIcon icon={icon} size={20} />
        </div>
        <div>
          <p className='font-heading text-xs font-bold tracking-widest text-muted-foreground/80 uppercase'>
            {label}
          </p>
          <div className='mt-1 flex items-baseline gap-2'>
            <p className={`font-heading text-3xl font-bold tracking-tight ${accentClass ?? 'text-foreground'}`}>
              {value}
            </p>
          </div>
        </div>
      </CardContent>
      <div className='absolute -top-6 -right-6 h-24 w-24 rounded-full bg-linear-to-br from-white/5 to-white/0 blur-2xl dark:from-white/10' />
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className='h-36 rounded-2xl' />
        ))}
      </div>
      <div className='grid gap-6 lg:grid-cols-2'>
        <Skeleton className='h-96 rounded-2xl' />
        <Skeleton className='h-96 rounded-2xl' />
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const stats = useQuery(api.admin.getPlatformStats);
  const auditStats = useQuery(api.admin.getAuditLogStats);

  if (stats === undefined || auditStats === undefined) {
    return <OverviewSkeleton />;
  }

  return (
    <div className='stagger-children mx-auto w-full max-w-[1600px] space-y-6'>
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        <MetricCard
          label='Total Channels'
          value={stats.channels}
          icon={UserGroupIcon}
        />
        <MetricCard
          label='Tax Estimates'
          value={stats.taxEstimates}
          icon={ChartRadarIcon}
          accentClass='text-primary'
        />
        <MetricCard
          label='Active Connections'
          value={stats.activeConnections}
          icon={LinkSquare02Icon}
          accentClass='text-success'
        />
        <MetricCard
          label='Active Alerts'
          value={stats.activeNotifications}
          icon={Alert01Icon}
          accentClass={stats.activeNotifications > 0 ? 'text-warning' : 'text-muted-foreground'}
        />
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card className='glass-panel rounded-2xl border-0 p-0'>
          <CardHeader className='px-6 pt-6'>
            <CardTitle className='font-heading text-sm font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2'>
              <HugeiconsIcon icon={Activity01Icon} size={16} />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <div className='space-y-4 mt-2'>
              <div className='flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-4'>
                <div className='flex items-center gap-3'>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${stats.expiredConnections > 0 ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>
                    <HugeiconsIcon icon={stats.expiredConnections > 0 ? Alert01Icon : CheckmarkCircle02Icon} size={16} />
                  </div>
                  <div>
                    <p className='text-sm font-semibold'>OAuth Connections</p>
                    <p className='text-xs text-muted-foreground'>YouTube Analytics API status</p>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-bold'>{stats.activeConnections} Active</p>
                  {stats.expiredConnections > 0 && (
                    <p className='text-xs text-warning'>{stats.expiredConnections} Expired/Failed</p>
                  )}
                </div>
              </div>

              <div className='flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-4'>
                <div className='flex items-center gap-3'>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${stats.failedSyncs > 0 ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'}`}>
                    <HugeiconsIcon icon={stats.failedSyncs > 0 ? Cancel01Icon : CheckmarkCircle02Icon} size={16} />
                  </div>
                  <div>
                    <p className='text-sm font-semibold'>Background Sync Queue</p>
                    <p className='text-xs text-muted-foreground'>Nightly analytics data refresh</p>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-bold'>Operational</p>
                  {stats.failedSyncs > 0 && (
                    <p className='text-xs text-destructive'>{stats.failedSyncs} Failed Jobs</p>
                  )}
                </div>
              </div>
              
              <div className='flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-4'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-success/20 text-success'>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
                  </div>
                  <div>
                    <p className='text-sm font-semibold'>Convex Database</p>
                    <p className='text-xs text-muted-foreground'>Real-time sync engine</p>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-bold'>Connected</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='glass-panel rounded-2xl border-0 p-0'>
          <CardHeader className='px-6 pt-6'>
            <CardTitle className='font-heading text-sm font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2'>
              <HugeiconsIcon icon={Database02Icon} size={16} />
              Platform Activity
            </CardTitle>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <div className='grid gap-4 sm:grid-cols-2 mt-2'>
              <div className='rounded-xl border border-border/60 bg-background/50 p-4 text-center'>
                <p className='text-2xl font-bold'>{auditStats.last24h}</p>
                <p className='text-xs text-muted-foreground mt-1'>Events (24h)</p>
              </div>
              <div className='rounded-xl border border-border/60 bg-background/50 p-4 text-center'>
                <p className='text-2xl font-bold'>{auditStats.lastWeek}</p>
                <p className='text-xs text-muted-foreground mt-1'>Events (7d)</p>
              </div>
            </div>

            <div className='mt-6 space-y-4'>
              <div>
                <p className='text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3'>Top Actions</p>
                <div className='space-y-2'>
                  {auditStats.topActions.map(({action, count}) => (
                    <div key={action} className='flex items-center justify-between'>
                      <span className='text-sm text-muted-foreground'>{action.replace(/_/g, ' ')}</span>
                      <span className='text-sm font-medium'>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className='glass-panel rounded-2xl border-0 p-0'>
        <CardHeader className='px-6 pt-6'>
          <CardTitle className='font-heading text-sm font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2'>
            <HugeiconsIcon icon={Alert01Icon} size={16} />
            Notification Lab (Debug)
          </CardTitle>
        </CardHeader>
        <CardContent className='px-6 pb-6'>
          <div className='flex flex-wrap gap-4 mt-2'>
            <NotificationTester 
              severity='info' 
              title='System Update' 
              message='A new platform update is scheduled for tonight at 02:00 GMT.' 
            />
            <NotificationTester 
              severity='warning' 
              title='API Quota Warning' 
              message='YouTube Data API quota usage has exceeded 80% for today.' 
            />
            <NotificationTester 
              severity='error' 
              title='Sync Failure' 
              message='Failed to refresh analytics for 12 channels due to expired tokens.' 
            />
            <NotificationTester 
              severity='success' 
              title='Tax Batch Complete' 
              message='The monthly tax assessment batch for May 2026 has been generated.' 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationTester({ 
  severity, 
  title, 
  message 
}: { 
  severity: 'info' | 'warning' | 'error' | 'success', 
  title: string, 
  message: string 
}) {
  const createNotification = useMutation(api.notifications.createNotification);
  const [sending, setSending] = useState(false);

  const handleTrigger = async () => {
    setSending(true);
    try {
      await createNotification({
        title,
        message,
        severity,
        expiresAt: Date.now() + 1000 * 60 * 60 * 24, // 24h
      });
    } finally {
      setSending(false);
    }
  };

  const colors = {
    info: 'hover:bg-primary/10 hover:text-primary',
    warning: 'hover:bg-warning/10 hover:text-warning',
    error: 'hover:bg-destructive/10 hover:text-destructive',
    success: 'hover:bg-success/10 hover:text-success',
  };

  return (
    <button
      onClick={handleTrigger}
      disabled={sending}
      className={`flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-4 py-2 text-xs font-medium transition-all ${colors[severity]} disabled:opacity-50`}
    >
      <div className={`h-2 w-2 rounded-full ${severity === 'info' ? 'bg-primary' : severity === 'warning' ? 'bg-warning' : severity === 'error' ? 'bg-destructive' : 'bg-success'}`} />
      Trigger {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </button>
  );
}
