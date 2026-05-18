'use client';

import { useQuery } from 'convex/react';
import { useState } from 'react';
import { api } from '~convex/_generated/api';

import { Clock01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Card, CardContent } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const logs = useQuery(api.admin.getAuditLogs, { limit: 100 });

  if (logs === undefined) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-10 w-full max-w-md' />
        <div className='space-y-3 mt-8'>
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className='h-16 w-full rounded-xl' />
          ))}
        </div>
      </div>
    );
  }

  let filtered = logs;
  if (search) {
    const q = search.toLowerCase();
    filtered = logs.filter(
      (log) =>
        log.action.toLowerCase().includes(q) ||
        (log.userName ?? '').toLowerCase().includes(q) ||
        (log.entityType ?? '').toLowerCase().includes(q) ||
        (log.details ?? '').toLowerCase().includes(q),
    );
  }

  return (
    <div className='stagger-children space-y-6 max-w-5xl'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-sm text-muted-foreground'>
          Comprehensive platform audit trail. All administrative and operational actions are recorded here for compliance.
        </p>
        <InputGroup className='w-full sm:w-72 bg-card'>
          <InputGroupAddon align='inline-start'>
            <HugeiconsIcon icon={Search01Icon} size={14} className='text-muted-foreground' />
          </InputGroupAddon>
          <InputGroupInput
            placeholder='Search logs...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
      </div>

      <Card className='overflow-hidden border-0 bg-transparent shadow-none'>
        <CardContent className='p-0'>
          {filtered.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-card'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-muted/60'>
                <HugeiconsIcon icon={Clock01Icon} size={20} className='text-muted-foreground' />
              </div>
              <p className='mt-4 text-sm font-medium'>No audit logs found</p>
              <p className='text-xs text-muted-foreground mt-1'>Try adjusting your search query.</p>
            </div>
          ) : (
            <div className='rounded-xl border border-border/60 bg-card overflow-hidden'>
              <table className='w-full text-sm text-left'>
                <thead>
                  <tr className='border-b border-border/60 bg-muted/30'>
                    <th className='px-4 py-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>Timestamp</th>
                    <th className='px-4 py-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>Actor</th>
                    <th className='px-4 py-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>Action</th>
                    <th className='px-4 py-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>Target</th>
                    <th className='px-4 py-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>Details</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border/40'>
                  {filtered.map((log) => (
                    <tr key={log._id} className='hover:bg-muted/20 transition-colors'>
                      <td className='px-4 py-3 whitespace-nowrap text-xs text-muted-foreground'>
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </td>
                      <td className='px-4 py-3 whitespace-nowrap'>
                        <span className='font-medium'>{log.userName ?? 'System'}</span>
                        {log.userId && <span className='block text-[10px] text-muted-foreground font-mono mt-0.5'>{log.userId}</span>}
                      </td>
                      <td className='px-4 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center rounded-md bg-secondary/50 px-2 py-1 text-xs font-medium'>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className='px-4 py-3 whitespace-nowrap'>
                        {log.entityType ? (
                          <div>
                            <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>{log.entityType}</span>
                            {log.entityId && <span className='block text-[10px] font-mono mt-0.5 truncate max-w-[120px]'>{log.entityId}</span>}
                          </div>
                        ) : (
                          <span className='text-muted-foreground'>--</span>
                        )}
                      </td>
                      <td className='px-4 py-3'>
                        {log.details ? (
                          <p className='text-xs text-muted-foreground max-w-md truncate' title={log.details}>
                            {log.details}
                          </p>
                        ) : (
                          <span className='text-muted-foreground'>--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
