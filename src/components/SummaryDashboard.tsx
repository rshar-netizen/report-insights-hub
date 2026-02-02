import { dataSources, keyMetrics } from '@/data/dataSources';
import { MetricCard } from './MetricCard';
import { SourceCard } from './SourceCard';
import { Activity, Database, FileText, TrendingUp } from 'lucide-react';

export function SummaryDashboard() {
  const totalRecords = dataSources.reduce((acc, src) => acc + src.recordCount, 0);
  const activeSources = dataSources.filter((src) => src.status === 'active').length;
  const reportTypes = [...new Set(dataSources.flatMap((src) => src.reportTypes))];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-lg p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Data Sources</span>
            <p className="metric-value text-2xl text-foreground">{dataSources.length}</p>
          </div>
        </div>

        <div className="glass-card rounded-lg p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-success" />
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Active Sources</span>
            <p className="metric-value text-2xl text-foreground">{activeSources}</p>
          </div>
        </div>

        <div className="glass-card rounded-lg p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Total Records</span>
            <p className="metric-value text-2xl text-foreground">
              {totalRecords.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="glass-card rounded-lg p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-warning" />
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Report Types</span>
            <p className="metric-value text-2xl text-foreground">{reportTypes.length}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics for CFO */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-xl font-semibold text-foreground">Key Metrics</h2>
          <span className="source-tag px-2 py-0.5 rounded text-muted-foreground">
            CFO Dashboard
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {keyMetrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </div>

      {/* Data Sources */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-xl font-semibold text-foreground">Ingested Data Sources</h2>
          <span className="text-sm text-muted-foreground">
            Federal regulatory data feeds
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataSources.map((source) => (
            <SourceCard key={source.id} source={source} />
          ))}
        </div>
      </div>
    </div>
  );
}
