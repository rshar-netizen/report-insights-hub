import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KeyMetric } from '@/data/dataSources';

interface MetricCardProps {
  metric: KeyMetric;
}

export function MetricCard({ metric }: MetricCardProps) {
  const isPositive = metric.change > 0;
  const isNegative = metric.change < 0;
  const isNeutral = metric.change === 0;

  return (
    <div className="glass-card rounded-lg p-5 transition-all duration-300 hover:glow-border group">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium">
          {metric.label}
        </span>
        <span className="source-tag px-2 py-0.5 rounded text-muted-foreground">
          {metric.source}
        </span>
      </div>
      
      <div className="metric-value text-3xl text-foreground mb-2">
        {metric.value}
      </div>
      
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 text-sm ${
          isPositive ? 'text-success' : isNegative ? 'text-destructive' : 'text-muted-foreground'
        }`}>
          {isPositive && <TrendingUp className="w-4 h-4" />}
          {isNegative && <TrendingDown className="w-4 h-4" />}
          {isNeutral && <Minus className="w-4 h-4" />}
          <span className="font-mono">
            {isPositive && '+'}
            {metric.change !== 0 ? `${metric.change}%` : '0%'}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {metric.changeLabel}
        </span>
      </div>
      
      <div className="mt-3 pt-3 border-t border-border/50">
        <span className="text-xs text-muted-foreground">
          Source: {metric.reportType}
        </span>
      </div>
    </div>
  );
}
