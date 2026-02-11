import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Building2,
  BarChart3,
  AlertTriangle,
  RefreshCw,
  Database
} from 'lucide-react';
import { allAvailablePeers } from '@/data/dataSources';
import { PeerSelector } from './PeerSelector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRealBankMetrics } from '@/hooks/useIngestedReportData';
import { usePeerMetrics } from '@/hooks/usePeerMetrics';

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

// Metric definitions for mapping real data to peer comparison keys
const metricDefinitions: {
  key: string;
  label: string;
  category: 'capital' | 'profitability' | 'efficiency' | 'risk' | 'liquidity';
  metricIds: string[]; // matching IDs from useRealBankMetrics
  peerKey: keyof import('@/hooks/usePeerMetrics').PeerMetricData['metrics'];
}[] = [
  { key: 'tier1', label: 'Tier 1 Capital Ratio', category: 'capital', metricIds: ['tier1-capital'], peerKey: 'tier1' },
  { key: 'cet1', label: 'CET1 Ratio', category: 'capital', metricIds: ['cet1'], peerKey: 'cet1' },
  { key: 'roa', label: 'Return on Assets', category: 'profitability', metricIds: ['roa'], peerKey: 'roa' },
  { key: 'roe', label: 'Return on Equity', category: 'profitability', metricIds: ['roe'], peerKey: 'roe' },
  { key: 'nim', label: 'Net Interest Margin', category: 'profitability', metricIds: ['nim'], peerKey: 'nim' },
  { key: 'efficiency', label: 'Efficiency Ratio', category: 'efficiency', metricIds: ['efficiency'], peerKey: 'efficiency' },
  { key: 'npl', label: 'NPL Ratio', category: 'risk', metricIds: ['npl'], peerKey: 'npl' },
  { key: 'lcr', label: 'Liquidity Coverage Ratio', category: 'liquidity', metricIds: ['lcr'], peerKey: 'lcr' },
];

export function PeerBenchmarking() {
  const [selectedPeerIds, setSelectedPeerIds] = useState<string[]>(
    allAvailablePeers.slice(0, 4).map(p => p.id)
  );

  const { metrics: realMetrics, isLoading, hasData, reportingPeriod, institutionName } = useRealBankMetrics();
  const { peerData, isLoading: isPeerLoading, fetchPeerMetrics, hasFetchedData, lastFetched } = usePeerMetrics();

  // Fetch real peer data from FDIC
  const handleFetchPeerData = () => {
    const peers = selectedPeerIds.map(id => {
      const bank = allAvailablePeers.find(b => b.id === id);
      return {
        rssdId: bank?.rssdId || '',
        name: bank?.shortName || id,
      };
    }).filter(p => p.rssdId);
    
    fetchPeerMetrics(peers);
  };

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

      // Get peer values - use real FDIC data if available, otherwise show N/A
      const peerValues = selectedPeerIds.map(peerId => {
        const bank = allAvailablePeers.find(b => b.id === peerId);
        const realPeer = peerData.find(p => p.rssdId === bank?.rssdId);
        const peerVal = realPeer?.metrics?.[def.peerKey];
        return {
          bankName: bank?.shortName || peerId,
          value: peerVal !== undefined ? `${peerVal.toFixed(2)}%` : 'N/A',
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
  }, [realMetrics, selectedPeerIds, hasData, peerData]);

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
      <div className="space-y-4">
        <PeerSelector
          selectedPeerIds={selectedPeerIds}
          onPeersChange={setSelectedPeerIds}
        />
        
        {/* Fetch Real Data Button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleFetchPeerData}
            disabled={isPeerLoading || selectedPeerIds.length === 0}
            variant="outline"
            className="gap-2"
          >
            {isPeerLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            {isPeerLoading ? 'Fetching from FDIC...' : 'Fetch Real Peer Data'}
          </Button>
          {hasFetchedData && (
            <Badge variant="secondary" className="text-xs">
              {peerData.filter(p => !p.error && Object.values(p.metrics).some(v => v !== undefined)).length} peers loaded
              {lastFetched && ` · ${new Date(lastFetched).toLocaleTimeString()}`}
            </Badge>
          )}
          {!hasFetchedData && !isPeerLoading && (
            <span className="text-xs text-muted-foreground">
              Click to fetch real metrics from FDIC for selected peers
            </span>
          )}
        </div>
      </div>
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
          {institutionName || 'Mizuho'} values are from ingested regulatory reports. 
          {hasFetchedData 
            ? 'Peer values are real metrics fetched from FDIC BankFind API.' 
            : 'Click "Fetch Real Peer Data" to replace placeholder values with live FDIC data.'}
          {' '}Only metrics with real data are shown.
        </p>
      )}
    </div>
  );
}
