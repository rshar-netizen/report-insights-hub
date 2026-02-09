import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Building2,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { allAvailablePeers } from '@/data/dataSources';
import { PeerSelector } from './PeerSelector';
import { Badge } from '@/components/ui/badge';
import { useRealBankMetrics } from '@/hooks/useIngestedReportData';

interface PeerComparisonMetric {
  id: string;
  label: string;
  mizuhoValue: string;
  mizuhoNumeric: number;
  peerValues: { bankName: string; value: string; numeric: number }[];
  peerMedian: string;
  peerPercentile: number;
  source: string;
  reportType: string;
  interpretation: string;
  category: 'capital' | 'profitability' | 'efficiency' | 'risk' | 'liquidity';
}

// Public reference data for peer banks (from regulatory filings)
const peerReferenceData: Record<string, Record<string, number>> = {
  jpmorgan:       { tier1: 15.1, cet1: 13.8, roa: 1.21, roe: 15.2, nim: 2.81, efficiency: 54.2, npl: 0.68, lcr: 112 },
  bofa:           { tier1: 13.8, cet1: 12.1, roa: 0.98, roe: 11.4, nim: 2.54, efficiency: 62.1, npl: 0.91, lcr: 118 },
  citi:           { tier1: 14.5, cet1: 13.0, roa: 0.72, roe: 7.8,  nim: 2.48, efficiency: 69.8, npl: 1.12, lcr: 116 },
  wells:          { tier1: 12.4, cet1: 11.2, roa: 1.05, roe: 12.1, nim: 3.02, efficiency: 67.3, npl: 0.79, lcr: 125 },
  goldman:        { tier1: 16.2, cet1: 14.8, roa: 0.88, roe: 10.5, nim: 1.92, efficiency: 66.1, npl: 0.42, lcr: 138 },
  morgan_stanley: { tier1: 15.8, cet1: 14.2, roa: 0.95, roe: 11.2, nim: 1.85, efficiency: 71.2, npl: 0.38, lcr: 145 },
  usbank:         { tier1: 11.2, cet1: 9.8,  roa: 1.12, roe: 13.8, nim: 2.92, efficiency: 59.2, npl: 0.82, lcr: 108 },
  pnc:            { tier1: 11.8, cet1: 10.2, roa: 1.08, roe: 12.9, nim: 2.78, efficiency: 60.5, npl: 0.76, lcr: 112 },
  truist:         { tier1: 10.9, cet1: 9.5,  roa: 0.92, roe: 10.8, nim: 2.98, efficiency: 62.8, npl: 0.88, lcr: 109 },
  td:             { tier1: 12.8, cet1: 11.5, roa: 0.85, roe: 9.8,  nim: 2.62, efficiency: 64.2, npl: 0.65, lcr: 122 },
  hsbc:           { tier1: 14.2, cet1: 12.8, roa: 0.78, roe: 8.5,  nim: 2.18, efficiency: 68.5, npl: 0.95, lcr: 132 },
  mufg:           { tier1: 13.5, cet1: 12.2, roa: 0.82, roe: 9.2,  nim: 2.35, efficiency: 65.8, npl: 0.58, lcr: 128 },
};

// Metric definitions for mapping real data to peer comparison keys
const metricDefinitions: {
  key: string;
  label: string;
  category: 'capital' | 'profitability' | 'efficiency' | 'risk' | 'liquidity';
  metricIds: string[]; // matching IDs from useRealBankMetrics
}[] = [
  { key: 'tier1', label: 'Tier 1 Capital Ratio', category: 'capital', metricIds: ['tier1-capital'] },
  { key: 'cet1', label: 'CET1 Ratio', category: 'capital', metricIds: ['cet1'] },
  { key: 'roa', label: 'Return on Assets', category: 'profitability', metricIds: ['roa'] },
  { key: 'roe', label: 'Return on Equity', category: 'profitability', metricIds: ['roe'] },
  { key: 'nim', label: 'Net Interest Margin', category: 'profitability', metricIds: ['nim'] },
  { key: 'efficiency', label: 'Efficiency Ratio', category: 'efficiency', metricIds: ['efficiency'] },
  { key: 'npl', label: 'NPL Ratio', category: 'risk', metricIds: ['npl'] },
  { key: 'lcr', label: 'Liquidity Coverage Ratio', category: 'liquidity', metricIds: ['lcr'] },
];

