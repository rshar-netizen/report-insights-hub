import { CheckCircle2, Clock, AlertCircle, ExternalLink, Database } from 'lucide-react';
import { DataSource } from '@/data/dataSources';
import { formatDistanceToNow } from 'date-fns';

interface SourceCardProps {
  source: DataSource;
}

export function SourceCard({ source }: SourceCardProps) {
  const StatusIcon = {
    active: CheckCircle2,
    pending: Clock,
    error: AlertCircle,
  }[source.status];

  const statusColor = {
    active: 'text-success',
    pending: 'text-warning',
    error: 'text-destructive',
  }[source.status];

  const statusBg = {
    active: 'bg-success/10',
    pending: 'bg-warning/10',
    error: 'bg-destructive/10',
  }[source.status];

  return (
    <div className="glass-card rounded-lg p-5 transition-all duration-300 hover:glow-border group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {source.shortName}
            </h3>
            <p className="text-xs text-muted-foreground">
              {source.name}
            </p>
          </div>
        </div>
        
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusBg}`}>
          <StatusIcon className={`w-3.5 h-3.5 ${statusColor}`} />
          <span className={`text-xs font-medium capitalize ${statusColor}`}>
            {source.status}
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {source.description}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-secondary/50 rounded-md p-2.5">
          <span className="text-xs text-muted-foreground block mb-1">Records</span>
          <span className="metric-value text-lg text-foreground">
            {source.recordCount.toLocaleString()}
          </span>
        </div>
        <div className="bg-secondary/50 rounded-md p-2.5">
          <span className="text-xs text-muted-foreground block mb-1">Last Sync</span>
          <span className="text-sm text-foreground">
            {formatDistanceToNow(new Date(source.lastIngested), { addSuffix: true })}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {source.reportTypes.slice(0, 3).map((type) => (
          <span
            key={type}
            className="source-tag px-2 py-0.5 rounded text-muted-foreground"
          >
            {type}
          </span>
        ))}
        {source.reportTypes.length > 3 && (
          <span className="source-tag px-2 py-0.5 rounded text-muted-foreground">
            +{source.reportTypes.length - 3} more
          </span>
        )}
      </div>

      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-sm text-primary hover:underline transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        View Source
      </a>
    </div>
  );
}
