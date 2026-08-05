'use client';

import { Add01Icon, Edit01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMutation, useQuery } from 'convex/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { api } from '~convex/_generated/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  currencyConfig,
  formatAnalyticsStatus,
  formatCurrency,
  formatPublicStatus,
  formatRevenueSource,
  titleCaseLabel,
} from '@/lib/product';
import {
  ESTIMATED_REVENUE_DISCLAIMER,
  estimateRevenueFromViews,
  formatEstimatedRevenue,
} from '@/lib/revenue-estimate';
import {
  DEFAULT_TAX_PERIOD_DAYS,
  estimateTaxForPeriod,
  TAX_PERIOD_OPTIONS,
} from '@/lib/tax-period-estimate';

const COMPLIANCE_STATUSES = ['compliant', 'non-compliant', 'pending', 'under-review'] as const;

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    compliant: 'status-compliant',
    'non-compliant': 'status-non-compliant',
    pending: 'status-pending',
    'under-review': 'status-under-review',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${classes[status] ?? 'bg-muted text-muted-foreground'}`}
    >
      {status.replace('-', ' ')}
    </span>
  );
}

function SourceBadge({ label, variant = 'outline' }: { label: string; variant?: 'outline' | 'secondary' }) {
  return (
    <Badge variant={variant} className='text-[10px] tracking-wide uppercase'>
      {label}
    </Badge>
  );
}

// ─── Types ──────────────────────────────────────────────────────────────────
type EditForm = {
  complianceStatus: (typeof COMPLIANCE_STATUSES)[number];
  email: string;
  phone: string;
  taxIdNumber: string;
  notes: string;
  estimatedMonthlyRevenue: string;
  estimatedAnnualRevenue: string;
};

const EDIT_FORM_DEFAULTS: EditForm = {
  complianceStatus: 'pending',
  email: '',
  phone: '',
  taxIdNumber: '',
  notes: '',
  estimatedMonthlyRevenue: '',
  estimatedAnnualRevenue: '',
};

export default function InfluencersPage() {
  const channels = useQuery(api.influencers.getChannels, {});
  const createChannel = useMutation(api.influencers.createChannel);
  const updateChannel = useMutation(api.influencers.updateChannel);
  const deleteChannel = useMutation(api.influencers.deleteChannel);
  const searchParams = useSearchParams();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<(typeof COMPLIANCE_STATUSES)[number] | 'all'>(
    'all',
  );
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [taxPeriodDays, setTaxPeriodDays] = useState<number>(DEFAULT_TAX_PERIOD_DAYS);
  const [form, setForm] = useState({
    name: '',
    handle: '',
    email: '',
    estimatedMonthlyRevenue: '',
    estimatedAnnualRevenue: '',
    taxIdNumber: '',
    notes: '',
  });

  // ── Edit channel state ─────────────────────────────────────────────────────
  const [editingChannel, setEditingChannel] = useState<NonNullable<typeof channels>[number] | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(EDIT_FORM_DEFAULTS);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  function openEdit(channel: NonNullable<typeof channels>[number]) {
    setEditingChannel(channel);
    setUpdateError(null);
    setEditForm({
      complianceStatus: channel.complianceStatus ?? 'pending',
      email: channel.email ?? '',
      phone: channel.phone ?? '',
      taxIdNumber: channel.taxIdNumber ?? '',
      notes: channel.notes ?? '',
      estimatedMonthlyRevenue: '',
      estimatedAnnualRevenue: channel.estimatedAnnualRevenue?.toString() ?? '',
    });
  }

  const connectSuccess = searchParams.get('connectSuccess');
  const connectError = searchParams.get('connectError');
  const connectedChannelId = searchParams.get('channelId');

  const connectNotice = useMemo(() => {
    if (connectSuccess === '1') {
      return {
        tone: 'success' as const,
        message:
          connectedChannelId
            ? `Connected YouTube analytics for ${connectedChannelId}.`
            : 'Connected YouTube analytics successfully.',
      };
    }

    if (connectError) {
      const messages: Record<string, string> = {
        missing_oauth_parameters: 'Google OAuth returned without the required parameters.',
        session_mismatch: 'The Google callback did not match the signed-in officer session.',
        channel_not_connectable: 'Import public YouTube data for that channel before connecting analytics.',
        google_account_does_not_manage_channel:
          'That Google account does not appear to manage the selected YouTube channel.',
        access_denied: 'Google access was denied before the connection completed.',
      };

      return {
        tone: 'error' as const,
        message: messages[connectError] ?? connectError,
      };
    }

    return null;
  }, [connectError, connectSuccess, connectedChannelId]);

  if (channels === undefined) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-10 w-48' />
          <Skeleton className='h-10 w-36' />
        </div>
        <Skeleton className='h-12 w-full' />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className='h-24 w-full' />
        ))}
      </div>
    );
  }

  let filtered = channels;
  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter(
      (channel) =>
        channel.name.toLowerCase().includes(query) ||
        channel.handle.toLowerCase().includes(query) ||
        channel.channelId.toLowerCase().includes(query),
    );
  }

  if (filterStatus !== 'all') {
    filtered = filtered.filter((channel) => channel.complianceStatus === filterStatus);
  }

  const selectedTaxPeriod =
    TAX_PERIOD_OPTIONS.find((option) => option.days === taxPeriodDays) ?? TAX_PERIOD_OPTIONS[0];

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name || !form.handle) return;

    setIsCreating(true);

    try {
      const monthlyRevenue = form.estimatedMonthlyRevenue
        ? Number(form.estimatedMonthlyRevenue)
        : undefined;
      const annualRevenue = form.estimatedAnnualRevenue
        ? Number(form.estimatedAnnualRevenue)
        : monthlyRevenue !== undefined
          ? monthlyRevenue * 12
          : undefined;

      await createChannel({
        name: form.name,
        handle: form.handle,
        email: form.email || undefined,
        estimatedMonthlyRevenue: monthlyRevenue,
        estimatedAnnualRevenue: annualRevenue,
        taxIdNumber: form.taxIdNumber || undefined,
        notes: form.notes || undefined,
        complianceStatus: 'pending',
      });

      setForm({
        name: '',
        handle: '',
        email: '',
        estimatedMonthlyRevenue: '',
        estimatedAnnualRevenue: '',
        taxIdNumber: '',
        notes: '',
      });
      setShowAddDialog(false);
    } catch (error) {
      console.error('Failed to create channel:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // ── Update (edit) handler ──────────────────────────────────────────────────
  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingChannel?.docId) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const annualRevenue = editForm.estimatedAnnualRevenue
        ? Number(editForm.estimatedAnnualRevenue)
        : editForm.estimatedMonthlyRevenue
          ? Number(editForm.estimatedMonthlyRevenue) * 12
          : undefined;

      await updateChannel({
        id: editingChannel.docId,
        name: editingChannel.name || undefined,
        complianceStatus: editForm.complianceStatus,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        taxIdNumber: editForm.taxIdNumber || undefined,
        notes: editForm.notes || undefined,
        estimatedAnnualRevenue: annualRevenue,
        estimatedMonthlyRevenue: editForm.estimatedMonthlyRevenue
          ? Number(editForm.estimatedMonthlyRevenue)
          : undefined,
      });

      setEditingChannel(null);
      setEditForm(EDIT_FORM_DEFAULTS);
    } catch (error) {
      console.error('Failed to update channel:', error);
      setUpdateError(error instanceof Error ? error.message : 'Update failed. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className='space-y-6'>
      {connectNotice ? (
        <div
          className={
            connectNotice.tone === 'success'
              ? 'rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success'
              : 'rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'
          }
        >
          {connectNotice.message}
        </div>
      ) : null}

      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='text-sm text-muted-foreground'>
            {channels.length} channel{channels.length !== 1 ? 's' : ''} tracked across public,
            manual, and connected sources
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className='gap-2 bg-accent text-accent-foreground hover:bg-accent/90'
        >
          <HugeiconsIcon icon={Add01Icon} size={16} />
          Add Channel
        </Button>
      </div>

      <div className='flex flex-wrap gap-3 max-sm:flex-col'>
        <InputGroup className='min-w-50 flex-1 bg-card'>
          <InputGroupAddon align='inline-start'>
            <HugeiconsIcon icon={Search01Icon} size={14} className='text-muted-foreground' />
          </InputGroupAddon>
          <InputGroupInput
            type='text'
            placeholder='Search by channel name, handle, or channel ID...'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </InputGroup>

        <Select
          value={filterStatus}
          onValueChange={(value) => {
            if (value) {
              setFilterStatus(value as (typeof COMPLIANCE_STATUSES)[number] | 'all');
            }
          }}
        >
          <SelectTrigger className='w-full bg-card sm:w-56'>
            <SelectValue placeholder='All statuses' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All statuses</SelectItem>
            {COMPLIANCE_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {titleCaseLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(taxPeriodDays)}
          onValueChange={(value) => {
            setTaxPeriodDays(Number(value));
          }}
        >
          <SelectTrigger className='w-full bg-card sm:w-44'>
            <SelectValue placeholder='Tax period' />
          </SelectTrigger>
          <SelectContent>
            {TAX_PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.days} value={String(option.days)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='overflow-hidden rounded-xl border border-border/60 bg-card'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-border/60 bg-muted/30'>
                <th className='px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                  Channel
                </th>
                <th className='px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                  Source Status
                </th>
                <th className='px-4 py-3 text-right text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                  Revenue Input
                </th>
                <th className='px-4 py-3 text-right text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                  Tax Estimate
                </th>
                <th className='px-4 py-3 text-center text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                  Compliance
                </th>
                <th className='px-4 py-3 text-right text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className='px-4 py-12 text-center text-muted-foreground'>
                    {channels.length === 0
                      ? 'No channels added yet. Import public YouTube data or create a manual channel record to get started.'
                      : 'No channels match your filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map((channel) => {
                  const periodTax = estimateTaxForPeriod(channel, taxPeriodDays);
                  return (
                  <tr
                    key={channel._id}
                    className='border-b border-border/40 align-top transition-colors hover:bg-muted/20'
                  >
                    <td className='px-4 py-4'>
                      <div className='space-y-1'>
                        <p className='font-medium'>{channel.name}</p>
                        <p className='font-mono text-xs text-muted-foreground'>
                          @{channel.handle} {channel.channelId ? `• ${channel.channelId}` : ''}
                        </p>
                        {channel.email ? (
                          <p className='text-xs text-muted-foreground'>{channel.email}</p>
                        ) : null}
                      </div>
                    </td>

                    <td className='px-4 py-4'>
                      <div className='flex flex-wrap gap-2'>
                        <SourceBadge label={formatPublicStatus(channel.publicDataStatus)} />
                        <SourceBadge label={formatAnalyticsStatus(channel.analyticsStatus)} />
                        {channel.hasManualFinancials ? (
                          <SourceBadge label='Manual inputs' variant='secondary' />
                        ) : null}
                        {channel.hasTaxEstimate ? (
                          <SourceBadge label='Tax estimate ready' variant='secondary' />
                        ) : null}
                        {channel.actionRequired ? (
                          <SourceBadge label='Action required' variant='secondary' />
                        ) : null}
                      </div>
                    </td>

                    <td className='px-4 py-4 text-right'>
                      {channel.estimatedAnnualRevenue !== undefined ? (
                        <>
                          <p className='font-mono text-xs'>
                            {formatCurrency(channel.estimatedAnnualRevenue)}
                          </p>
                          <p className='mt-1 text-xs text-muted-foreground'>
                            {formatRevenueSource(channel.revenueSource)}
                          </p>
                        </>
                      ) : channel.totalViews !== undefined ? (
                        <>
                          <p className='font-mono text-xs'>
                            {formatEstimatedRevenue(
                              estimateRevenueFromViews(
                                channel.totalViews,
                                channel.topicCategories ?? [],
                              ),
                            )}
                          </p>
                          <p className='mt-1 text-xs text-muted-foreground'>
                            Estimated Revenue
                          </p>
                          <p className='mt-0.5 max-w-[160px] text-[10px] leading-tight text-muted-foreground/70'>
                            {ESTIMATED_REVENUE_DISCLAIMER}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className='font-mono text-xs'>--</p>
                          <p className='mt-1 text-xs text-muted-foreground'>
                            {formatRevenueSource(channel.revenueSource)}
                          </p>
                        </>
                      )}
                    </td>

                    <td className='px-4 py-4 text-right'>
                      <p className='font-mono text-xs font-medium text-chart-5'>
                        {periodTax !== undefined ? formatCurrency(periodTax) : '--'}
                      </p>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {periodTax !== undefined
                          ? `Projected for ${selectedTaxPeriod.label}`
                          : 'No estimate yet'}
                      </p>
                    </td>

                    <td className='px-4 py-4 text-center'>
                      {/* Clicking the badge is a shortcut to open the edit sheet */}
                      <button
                        type='button'
                        onClick={() => channel.docId ? openEdit(channel) : undefined}
                        title={channel.docId ? 'Click to change compliance status' : 'Re-import this channel to enable editing'}
                        className={channel.docId ? 'cursor-pointer rounded-full transition-opacity hover:opacity-70' : 'cursor-not-allowed'}
                      >
                        <StatusBadge status={channel.complianceStatus ?? 'pending'} />
                      </button>
                    </td>

                    <td className='px-4 py-4 text-right'>
                      <div className='flex justify-end gap-3'>
                        {!channel.channelId.startsWith('manual:') && !channel.channelId.startsWith('legacy:') ? (
                          <Button
                            variant='outline'
                            size='sm'
                            render={
                              <Link
                                href={`/api/youtube/connect?channelId=${encodeURIComponent(channel.channelId)}&returnTo=${encodeURIComponent('/influencers')}`}
                              />
                            }
                            className='text-xs'
                          >
                            {channel.hasConnectedAnalytics ? 'Reconnect' : 'Connect YouTube'}
                          </Button>
                        ) : null}

                        {/* Edit button — only available for channels-table records */}
                        {channel.docId ? (
                          <button
                            onClick={() => openEdit(channel)}
                            className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground'
                            title='Edit channel details and compliance status'
                          >
                            <HugeiconsIcon icon={Edit01Icon} size={12} />
                            Edit
                          </button>
                        ) : (
                          <span
                            className='cursor-not-allowed text-xs text-muted-foreground/40'
                            title='Re-import this channel via Channel Lookup to enable editing'
                          >
                            Edit
                          </span>
                        )}

                        <button
                          onClick={() =>
                            deleteChannel({
                              id: String(channel.docId ?? channel.legacyId ?? channel._id),
                              table: channel.docId ? 'channels' : 'influencers',
                            })
                          }
                          className='text-xs text-destructive/65 hover:text-destructive'
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={showAddDialog} onOpenChange={setShowAddDialog}>
        <SheetContent className='w-full overflow-y-auto p-0 sm:max-w-md'>
          <div className='px-6 pt-6 pb-6'>
            <SheetHeader className='mb-6 p-0'>
              <SheetTitle className='font-heading text-xl font-bold'>Add Channel</SheetTitle>
              <SheetDescription>
                Create a manual channel record. Public imports and connected analytics can be added
                later.
              </SheetDescription>
            </SheetHeader>

            <form onSubmit={handleCreate} className='space-y-6'>
              <div className='space-y-4'>
                <div className='grid gap-2'>
                  <Label
                    htmlFor='name'
                    className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                  >
                    Channel Name *
                  </Label>
                  <Input
                    id='name'
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    required
                    placeholder='e.g. Kwame Creates'
                    className='bg-secondary/20'
                  />
                </div>

                <div className='grid gap-2'>
                  <Label
                    htmlFor='handle'
                    className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                  >
                    Handle *
                  </Label>
                  <Input
                    id='handle'
                    value={form.handle}
                    onChange={(event) => setForm({ ...form, handle: event.target.value })}
                    required
                    placeholder='@channel_name'
                    className='bg-secondary/20'
                  />
                </div>

                <div className='grid gap-2'>
                  <Label
                    htmlFor='email'
                    className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                  >
                    Contact Email
                  </Label>
                  <Input
                    id='email'
                    type='email'
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    placeholder='creator@example.com'
                    className='bg-secondary/20'
                  />
                </div>

                <div className='grid gap-2'>
                  <Label
                    htmlFor='taxId'
                    className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                  >
                    Tax ID Number
                  </Label>
                  <Input
                    id='taxId'
                    value={form.taxIdNumber}
                    onChange={(event) => setForm({ ...form, taxIdNumber: event.target.value })}
                    placeholder='GHA-XXXXX'
                    className='bg-secondary/20'
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='grid gap-2'>
                    <Label
                      htmlFor='monthlyRev'
                      className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                    >
                      Monthly Input ({currencyConfig.symbol})
                    </Label>
                    <Input
                      id='monthlyRev'
                      type='number'
                      value={form.estimatedMonthlyRevenue}
                      onChange={(event) =>
                        setForm({ ...form, estimatedMonthlyRevenue: event.target.value })
                      }
                      placeholder='0'
                      className='bg-secondary/20'
                    />
                  </div>

                  <div className='grid gap-2'>
                    <Label
                      htmlFor='annualRev'
                      className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                    >
                      Annual Input ({currencyConfig.symbol})
                    </Label>
                    <Input
                      id='annualRev'
                      type='number'
                      value={form.estimatedAnnualRevenue}
                      onChange={(event) =>
                        setForm({ ...form, estimatedAnnualRevenue: event.target.value })
                      }
                      placeholder='Auto from monthly'
                      className='bg-secondary/20'
                    />
                  </div>
                </div>

                <div className='grid gap-2'>
                  <Label
                    htmlFor='notes'
                    className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                  >
                    Notes
                  </Label>
                  <Input
                    id='notes'
                    value={form.notes}
                    onChange={(event) => setForm({ ...form, notes: event.target.value })}
                    placeholder='Context for manual financial values or review status'
                    className='bg-secondary/20'
                  />
                </div>
              </div>

              <div className='rounded-lg border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground'>
                Public lookup does not include revenue. Manual financial inputs and future connected
                analytics remain separate source types.
              </div>

              <div className='flex justify-end gap-3 border-t border-border pt-4'>
                <Button type='button' variant='outline' onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isCreating}
                  className='bg-primary text-primary-foreground hover:bg-primary/90'
                >
                  {isCreating ? 'Adding...' : 'Add Channel'}
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Edit Channel Sheet ─────────────────────────────────────────────── */}
      <Sheet
        open={Boolean(editingChannel)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingChannel(null);
            setEditForm(EDIT_FORM_DEFAULTS);
            setUpdateError(null);
          }
        }}
      >
        <SheetContent className='w-full overflow-y-auto p-0 sm:max-w-md'>
          <div className='px-6 pt-6 pb-6'>
            <SheetHeader className='mb-6 p-0'>
              <SheetTitle className='font-heading text-xl font-bold'>Edit Channel</SheetTitle>
              <SheetDescription className='text-sm'>
                {editingChannel?.name ?? 'Unknown channel'}
                {editingChannel?.handle ? (
                  <span className='ml-1 font-mono text-xs'>@{editingChannel.handle}</span>
                ) : null}
              </SheetDescription>
            </SheetHeader>

            <form onSubmit={handleUpdate} className='space-y-6'>
              {/* ── Compliance Status — most important field, shown first ── */}
              <div className='rounded-xl border border-border/60 bg-muted/20 p-4'>
                <p className='mb-3 text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                  Compliance Status
                </p>
                <div className='grid gap-2'>
                  <Select
                    value={editForm.complianceStatus}
                    onValueChange={(value) =>
                      setEditForm({
                        ...editForm,
                        complianceStatus: value as EditForm['complianceStatus'],
                      })
                    }
                  >
                    <SelectTrigger id='edit-complianceStatus' className='bg-background'>
                      <SelectValue placeholder='Select status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='pending'>
                        <span className='flex items-center gap-2'>
                          <span className='inline-block h-2 w-2 rounded-full bg-yellow-500/70' />
                          Pending
                        </span>
                      </SelectItem>
                      <SelectItem value='under-review'>
                        <span className='flex items-center gap-2'>
                          <span className='inline-block h-2 w-2 rounded-full bg-blue-500/70' />
                          Under Review
                        </span>
                      </SelectItem>
                      <SelectItem value='compliant'>
                        <span className='flex items-center gap-2'>
                          <span className='inline-block h-2 w-2 rounded-full bg-green-500/70' />
                          Compliant
                        </span>
                      </SelectItem>
                      <SelectItem value='non-compliant'>
                        <span className='flex items-center gap-2'>
                          <span className='inline-block h-2 w-2 rounded-full bg-red-500/70' />
                          Non-Compliant
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className='text-[11px] text-muted-foreground'>
                    This status is visible to all officers and appears in reports and compliance
                    breakdowns.
                  </p>
                </div>
              </div>

              {/* ── Contact Info ── */}
              <div className='space-y-4'>
                <p className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                  Contact Info
                </p>

                <div className='grid gap-2'>
                  <Label
                    htmlFor='edit-email'
                    className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                  >
                    Contact Email
                  </Label>
                  <Input
                    id='edit-email'
                    type='email'
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder='creator@example.com'
                    className='bg-secondary/20'
                  />
                </div>

                <div className='grid gap-2'>
                  <Label
                    htmlFor='edit-phone'
                    className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                  >
                    Phone Number
                  </Label>
                  <Input
                    id='edit-phone'
                    type='tel'
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder='+233 XX XXX XXXX'
                    className='bg-secondary/20'
                  />
                </div>

                <div className='grid gap-2'>
                  <Label
                    htmlFor='edit-taxId'
                    className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                  >
                    Tax ID Number
                  </Label>
                  <Input
                    id='edit-taxId'
                    value={editForm.taxIdNumber}
                    onChange={(e) => setEditForm({ ...editForm, taxIdNumber: e.target.value })}
                    placeholder='GHA-XXXXX'
                    className='bg-secondary/20'
                  />
                </div>
              </div>

              {/* ── Financial Override ── */}
              <div className='space-y-4'>
                <p className='text-xs font-bold tracking-wider text-muted-foreground uppercase'>
                  Revenue Override ({currencyConfig.symbol})
                </p>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='grid gap-2'>
                    <Label
                      htmlFor='edit-monthlyRev'
                      className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                    >
                      Monthly
                    </Label>
                    <Input
                      id='edit-monthlyRev'
                      type='number'
                      min='0'
                      value={editForm.estimatedMonthlyRevenue}
                      onChange={(e) =>
                        setEditForm({ ...editForm, estimatedMonthlyRevenue: e.target.value })
                      }
                      placeholder='0'
                      className='bg-secondary/20'
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label
                      htmlFor='edit-annualRev'
                      className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                    >
                      Annual
                    </Label>
                    <Input
                      id='edit-annualRev'
                      type='number'
                      min='0'
                      value={editForm.estimatedAnnualRevenue}
                      onChange={(e) =>
                        setEditForm({ ...editForm, estimatedAnnualRevenue: e.target.value })
                      }
                      placeholder='Auto from monthly'
                      className='bg-secondary/20'
                    />
                  </div>
                </div>
                <p className='text-[11px] text-muted-foreground'>
                  Leave blank to keep existing revenue source. Connected analytics data is not
                  affected.
                </p>
              </div>

              {/* ── Notes ── */}
              <div className='grid gap-2'>
                <Label
                  htmlFor='edit-notes'
                  className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                >
                  Officer Notes
                </Label>
                <Input
                  id='edit-notes'
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder='Reason for status change, review findings, etc.'
                  className='bg-secondary/20'
                />
              </div>

              {/* ── Error state ── */}
              {updateError ? (
                <div className='rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive'>
                  {updateError}
                </div>
              ) : null}

              {/* ── Actions ── */}
              <div className='flex justify-end gap-3 border-t border-border pt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setEditingChannel(null);
                    setEditForm(EDIT_FORM_DEFAULTS);
                    setUpdateError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isUpdating}
                  className='bg-primary text-primary-foreground hover:bg-primary/90'
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