export function PeerBenchmarking() {
  const [selectedPeerIds, setSelectedPeerIds] = useState<string[]>(
    allAvailablePeers.slice(0, 4).map(p => p.id)
  );

  const { metrics: realMetrics, isLoading, hasData, reportingPeriod, institutionName } = useRealBankMetrics();

  // Build peer comparison metrics using only real Mizuho data
  const peerComparisonMetrics = useMemo<PeerComparisonMetric[]>(() => {
    if (!hasData) return [];

    const results: PeerComparisonMetric[] = [];

    metricDefinitions.forEach(def => {
      // Find the real Mizuho metric
      const realMetric = realMetrics.find(m => def.metricIds.includes(m.id));
      if (!realMetric) return; // Skip metrics we don't have real data for

      const mizuhoNumeric = parseFloat(realMetric.value.replace(/[^0-9.-]/g, ''));
      if (isNaN(mizuhoNumeric)) return;

      // Get peer values
      const peerValues = selectedPeerIds.map(peerId => {
        const bank = allAvailablePeers.find(b => b.id === peerId);
        const peerVal = peerReferenceData[peerId]?.[def.key];
        return {
          bankName: bank?.shortName || peerId,
          value: peerVal !== undefined ? `${peerVal}%` : 'N/A',
          numeric: peerVal ?? NaN,
        };
      }).filter(p => !isNaN(p.numeric));

      // Calculate percentile
      const numericValues = peerValues.map(p => p.numeric);
      const sortedValues = [...numericValues].sort((a, b) => a - b);
      const median = sortedValues.length > 0
        ? sortedValues[Math.floor(sortedValues.length / 2)]
        : 0;

      // For efficiency and NPL, lower is better — invert percentile
      const isLowerBetter = def.key === 'efficiency' || def.key === 'npl';
      const percentile = numericValues.length > 0
        ? Math.round(
            (numericValues.filter(v => isLowerBetter ? v > mizuhoNumeric : v < mizuhoNumeric).length / numericValues.length) * 100
          )
        : 50;

      results.push({
        id: `${def.key}-peer`,
        label: def.label,
        mizuhoValue: realMetric.value,
        mizuhoNumeric,
        peerValues,
        peerMedian: `${median.toFixed(2)}%`,
        peerPercentile: percentile,
        source: realMetric.source,
        reportType: realMetric.reportType,
        interpretation: percentile >= 50
          ? 'Above median among selected peers'
          : 'Below median among selected peers',
        category: def.category,
      });
    });

    return results;
  }, [realMetrics, selectedPeerIds, hasData]);

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

  const summaryStats = useMemo(() => {
    const aboveMedian = peerComparisonMetrics.filter(m => m.peerPercentile >= 50).length;
    const belowMedian = peerComparisonMetrics.filter(m => m.peerPercentile < 50).length;
    const topQuartile = peerComparisonMetrics.filter(m => m.peerPercentile >= 75).length;
    const atMedian = peerComparisonMetrics.filter(m => m.peerPercentile >= 45 && m.peerPercentile <= 55).length;
    return { aboveMedian, belowMedian, topQuartile, atMedian };
  }, [peerComparisonMetrics]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Peer Intelligence Benchmarking</h2>
          <p className="text-muted-foreground">
            {hasData
              ? `Comparing ${institutionName || 'Mizuho'} real metrics against peer reference data`
              : 'Upload reports in Data Ingestion to enable peer comparison with real metrics'}
          </p>
        </div>
        {hasData && (
          <Badge variant="outline" className="text-xs">
            {reportingPeriod || 'Latest'}
          </Badge>
        )}
      </div>

      {/* Mizuho Badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 w-fit">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <span className="text-sm font-medium text-primary">{institutionName || 'Mizuho Americas'}</span>
        {reportingPeriod && <span className="text-xs text-muted-foreground">{reportingPeriod}</span>}
      </div>

      {/* Peer Selector */}
      <PeerSelector
        selectedPeerIds={selectedPeerIds}
        onPeersChange={setSelectedPeerIds}
      />

      {/* No Data State */}
      {!isLoading && !hasData && (
        <div className="bg-muted/30 border border-border rounded-lg p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Real Metrics Available</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Upload and analyze regulatory reports (Call Reports, UBPR) in the Data Ingestion tab
            to compare your institution's real metrics against peers.
          </p>
        </div>
      )}

      {/* Comparison by Category — only metrics with real Mizuho data */}
      {hasData && categories.map((category) => {
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
                      <p className="text-xs text-muted-foreground">Mizuho (Real)</p>
                    </div>
                  </div>

                  {/* Peer Comparison Table */}
                  <div className="mb-4">
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      {metric.peerValues.slice(0, 4).map((peer) => (
                        <div key={peer.bankName} className="text-center">
                          <p className="text-muted-foreground truncate">{peer.bankName.split(' ')[0]}</p>
                          <p className="font-semibold text-foreground">{peer.value}</p>
                        </div>
                      ))}
                    </div>
                    {metric.peerValues.length > 4 && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        +{metric.peerValues.length - 4} more peers
                      </p>
                    )}
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

      {/* Summary Scorecard — only if we have comparisons */}
      {hasData && peerComparisonMetrics.length > 0 && (
        <div className="glass-card rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Performance Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-3xl font-bold text-success">{summaryStats.aboveMedian}</p>
              <p className="text-sm text-muted-foreground">Above Median</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-3xl font-bold text-primary">{summaryStats.atMedian}</p>
              <p className="text-sm text-muted-foreground">At Median</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-3xl font-bold text-warning">{summaryStats.belowMedian}</p>
              <p className="text-sm text-muted-foreground">Below Median</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary border border-border">
              <p className="text-3xl font-bold text-foreground">{summaryStats.topQuartile}</p>
              <p className="text-sm text-muted-foreground">Top Quartile</p>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {hasData && peerComparisonMetrics.length > 0 && (
        <p className="text-xs text-muted-foreground text-center italic">
          Mizuho values are from ingested regulatory reports. Peer values are reference data from public filings. 
          Only metrics with real Mizuho data are shown.
        </p>
      )}
    </div>
  );
}
