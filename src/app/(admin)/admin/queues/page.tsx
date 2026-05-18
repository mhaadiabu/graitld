'use client';

import { useQuery } from 'convex/react';
import { api } from '~convex/_generated/api';
import {
  Database02Icon,
  Refresh01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Clock01Icon,
  Search01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function QueuesPage() {
  const [search, setSearch] = useState('');
  const stats = useQuery(api.admin.getPlatformStats);
  const channels = useQuery(api.influencers.getChannels, {});

  if (stats === undefined || channels === undefined) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-10 w-full max-w-md' />
        <div className='grid gap-6 sm:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='h-32 rounded-xl' />
          ))}
        </div>
        <Skeleton className='h-96 w-full rounded-xl' />
      </div>
    );
  }

  const filtered = channels.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.handle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className='stagger-children space-y-6 max-w-6xl'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-sm text-muted-foreground'>
          Monitor background data synchronization queues. Ensure YouTube Analytics and public metadata remain up-to-date.
        </p>
        <InputGroup className='w-full sm:w-72 bg-card'>
          <InputGroupAddon align='inline-start'>
            <HugeiconsIcon icon={Search01Icon} size={14} className='text-muted-foreground' />
          </InputGroupAddon>
          <InputGroupInput
            placeholder='Filter channels...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
      </div>

      <div className='grid gap-6 sm:grid-cols-3'>
        <Card className='glass-panel border-0'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-success/20 text-success'>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} />
              </div>
              <div>
                <p className='text-2xl font-bold'>{stats.activeConnections}</p>
                <p className='text-xs text-muted-foreground'>Healthy Connections</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className='glass-panel border-0'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/20 text-destructive'>
                <HugeiconsIcon icon={Cancel01Icon} size={20} />
              </div>
              <div>
                <p className='text-2xl font-bold'>{stats.expiredConnections}</p>
                <p className='text-xs text-muted-foreground'>Sync Failures</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className='glass-panel border-0'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary'>
                <HugeiconsIcon icon={Refresh01Icon} size={20} />
              </div>
              <div>
                <p className='text-2xl font-bold'>{stats.channels}</p>
                <p className='text-xs text-muted-foreground'>Tracked Targets</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className='glass-panel border-0 overflow-hidden'>
        <CardHeader className='border-b border-border/40 bg-muted/20 px-6 py-4'>
          <CardTitle className='text-sm font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-2'>
            <HugeiconsIcon icon={Database02Icon} size={16} />
            Data Refresh Status
          </CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm text-left'>
              <thead>
                <tr className='border-b border-border/60 bg-muted/30'>
                  <th className='px-6 py-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>Channel</th>
                  <th className='px-6 py-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>Public Data</th>
                  <th className='px-6 py-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>Analytics Sync</th>
                  <th className='px-6 py-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>Last Refresh</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/40'>
                {filtered.map((channel) => (
                  <tr key={channel._id} className='hover:bg-muted/10 transition-colors'>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-3'>
                        <div className='h-8 w-8 rounded-full bg-muted overflow-hidden flex-shrink-0'>
                          {channel.profileImageUrl ? (
                            <img src={channel.profileImageUrl} alt='' className='h-full w-full object-cover' />
                          ) : (
                            <div className='h-full w-full flex items-center justify-center text-[10px] font-bold'>
                              {channel.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className='font-medium'>{channel.name}</p>
                          <p className='text-xs text-muted-foreground'>@{channel.handle}</p>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <Badge variant={channel.publicDataStatus === 'public_imported' ? 'success' : 'outline'} className='text-[10px]'>
                        {channel.publicDataStatus.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className='px-6 py-4'>
                      <Badge variant={channel.analyticsStatus === 'active' ? 'success' : channel.analyticsStatus === 'not_connected' ? 'outline' : 'destructive'} className='text-[10px]'>
                        {channel.analyticsStatus.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className='px-6 py-4 text-xs text-muted-foreground'>
                      {channel.analyticsLastSyncedAt || channel.lastPublicRefresh 
                        ? new Date(Math.max(channel.analyticsLastSyncedAt ?? 0, channel.lastPublicRefresh ?? 0)).toLocaleString() 
                        : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
