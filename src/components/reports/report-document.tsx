'use client';

import { currencyConfig, formatCurrency } from '@/lib/product';
import '../../app/reports.css';

interface ReportDocumentProps {
  type: 'tax-summary' | 'compliance-overview' | 'channel-registry' | 'source-readiness';
  data: any;
  onClose: () => void;
}

export function ReportDocument({ type, data, onClose }: ReportDocumentProps) {
  const now = new Date().toLocaleDateString(currencyConfig.locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getReportTitle = () => {
    switch (type) {
      case 'tax-summary': return 'Tax Summary Report';
      case 'compliance-overview': return 'Compliance Overview';
      case 'channel-registry': return 'Channel Registry';
      case 'source-readiness': return 'Source Readiness Report';
      default: return 'Report';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-preview-container fixed inset-0 z-[100] overflow-y-auto bg-black/50 backdrop-blur-sm no-print">
      <div className="flex flex-col items-center py-10">
        <div className="mb-6 flex gap-4 no-print">
          <button
            onClick={handlePrint}
            className="rounded-lg bg-[#003366] px-6 py-2 font-semibold text-white shadow-lg transition-transform hover:scale-105"
          >
            Print Report
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-white px-6 py-2 font-semibold text-[#003366] shadow-lg transition-transform hover:scale-105"
          >
            Close Preview
          </button>
        </div>

        <div className="report-paper">
          <header className="report-header">
            <div className="report-title-section">
              <h1>Ghana Revenue Authority</h1>
              <h2>Official Tax Compliance Document</h2>
            </div>
            <div className="text-right">
              <div className="gra-logo-placeholder ml-auto mb-2">GRA</div>
              <p className="text-xs font-bold text-[#003366] uppercase">{getReportTitle()}</p>
            </div>
          </header>

          <div className="report-info-grid">
            <div className="info-box">
              <h3>Generation Date</h3>
              <p>{now}</p>
            </div>
            <div className="info-box text-right">
              <h3>Report Status</h3>
              <p className="text-green-600">OFFICIAL</p>
            </div>
          </div>

          {type === 'tax-summary' && (
            <div className="space-y-8">
              <div className="report-info-grid">
                <div className="info-box">
                  <h3>Total Tracked Channels</h3>
                  <p>{data.metrics.totalChannels}</p>
                </div>
                <div className="info-box">
                  <h3>Overall Compliance Rate</h3>
                  <p>{data.metrics.complianceRate}%</p>
                </div>
                <div className="info-box">
                  <h3>Total Estimated Revenue</h3>
                  <p>{formatCurrency(data.metrics.totalEstimatedRevenue)}</p>
                </div>
                <div className="info-box">
                  <h3>Total Tax Liability</h3>
                  <p className="text-[#003366]">{formatCurrency(data.metrics.totalTaxLiability)}</p>
                </div>
              </div>
              
              <div className="info-box">
                <h3>Source Breakdown</h3>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between border-b pb-1">
                    <span>Connected Analytics:</span>
                    <span className="font-bold">{data.metrics.connectedAnalyticsChannels}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span>Public Imports:</span>
                    <span className="font-bold">{data.metrics.publicOnlyChannels}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span>Manual Inputs:</span>
                    <span className="font-bold">{data.metrics.manualInputChannels}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span>Action Required:</span>
                    <span className="font-bold text-red-600">{data.metrics.actionRequiredChannels}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {type === 'channel-registry' && (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Channel Name</th>
                  <th>Handle</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th className="text-right">Tax Estimate</th>
                </tr>
              </thead>
              <tbody>
                {data.channels.map((channel: any) => (
                  <tr key={channel._id}>
                    <td className="font-semibold">{channel.name}</td>
                    <td>@{channel.handle}</td>
                    <td>{channel.revenueSource}</td>
                    <td>
                      <span className={`status-pill ${channel.complianceStatus === 'compliant' ? 'compliant' : channel.complianceStatus === 'at_risk' ? 'at-risk' : 'pending'}`}>
                        {channel.complianceStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="text-right font-mono">
                      {channel.estimatedTax !== undefined ? formatCurrency(channel.estimatedTax) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {type === 'compliance-overview' && (
            <div className="space-y-6">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Compliance Status</th>
                    <th className="text-right">Channel Count</th>
                    <th className="text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {data.compliance.map((entry: any) => (
                    <tr key={entry.status}>
                      <td className="font-bold uppercase">{entry.status}</td>
                      <td className="text-right">{entry.count}</td>
                      <td className="text-right">
                        {((entry.count / data.metrics.totalChannels) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {type === 'source-readiness' && (
             <div className="space-y-6">
                <div className="info-box">
                  <h3>Operational Summary</h3>
                  <div className="mt-4 space-y-2 text-sm">
                    <p>• Public imports active: <strong>{data.channels.filter((c: any) => c.publicDataStatus === 'public_imported').length}</strong></p>
                    <p>• Manual-only records: <strong>{data.channels.filter((c: any) => c.publicDataStatus === 'manual_only').length}</strong></p>
                    <p>• Connected analytics active: <strong>{data.channels.filter((c: any) => c.analyticsStatus === 'active').length}</strong></p>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[#003366] uppercase mt-8 mb-4">Channels Requiring Attention</h3>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Channel</th>
                      <th>Issue</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.channels.filter((c: any) => c.actionRequired).map((channel: any) => (
                      <tr key={channel._id}>
                        <td className="font-semibold">{channel.name}</td>
                        <td className="text-red-600">Review Required</td>
                        <td>{channel.analyticsStatus}</td>
                      </tr>
                    ))}
                    {data.channels.filter((c: any) => c.actionRequired).length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center text-gray-500 py-8">No channels require immediate attention.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
          )}

          <footer className="report-footer">
            <div>
              Generated by GRA YouTube Tax Dashboard • System ID: {Math.random().toString(36).substring(7).toUpperCase()}
            </div>
            <div>
              Page 1 of 1
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
