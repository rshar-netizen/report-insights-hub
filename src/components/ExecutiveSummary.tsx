import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Lightbulb,
  ShieldAlert,
  Database,
  Loader2,
  FileText
} from 'lucide-react';
import { mizuhoMetrics, BankMetric, ExecutiveInsight } from '@/data/dataSources';
import { BankMetricCard } from './BankMetricCard';
import { MetricTrendTracker } from './MetricTrendTracker';
import { ConfidenceBadge } from './ConfidenceBadge';
import { Badge } from '@/components/ui/badge';
import { useAllMetrics, useDataFreshness } from '@/hooks/useRegulatoryData';
import { useRealBankMetrics, useRealExecutiveInsights, ReportCitation } from '@/hooks/useIngestedReportData';
import { FinancialPositionChart } from './FinancialPositionChart';
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
    citations,
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
  
  // ONLY show real data - no fallback to demo data
  const displayMetrics = hasRealMetrics && realMetrics.length > 0 
    ? realMetrics 
    : []; // Empty array - no demo data
  
  const displayInsights = hasRealInsights && realInsights.length > 0 
    ? realInsights 
    : []; // Empty array - no demo data
  
  // Reporting period from ingested data only
  const reportPeriod = metricsReportingPeriod || insightsReportingPeriod || null;
  const isRealData = hasRealMetrics || hasRealInsights;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'attention':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'opportunity':
        return <Lightbulb className="w-4 h-4 text-primary" />;
      case 'risk':
        return <ShieldAlert className="w-4 h-4 text-destructive" />;
      default:
        return <TrendingUp className="w-4 h-4 text-muted-foreground" />;
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
        return 'Recommendation';
      case 'risk':
        return 'Risk';
      default:
        return category;
    }
  };

  // Filter to only actionable insights: trends, risks, recommendations (skip generic summaries)
  const actionableInsights = useMemo(() => {
    const currentYear = new Date().getFullYear();
    
    return displayInsights.filter(insight => {
      // Only keep risk_assessment, trend_analysis, recommendation types
      const isActionableCategory = insight.category === 'risk' || insight.category === 'attention' || insight.category === 'opportunity';
      if (!isActionableCategory) return false;
      
      // Skip generic/old content
      const lower = insight.summary.toLowerCase();
      if (lower.includes('as of january 31, 2021') || lower.includes('01/31/2021')) return false;
      if (lower.includes('soap') || lower.includes('rest api') || lower.includes('multi-factor authentication')) return false;
      if (lower.includes('data retrieval') || lower.includes('inaccessible') || lower.includes('critical gap in regulatory monitoring')) return false;
      if (lower.includes('landing page') || lower.includes('central data repository')) return false;
      if (insight.title.includes('Technical Transition') || insight.title.includes('Data Availability')) return false;
      if (insight.title.includes('Institutional Classification')) return false;
      
      return true;
    });
  }, [displayInsights]);

  // Pick top 4: 1 risk, 1 trend/attention, 1 recommendation, 1 best remaining
  const curatedGrid = useMemo(() => {
    const sorted = [...actionableInsights].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
    
    const risks = sorted.filter(i => i.category === 'risk');
    const attention = sorted.filter(i => i.category === 'attention');
    const recommendations = sorted.filter(i => i.category === 'opportunity');
    
    const selected: ExecutiveInsight[] = [];
    const usedIds = new Set<string>();
    
    const pick = (list: ExecutiveInsight[]) => {
      const item = list.find(i => !usedIds.has(i.id));
      if (item) { selected.push(item); usedIds.add(item.id); }
    };
    
    pick(risks);
    pick(attention);
    pick(recommendations);
    // Fill 4th slot from remaining
    const remaining = sorted.filter(i => !usedIds.has(i.id));
    if (remaining.length > 0) { selected.push(remaining[0]); }
    
    return selected.slice(0, 4);
  }, [actionableInsights]);

  // Deduplicated source portals for header note
  const sourcePortals = isRealData && citations
    ? [...new Set(citations.filter(c => c.status === 'analyzed').map(c => c.source))]
    : [];

  // Truncate summary to ~2 lines
  const truncate = (text: string, maxLen = 160) => 
    text.length > maxLen ? text.slice(0, maxLen).trimEnd() + '…' : text;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Executive Insights Header — compact */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Executive Summary</h2>
          {sourcePortals.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Sources: {sourcePortals.join(' · ')}
            </p>
          )}
        </div>
        {isRealData && reportsCount > 0 && (
          <Badge variant="default" className="bg-primary/10 text-primary border-primary/20 text-xs">
            <Database className="w-3 h-3 mr-1" />
            {reportsCount} Reports
          </Badge>
        )}
      </div>

      {/* No Data State */}
      {!isLoading && !isRealData && (
        <div className="bg-muted/30 border border-border rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
          <h3 className="text-base font-semibold text-foreground mb-1">No Data Available</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Upload regulatory reports in the Data Ingestion tab to see insights.
          </p>
        </div>
      )}

      {/* 2×2 Insight Grid */}
      {isRealData && curatedGrid.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {curatedGrid.map((insight) => (
            <div
              key={insight.id}
              className={`rounded-lg p-4 border-l-4 border border-border ${getCategoryStyle(insight.category)} transition-all duration-200 hover:shadow-sm`}
            >
              <div className="flex items-start gap-2.5">
                <div className="shrink-0 mt-0.5">{getCategoryIcon(insight.category)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <h4 className="text-sm font-semibold text-foreground truncate">{insight.title}</h4>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted/50 shrink-0">
                      {getCategoryLabel(insight.category)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {truncate(insight.summary)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                    <span className="source-tag px-1.5 py-0.5 rounded">{insight.source}</span>
                    {insight.metric && (
                      <span className="font-semibold text-foreground text-xs ml-auto">{insight.metric}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Financial Position Diagram */}
      {isRealData && <FinancialPositionChart />}

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
                  Data from ingested regulatory reports
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
                'No metrics available — Upload reports to extract data'
              )}
            </p>
          </div>
          {isRealData && (
            <Badge variant="default" className="bg-success/10 text-success border-success/20">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Real Data
            </Badge>
          )}
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
