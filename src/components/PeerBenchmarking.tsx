import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Building2,
  BarChart3
} from 'lucide-react';
import { peerComparisonMetrics, peerBanks, mizuho } from '@/data/dataSources';

export function PeerBenchmarking() {
  const getPercentileColor = (percentile: number) => {
    if (percentile >= 70) return 'text-success';
    if (percentile >= 40) return 'text-primary';
    if (percentile >= 25) return 'text-warning';
    return 'text-destructive';
  };

  const getPercentileBarColor = (percentile: number) => {
    if (percentile >= 70) return 'bg-success';
    if (percentile >= 40) return 'bg-primary';
    if (percentile >= 25) return 'bg-warning';
    return 'bg-destructive';
  };

  const categories = [
    { key: 'capital', label: 'Capital Adequacy', icon: Building2 },
    { key: 'profitability', label: 'Profitability', icon: TrendingUp },
    { key: 'efficiency', label: 'Operational Efficiency', icon: BarChart3 },
    { key: 'risk', label: 'Credit Quality', icon: TrendingDown },
    { key: 'liquidity', label: 'Liquidity', icon: Building2 }
  ];

  const getMetricsByCategory = (category: string) => {
    return peerComparisonMetrics.filter(m => m.category === category);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Peer Intelligence Benchmarking</h2>
        <p className="text-muted-foreground">
          Comparative analysis of Mizuho Americas vs G-SIB peer group
        </p>
      </div>

      {/* Peer Banks Legend */}
      <div className="glass-card rounded-lg p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Peer Group</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-sm font-medium text-primary">{mizuho.shortName}</span>
            <span className="text-xs text-muted-foreground">{mizuho.totalAssets}</span>
          </div>
          {peerBanks.map((bank) => (
            <div key={bank.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="text-sm text-muted-foreground">{bank.shortName}</span>
              <span className="text-xs text-muted-foreground/70">{bank.totalAssets}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison by Category */}
      {categories.map((category) => {
        const metrics = getMetricsByCategory(category.key);
        if (metrics.length === 0) return null;

        const CategoryIcon = category.icon;

        return (
          <div key={category.key}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <CategoryIcon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{category.label}</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {metrics.map((metric) => (
                <div 
                  key={metric.id}
                  className="glass-card rounded-lg p-5 hover:glow-border transition-all duration-300"
                >
                  {/* Metric Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-foreground">{metric.label}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="source-tag px-2 py-0.5 rounded text-xs">{metric.source}</span>
                        <span className="text-xs text-muted-foreground">{metric.reportType}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="metric-value text-2xl text-primary">{metric.mizuhoValue}</span>
                      <p className="text-xs text-muted-foreground">Mizuho</p>
                    </div>
                  </div>

                  {/* Peer Comparison Table */}
                  <div className="mb-4">
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      {metric.peerValues.map((peer) => (
                        <div key={peer.bankName} className="text-center">
                          <p className="text-muted-foreground truncate">{peer.bankName.split(' ')[0]}</p>
                          <p className="font-semibold text-foreground">{peer.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Percentile Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Peer Percentile</span>
                      <span className={`text-sm font-semibold ${getPercentileColor(metric.peerPercentile)}`}>
                        {metric.peerPercentile}th
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getPercentileBarColor(metric.peerPercentile)} transition-all duration-500`}
                        style={{ width: `${metric.peerPercentile}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0th</span>
                      <span>Median</span>
                      <span>100th</span>
                    </div>
                  </div>

                  {/* Interpretation */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {metric.interpretation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Summary Scorecard */}
      <div className="glass-card rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Performance Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-success/10 border border-success/20">
            <p className="text-3xl font-bold text-success">3</p>
            <p className="text-sm text-muted-foreground">Above Median</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-3xl font-bold text-primary">1</p>
            <p className="text-sm text-muted-foreground">At Median</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-3xl font-bold text-warning">3</p>
            <p className="text-sm text-muted-foreground">Below Median</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-secondary border border-border">
            <p className="text-3xl font-bold text-foreground">1</p>
            <p className="text-sm text-muted-foreground">Top Quartile</p>
          </div>
        </div>
      </div>
    </div>
  );
}
