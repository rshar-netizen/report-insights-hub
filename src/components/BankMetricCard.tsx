import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { BankMetric } from '@/data/dataSources';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BankMetricCardProps {
  metric: BankMetric;
}

export function BankMetricCard({ metric }: BankMetricCardProps) {
  const isPositive = metric.change > 0;
  const isNegative = metric.change < 0;
  const isNeutral = metric.change === 0;

  const getStatusIcon = () => {
    if (!metric.threshold) return null;
    
    switch (metric.threshold.status) {
      case 'good':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    if (!metric.threshold) return 'border-border';
    
    switch (metric.threshold.status) {
      case 'good':
        return 'border-success/30';
      case 'warning':
        return 'border-warning/30';
      case 'critical':
        return 'border-destructive/30';
      default:
        return 'border-border';
    }
  };

  return (
    <div className={`glass-card rounded-lg p-5 transition-all duration-300 hover:glow-border group border-l-4 ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium">
            {metric.label}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {getStatusIcon()}
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
            {metric.change !== 0 ? `${metric.change}%` : '0%'}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {metric.changeLabel}
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {metric.description}
      </p>
      
      <div className="mt-3 pt-3 border-t border-border/50">
        <span className="text-xs text-muted-foreground">
          Report: {metric.reportType}
        </span>
      </div>
    </div>
  );
}
