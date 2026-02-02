import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { MarketMetric } from '@/data/dataSources';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MarketMetricCardProps {
  metric: MarketMetric;
}

export function MarketMetricCard({ metric }: MarketMetricCardProps) {
  const isPositive = metric.change > 0;
  const isNegative = metric.change < 0;
  const isNeutral = metric.change === 0;

  return (
    <div className="glass-card rounded-lg p-5 transition-all duration-300 hover:glow-border group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium">
            {metric.label}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">{metric.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className="source-tag px-2 py-0.5 rounded text-muted-foreground text-xs">
          {metric.source}
        </span>
      </div>
      
      <div className="metric-value text-3xl text-foreground mb-2">
        {metric.value}
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <div className={`flex items-center gap-1 text-sm ${
          isPositive ? 'text-success' : isNegative ? 'text-destructive' : 'text-muted-foreground'
        }`}>
          {isPositive && <TrendingUp className="w-4 h-4" />}
          {isNegative && <TrendingDown className="w-4 h-4" />}
          {isNeutral && <Minus className="w-4 h-4" />}
          <span className="font-mono">
            {isPositive && '+'}
            {metric.change !== 0 ? `${metric.change}%` : 'unchanged'}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {metric.changeLabel}
        </span>
      </div>

      <div className="bg-secondary/30 rounded-md p-3 mt-2">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="text-primary font-medium">Impact:</span> {metric.impact}
        </p>
      </div>
      
      <div className="mt-3 pt-3 border-t border-border/50">
        <span className="text-xs text-muted-foreground">
          Series: {metric.reportType}
        </span>
      </div>
    </div>
  );
}
