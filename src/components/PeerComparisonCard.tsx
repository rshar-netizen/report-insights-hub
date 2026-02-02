import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { PeerComparisonMetric } from '@/data/dataSources';

interface PeerComparisonCardProps {
  metric: PeerComparisonMetric;
}

export function PeerComparisonCard({ metric }: PeerComparisonCardProps) {
  const getPercentileColor = () => {
    if (metric.peerPercentile >= 75) return 'text-success';
    if (metric.peerPercentile >= 50) return 'text-primary';
    if (metric.peerPercentile >= 25) return 'text-warning';
    return 'text-destructive';
  };

  const getPercentileBarColor = () => {
    if (metric.peerPercentile >= 75) return 'bg-success';
    if (metric.peerPercentile >= 50) return 'bg-primary';
    if (metric.peerPercentile >= 25) return 'bg-warning';
    return 'bg-destructive';
  };

  const bankValueNum = parseFloat(metric.bankValue);
  const peerMedianNum = parseFloat(metric.peerMedian);
  const isAbovePeer = bankValueNum > peerMedianNum;
  const isBelowPeer = bankValueNum < peerMedianNum;

  return (
    <div className="glass-card rounded-lg p-5 transition-all duration-300 hover:glow-border">
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm text-muted-foreground font-medium">
          {metric.label}
        </span>
        <span className="source-tag px-2 py-0.5 rounded text-muted-foreground text-xs">
          {metric.source}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Your Bank</span>
          <span className="metric-value text-2xl text-foreground">{metric.bankValue}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Peer Median</span>
          <span className="metric-value text-2xl text-muted-foreground">{metric.peerMedian}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Peer Percentile</span>
          <span className={`text-sm font-semibold ${getPercentileColor()}`}>
            {metric.peerPercentile}th
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className={`h-full ${getPercentileBarColor()} transition-all duration-500`}
            style={{ width: `${metric.peerPercentile}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        {isAbovePeer && (
          <div className="flex items-center gap-1 text-sm text-success">
            <ArrowUp className="w-4 h-4" />
            <span>Above peer median</span>
          </div>
        )}
        {isBelowPeer && (
          <div className="flex items-center gap-1 text-sm text-warning">
            <ArrowDown className="w-4 h-4" />
            <span>Below peer median</span>
          </div>
        )}
        {!isAbovePeer && !isBelowPeer && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Minus className="w-4 h-4" />
            <span>At peer median</span>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {metric.interpretation}
      </p>
      
      <div className="mt-3 pt-3 border-t border-border/50">
        <span className="text-xs text-muted-foreground">
          Source: {metric.reportType}
        </span>
      </div>
    </div>
  );
}
