import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2,
  Lightbulb,
  ShieldAlert,
  ExternalLink,
  Wifi,
  Database,
  RefreshCw,
  Loader2,
  FileText
} from 'lucide-react';
import { executiveInsights, mizuhoMetrics, BankMetric, ExecutiveInsight } from '@/data/dataSources';
import { BankMetricCard } from './BankMetricCard';
import { MetricTrendTracker } from './MetricTrendTracker';
import { ConfidenceBadge } from './ConfidenceBadge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAllMetrics, useDataFreshness } from '@/hooks/useRegulatoryData';
import { useRealBankMetrics, useRealExecutiveInsights } from '@/hooks/useIngestedReportData';
import { useToast } from '@/hooks/use-toast';

export function ExecutiveSummary() {
  const [useRealTimeData, setUseRealTimeData] = useState(true); // Default to real data
  const { toast } = useToast();
  
  // Fetch real data from ingested reports
  const { 
    metrics: realMetrics, 
    reportingPeriod: metricsReportingPeriod,
    institutionName,
    isLoading: metricsLoading,
    hasData: hasRealMetrics,
    reportsCount
  } = useRealBankMetrics();
  
  const {
    insights: realInsights,
    reportingPeriod: insightsReportingPeriod,
    isLoading: insightsLoading,
    hasData: hasRealInsights
  } = useRealExecutiveInsights();
  
  // Fetch live API metrics when toggle is on (for comparison)
  const { data: apiMetrics, isLoading: apiLoading, isError, refetch, dataUpdatedAt } = useAllMetrics('623806');
  
  // Transform API data to match BankMetric format (for live toggle)
  const liveApiMetrics: BankMetric[] = useMemo(() => {
    if (!apiMetrics) return [];
    
    return apiMetrics.map(metric => {
      const staticMetric = mizuhoMetrics.find(m => 
        m.id.toLowerCase().includes(metric.metricId) || 
        metric.metricId.includes(m.id.toLowerCase())
      );
      
      const qData = metric.data.quarterlyData || [];
      const change = qData.length >= 2 
        ? parseFloat(((qData[0]?.value - qData[1]?.value) / (qData[1]?.value || 1) * 100).toFixed(2))
        : 0;
      
      const currentValue = metric.data.currentValue;
      const formattedValue = currentValue !== undefined 
        ? `${currentValue}${metric.data.unit}` 
        : 'N/A';
      
      const getThresholdStatus = (): 'good' | 'warning' | 'critical' => {
        if (!currentValue || !metric.data.regulatoryMinimum) return 'good';
        const buffer = currentValue - metric.data.regulatoryMinimum;
        if (buffer > 5) return 'good';
        if (buffer > 2) return 'warning';
        return 'critical';
      };
      
      return {
        id: metric.metricId,
        label: metric.data.metricName || staticMetric?.label || metric.metricId.toUpperCase(),
        value: formattedValue,
        change,
        changeLabel: 'vs prior quarter',
        source: metric.source || 'FFIEC CDR',
        reportType: staticMetric?.reportType || 'Live Data',
        sourceUrl: metric.url || staticMetric?.sourceUrl || 'https://cdr.ffiec.gov',
        bankId: 'mizuho',
        description: staticMetric?.description || `Real-time ${metric.data.metricName} data`,
        threshold: {
          min: metric.data.regulatoryMinimum,
          status: getThresholdStatus()
        }
      };
    });
  }, [apiMetrics]);
  
  // Get data freshness info
  const latestScrapedAt = apiMetrics?.[0]?.scrapedAt;
  const { isFresh, age } = useDataFreshness(latestScrapedAt);
  
  const handleRefresh = async () => {
    toast({
      title: 'Refreshing metrics...',
      description: 'Fetching latest data from regulatory sources',
    });
    await refetch();
  };
  
  // Determine which data to display
  const isLoading = metricsLoading || insightsLoading;
  
  // Use real ingested data if available, otherwise fall back to static demo data
  const displayMetrics = hasRealMetrics && realMetrics.length > 0 
    ? realMetrics 
    : mizuhoMetrics;
  
  const displayInsights = hasRealInsights && realInsights.length > 0 
    ? realInsights 
    : executiveInsights;
  
  // Reporting period from ingested data
  const reportPeriod = metricsReportingPeriod || insightsReportingPeriod || 'Demo Data';
  const isRealData = hasRealMetrics || hasRealInsights;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'attention':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'opportunity':
        return <Lightbulb className="w-5 h-5 text-primary" />;
      case 'risk':
        return <ShieldAlert className="w-5 h-5 text-destructive" />;
      default:
        return <TrendingUp className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'strength':
        return 'border-l-success bg-success/5';
      case 'attention':
        return 'border-l-warning bg-warning/5';
      case 'opportunity':
        return 'border-l-primary bg-primary/5';
      case 'risk':
        return 'border-l-destructive bg-destructive/5';
      default:
        return 'border-l-muted bg-muted/5';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'strength':
        return 'Strength';
      case 'attention':
        return 'Attention';
      case 'opportunity':
        return 'Opportunity';
      case 'risk':
        return 'Risk';
      default:
        return category;
    }
  };

  const strengths = displayInsights.filter(i => i.category === 'strength');
  const attentionItems = displayInsights.filter(i => i.category === 'attention' || i.category === 'risk');
  const opportunities = displayInsights.filter(i => i.category === 'opportunity');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Executive Insights Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Executive Summary</h2>
          <p className="text-muted-foreground">
            {isRealData ? (
              <>
                Key insights derived from ingested reports
                {reportPeriod && (
                  <Badge variant="outline" className="ml-2">
                    <FileText className="w-3 h-3 mr-1" />
                    {reportPeriod}
                  </Badge>
                )}
              </>
            ) : (
              'Demo data - Upload reports in Data Ingestion tab to see real metrics'
            )}
          </p>
        </div>
        {isRealData && (
          <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
            <Database className="w-3 h-3 mr-1" />
            {reportsCount} Reports Analyzed
          </Badge>
        )}
      </div>

      {/* Insights Grid */}
      <div className="space-y-6">
        {/* Strengths */}
        {strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <h3 className="text-sm font-semibold text-success uppercase tracking-wide">Strengths</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strengths.map((insight) => (
                <div
                  key={insight.id}
                  className={`glass-card rounded-lg p-5 border-l-4 ${getCategoryStyle(insight.category)} hover:glow-border transition-all duration-300`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(insight.category)}
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {getCategoryLabel(insight.category)}
                      </span>
                      <ConfidenceBadge confidence={insight.confidence} />
                    </div>
                    {insight.metric && (
                      <span className="metric-value text-xl text-foreground">
                        {insight.metric}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {insight.summary}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="source-tag px-2 py-0.5 rounded">{insight.source}</span>
                    <span>•</span>
                    <span>{insight.reportType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attention & Risks */}
        {attentionItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <h3 className="text-sm font-semibold text-warning uppercase tracking-wide">Requires Attention</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attentionItems.map((insight) => (
                <div
                  key={insight.id}
                  className={`glass-card rounded-lg p-5 border-l-4 ${getCategoryStyle(insight.category)} hover:glow-border transition-all duration-300`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(insight.category)}
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {getCategoryLabel(insight.category)}
                      </span>
                      <ConfidenceBadge confidence={insight.confidence} />
                    </div>
                    {insight.metric && (
                      <span className="metric-value text-xl text-foreground">
                        {insight.metric}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {insight.summary}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="source-tag px-2 py-0.5 rounded">{insight.source}</span>
                    <span>•</span>
                    <span>{insight.reportType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Opportunities */}
        {opportunities.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Opportunities</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities.map((insight) => (
                <div
                  key={insight.id}
                  className={`glass-card rounded-lg p-5 border-l-4 ${getCategoryStyle(insight.category)} hover:glow-border transition-all duration-300`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(insight.category)}
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {getCategoryLabel(insight.category)}
                      </span>
                    </div>
                    {insight.metric && (
                      <span className="metric-value text-xl text-foreground">
                        {insight.metric}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {insight.summary}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="source-tag px-2 py-0.5 rounded">{insight.source}</span>
                    <span>•</span>
                    <span>{insight.reportType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Performance Tracking - Q-o-Q and Y-o-Y */}
      <MetricTrendTracker />

      {/* Institution Metrics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Institution Metrics</h2>
            <p className="text-sm text-muted-foreground">
              {isRealData ? (
                <>
                  Data from ingested Call Reports
                  {metricsReportingPeriod && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {metricsReportingPeriod}
                    </Badge>
                  )}
                  {institutionName && (
                    <span className="ml-2 text-xs">• {institutionName}</span>
                  )}
                </>
              ) : (
                'Demo data - Upload reports to see actual metrics'
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isRealData ? (
              <Badge variant="default" className="bg-success/10 text-success border-success/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Real Data
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                <Database className="w-3 h-3 mr-1" />
                Demo Mode
              </Badge>
            )}
          </div>
        </div>
        
        {isLoading && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading metrics from ingested reports...</span>
          </div>
        )}
        
        {!isLoading && displayMetrics.length === 0 && (
          <div className="bg-muted/50 border border-border rounded-lg p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No metrics extracted from reports yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload a Call Report in the Data Ingestion tab to extract metrics.
            </p>
          </div>
        )}
        
        {!isLoading && displayMetrics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayMetrics.map((metric) => (
              <BankMetricCard key={metric.id} metric={metric} isRealTime={isRealData} />
            ))}
          </div>
        )}
        
        {/* Show note about missing metrics if using real data but not all metrics present */}
        {isRealData && displayMetrics.length > 0 && displayMetrics.length < 6 && (
          <p className="text-xs text-muted-foreground mt-4 italic">
            Note: Some metrics could not be extracted from the uploaded reports. 
            Upload additional report types (UBPR, FRY-9C) for comprehensive coverage.
          </p>
        )}
      </div>
    </div>
  );
}
