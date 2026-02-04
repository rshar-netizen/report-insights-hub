import { ArrowUp, ArrowDown, CheckCircle2, AlertTriangle, XCircle, ExternalLink, Wifi } from 'lucide-react';
import { BankMetric } from '@/data/dataSources';
import { Badge } from '@/components/ui/badge';

interface BankMetricCardProps {
  metric: BankMetric;
  isRealTime?: boolean;
}

export function BankMetricCard({ metric, isRealTime = false }: BankMetricCardProps) {
  const getStatusIcon = () => {
    if (!metric.threshold) return null;
    
    switch (metric.threshold.status) {
      case 'good':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'critical':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBorder = () => {
    if (!metric.threshold) return '';
    
    switch (metric.threshold.status) {
      case 'good':
        return 'border-l-4 border-l-success';
      case 'warning':
        return 'border-l-4 border-l-warning';
      case 'critical':
        return 'border-l-4 border-l-destructive';
      default:
        return '';
    }
  };

  return (
    <div className={`glass-card rounded-lg p-5 transition-all duration-300 hover:glow-border ${getStatusBorder()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium">
            {metric.label}
          </span>
          {getStatusIcon()}
        </div>
        {isRealTime && (
          <Badge variant="success" className="flex items-center gap-1 text-[10px] px-1.5 py-0.5">
            <Wifi className="w-2.5 h-2.5" />
            Live
          </Badge>
        )}
      </div>

      <div className="mb-3">
        <span className="metric-value text-3xl text-foreground">{metric.value}</span>
        <div className="flex items-center gap-1 mt-1">
          {metric.change > 0 ? (
            <ArrowUp className="w-3 h-3 text-success" />
          ) : metric.change < 0 ? (
            <ArrowDown className="w-3 h-3 text-destructive" />
          ) : null}
          <span className={`text-xs ${metric.change > 0 ? 'text-success' : metric.change < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {metric.change > 0 ? '+' : ''}{metric.change}% {metric.changeLabel}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        {metric.description}
      </p>
      
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          <span className="source-tag px-2 py-0.5 rounded text-muted-foreground text-xs">
            {metric.source}
          </span>
          <span className="text-xs text-muted-foreground">
            {metric.reportType}
          </span>
        </div>
        <a 
          href={metric.sourceUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}