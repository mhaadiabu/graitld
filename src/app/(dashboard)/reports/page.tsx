'use client';

import { Download01Icon, File01Icon, PrinterIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useQuery } from 'convex/react';
import { useState } from 'react';
import { api } from '~convex/_generated/api';

import { ReportDocument } from '@/components/reports/report-document';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { currencyConfig, formatCurrency } from '@/lib/product';

type ReportType = 'tax-summary' | 'compliance-overview' | 'channel-registry' | 'source-readiness';

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  {
    value: 'tax-summary',
    label: 'Tax Summary Report',
    description: 'Overview of current source-backed revenue inputs and estimated tax output',
  },
  {
    value: 'compliance-overview',
    label: 'Compliance Overview',
    description: 'Breakdown of compliance status across tracked YouTube channels',
  },
  {
    value: 'channel-registry',
    label: 'Channel Registry',
    description: 'Channel list with public, analytics, and manual source visibility',
  },
  {
    value: 'source-readiness',
    label: 'Source Readiness',
    description: 'Operational view of public imports, connected analytics, and action-required states',
  },
];

export default function ReportsPage() {
  const metrics = useQuery(api.analytics.getDashboardMetrics);
  const channels = useQuery(api.influencers.getInfluencers, {});
  const compliance = useQuery(api.analytics.getComplianceBreakdown);

  const [activeReport, setActiveReport] = useState<{
    type: ReportType;
    data: any;
  } | null>(null);

  if (metrics === undefined || channels === undefined || compliance === undefined) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-5 w-80' />
        <div className='grid gap-4 sm:grid-cols-2'>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className='h-36 rounded-xl' />
          ))}
        </div>
        <Skeleton className='h-40 rounded-xl' />
      </div>
    );
  }

  const exportToCSV = (type: ReportType) => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (type === 'channel-registry') {
      headers = ['Name', 'Handle', 'Revenue Source', 'Compliance Status', 'Estimated Tax'];
      rows = channels.map((c) => [
        c.name,
        `@${c.handle}`,
        c.revenueSource,
        c.complianceStatus || 'Pending',
        c.estimatedTax?.toString() || '0',
      ]);
    } else if (type === 'tax-summary') {
      headers = ['Metric', 'Value'];
      rows = [
        ['Total Channels', metrics.totalChannels.toString()],
        ['Compliance Rate', `${metrics.complianceRate}%`],
        ['Total Estimated Revenue', metrics.totalEstimatedRevenue.toString()],
        ['Total Tax Liability', metrics.totalTaxLiability.toString()],
      ];
    } else if (type === 'compliance-overview') {
      headers = ['Status', 'Count'];
      rows = compliance.map((c) => [c.status, c.count.toString()]);
    } else {
      headers = ['Name', 'Handle', 'Status', 'Action Required'];
      rows = channels.map((c) => [c.name, `@${c.handle}`, c.analyticsStatus, c.actionRequired ? 'YES' : 'NO']);
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gra-${type}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openPreview = (type: ReportType) => {
    setActiveReport({
      type,
      data: { metrics, channels, compliance },
    });
  };

  return (
    <div className='stagger-children space-y-6'>
      <p className='text-sm text-muted-foreground'>
        Generate professional GRA-branded reports or export raw data for Microsoft Excel and Access.
      </p>

      <div className='grid gap-4 sm:grid-cols-2'>
        {REPORT_TYPES.map((report) => (
          <Card
            key={report.value}
            className='group transition-all hover:border-accent/30 hover:shadow-md'
          >
            <CardContent className='flex items-start gap-4'>
              <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-accent/10 group-hover:text-accent'>
                <HugeiconsIcon icon={File01Icon} size={20} />
              </div>
              <div className='flex-1'>
                <h3 className='font-heading text-sm font-semibold'>{report.label}</h3>
                <p className='mt-1 text-xs text-muted-foreground'>{report.description}</p>
                <div className='mt-4 flex flex-wrap gap-2'>
                  <Button
                    onClick={() => openPreview(report.value)}
                    variant='outline'
                    className='gap-2 text-xs'
                    size='sm'
                  >
                    <HugeiconsIcon icon={PrinterIcon} size={14} />
                    Print Preview
                  </Button>
                  <Button
                    onClick={() => exportToCSV(report.value)}
                    variant='ghost'
                    className='gap-2 text-xs text-muted-foreground hover:text-foreground'
                    size='sm'
                  >
                    <HugeiconsIcon icon={Download01Icon} size={14} />
                    Download CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='font-heading text-sm font-semibold tracking-wider text-muted-foreground uppercase'>
            Reporting Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground leading-relaxed'>
            All generated reports are official documents of the Ghana Revenue Authority. 
            <strong> Print Preview</strong> mode uses high-fidelity formatting optimized for A4 paper.
            Use <strong> Download CSV</strong> for data migration into Microsoft Access databases or 
            advanced analysis in Microsoft Excel.
          </p>
        </CardContent>
      </Card>

      {activeReport && (
        <ReportDocument
          type={activeReport.type}
          data={activeReport.data}
          onClose={() => setActiveReport(null)}
        />
      )}
    </div>
  );
}
