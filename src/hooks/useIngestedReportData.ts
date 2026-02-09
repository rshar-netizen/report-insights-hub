import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BankMetric, ExecutiveInsight } from '@/data/dataSources';

// Extracted metrics from report insights
interface ExtractedMetrics {
  tier1_capital_ratio?: number;
  common_equity_tier1_ratio?: number;
  cet1_ratio?: number;
  total_capital_ratio?: number;
  tier1_leverage_ratio?: number;
  net_interest_margin?: number;
  roa?: number;
  return_on_average_assets?: number;
  roe?: number;
  efficiency_ratio?: number;
  npl_ratio?: number;
  lcr?: number;
  total_assets?: number;
}

interface ReportInsight {
  id: string;
  report_id: string;
  insight_type: string;
  category: string | null;
  title: string;
  content: string;
  confidence_score: number | null;
  metrics: ExtractedMetrics | null;
  created_at: string;
}

interface IngestedReport {
  id: string;
  name: string;
  report_type: string;
  source: string;
  institution_name: string | null;
  reporting_period: string | null;
  status: string;
  created_at: string;
}

interface ReportWithInsights extends IngestedReport {
  insights: ReportInsight[];
}

// Fetch all ingested reports with their insights
export function useIngestedReports() {
  return useQuery({
    queryKey: ['ingested-reports-with-insights'],
    queryFn: async () => {
      // Fetch reports
      const { data: reports, error: reportsError } = await supabase
        .from('ingested_reports')
        .select('*')
        .eq('status', 'analyzed')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      // Fetch insights for all reports
      const { data: insights, error: insightsError } = await supabase
        .from('report_insights')
        .select('*')
        .order('created_at', { ascending: false });

      if (insightsError) throw insightsError;

      // Combine reports with their insights
      const reportsWithInsights: ReportWithInsights[] = (reports || []).map(report => ({
        ...report,
        insights: (insights || []).filter(i => i.report_id === report.id) as ReportInsight[]
      }));

      return reportsWithInsights;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Extract reporting period from filename if not set (e.g., "UBPR_2025-12-31.pdf" -> "Q4 2025")
function extractPeriodFromFilename(filename: string): string | null {
  // Match patterns like 2025-12-31, 2025_12_31, 12-31-2025
  const isoMatch = filename.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month] = isoMatch;
    const quarter = Math.ceil(parseInt(month) / 3);
    return `Q${quarter} ${year}`;
  }
  
  const usMatch = filename.match(/(\d{2})-(\d{2})-(\d{4})/);
  if (usMatch) {
    const [, month, , year] = usMatch;
    const quarter = Math.ceil(parseInt(month) / 3);
    return `Q${quarter} ${year}`;
  }
  
  return null;
}

// Metric source entry tracking multiple reports
interface MetricSourceEntry {
  reportType: string;
  period: string;
  source: string;
}

// Get all reports with metrics, aggregated - tracks MULTIPLE sources per metric
export function useAllReportMetrics() {
  const { data: reports, isLoading, error } = useIngestedReports();

  // Aggregate metrics from all reports with metric_extraction insights
  const allMetrics: ExtractedMetrics = {};
  // Now track MULTIPLE sources per metric key
  const metricSources: Record<string, MetricSourceEntry[]> = {};

  reports?.forEach(report => {
    const metricsInsight = report.insights.find(
      i => i.insight_type === 'metric_extraction' && i.metrics
    );
    
    if (metricsInsight?.metrics) {
      const period = report.reporting_period || extractPeriodFromFilename(report.name) || 'Latest';
      const sourceLabel = report.source === 'ffiec' ? 'FFIEC CDR' : 
                          report.source === 'fdic' ? 'FDIC' : 
                          report.source === 'sec' ? 'SEC EDGAR' :
                          report.source === 'fred' ? 'FRED' :
                          report.report_type.toUpperCase();
      
      const reportType = report.report_type === 'call_report' ? 'Call Report' :
                         report.report_type === 'ubpr' ? 'UBPR' :
                         report.report_type === 'fr_y9c' ? 'FRY-9C' :
                         report.report_type === 'summary_of_deposits' ? 'Summary of Deposits' :
                         report.report_type === 'sec_filing' ? 'SEC Filing' :
                         report.report_type === 'economic_indicator' ? 'Economic Indicator' :
                         report.report_type.toUpperCase();
      
      // Merge metrics, tracking ALL sources that contribute to each metric
      Object.entries(metricsInsight.metrics).forEach(([key, value]) => {
        if (value !== undefined && value !== null && (typeof value === 'number' && value > 0)) {
          // Add to sources array
          if (!metricSources[key]) {
            metricSources[key] = [];
          }
          
          // Check if this source already exists
          const existingSource = metricSources[key].find(
            s => s.reportType === reportType && s.source === sourceLabel
          );
          
          if (!existingSource) {
            metricSources[key].push({ 
              reportType, 
              period, 
              source: sourceLabel 
            });
          }
          
          // Use the first (or aggregate) value
          if (!(key in allMetrics) || !allMetrics[key as keyof ExtractedMetrics]) {
            (allMetrics as Record<string, number>)[key] = value as number;
          }
        }
      });
    }
  });

  return {
    metrics: allMetrics,
    metricSources,
    isLoading,
    error,
    hasData: Object.keys(allMetrics).length > 0,
  };
}

// Get the latest report with metrics (legacy, single-report)
export function useLatestReportMetrics() {
  const { data: reports, isLoading, error } = useIngestedReports();

  // Find the latest report with extracted metrics
  const latestReport = reports?.find(r => 
    r.insights.some(i => i.insight_type === 'metric_extraction' && i.metrics)
  );

  const metricsInsight = latestReport?.insights.find(
    i => i.insight_type === 'metric_extraction' && i.metrics
  );

  const extractedMetrics = metricsInsight?.metrics || null;
  const reportingPeriod = latestReport?.reporting_period || extractPeriodFromFilename(latestReport?.name || '') || null;
  const reportName = latestReport?.name || null;
  const institutionName = latestReport?.institution_name || null;
  const source = latestReport?.source || 'upload';

  return {
    metrics: extractedMetrics,
    reportingPeriod,
    reportName,
    institutionName,
    source,
    isLoading,
    error,
    hasData: !!extractedMetrics,
  };
}

// Helper to format multiple sources into readable strings
function formatSourcesForMetric(sources: MetricSourceEntry[] | undefined, defaultSource: string): {
  source: string;
  reportType: string;
  changeLabel: string;
} {
  if (!sources || sources.length === 0) {
    return { source: defaultSource, reportType: defaultSource, changeLabel: '' };
  }
  
  if (sources.length === 1) {
    return {
      source: sources[0].source,
      reportType: sources[0].reportType,
      changeLabel: sources[0].period ? `as of ${sources[0].period}` : ''
    };
  }
  
  // Multiple sources - combine them
  const uniqueSources = [...new Set(sources.map(s => s.source))];
  const uniqueTypes = [...new Set(sources.map(s => s.reportType))];
  const periods = [...new Set(sources.map(s => s.period).filter(Boolean))];
  
  return {
    source: uniqueSources.join(' + '),
    reportType: uniqueTypes.join(', '),
    changeLabel: periods.length > 0 ? `from ${uniqueTypes.join(', ')} (${periods[0]})` : ''
  };
}

// Convert extracted metrics to BankMetric format - aggregates from ALL ingested reports
export function useRealBankMetrics() {
  const { 
    metrics, 
    metricSources,
    isLoading, 
    error, 
    hasData 
  } = useAllReportMetrics();
  
  const { data: reports } = useIngestedReports();
  
  // Get the latest report for institution name and period
  const latestReport = reports?.find(r => 
    r.insights.some(i => i.insight_type === 'metric_extraction' && i.metrics)
  );
  const institutionName = latestReport?.institution_name || null;
  const reportingPeriod = latestReport?.reporting_period || extractPeriodFromFilename(latestReport?.name || '') || null;

  // Build metrics from extracted data with proper source attribution
  const realMetrics: BankMetric[] = [];

  if (metrics) {
    // Tier 1 Capital Ratio
    if (metrics.tier1_capital_ratio !== undefined && metrics.tier1_capital_ratio > 0) {
      const fmt = formatSourcesForMetric(metricSources['tier1_capital_ratio'], 'Call Report');
      realMetrics.push({
        id: 'tier1-capital',
        label: 'Tier 1 Capital Ratio',
        value: `${metrics.tier1_capital_ratio}%`,
        change: 0,
        changeLabel: fmt.changeLabel,
        source: fmt.source,
        reportType: fmt.reportType,
        sourceUrl: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx',
        bankId: 'mizuho',
        description: 'Core capital as % of risk-weighted assets. Measures ability to absorb losses.',
        threshold: { min: 8.0, status: metrics.tier1_capital_ratio >= 10.5 ? 'good' : metrics.tier1_capital_ratio >= 8 ? 'warning' : 'critical' }
      });
    }

    // CET1 Ratio
    const cet1Value = metrics.common_equity_tier1_ratio || metrics.cet1_ratio;
    const cet1Key = metrics.common_equity_tier1_ratio ? 'common_equity_tier1_ratio' : 'cet1_ratio';
    if (cet1Value !== undefined && cet1Value > 0) {
      const fmt = formatSourcesForMetric(metricSources[cet1Key], 'Call Report');
      realMetrics.push({
        id: 'cet1',
        label: 'CET1 Ratio',
        value: `${cet1Value}%`,
        change: 0,
        changeLabel: fmt.changeLabel,
        source: fmt.source,
        reportType: fmt.reportType,
        sourceUrl: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx',
        bankId: 'mizuho',
        description: 'Common Equity Tier 1 capital as % of risk-weighted assets.',
        threshold: { min: 7.0, status: cet1Value >= 9 ? 'good' : cet1Value >= 7 ? 'warning' : 'critical' }
      });
    }

    // Total Capital Ratio
    if (metrics.total_capital_ratio !== undefined && metrics.total_capital_ratio > 0) {
      const fmt = formatSourcesForMetric(metricSources['total_capital_ratio'], 'UBPR');
      realMetrics.push({
        id: 'total-capital',
        label: 'Total Capital Ratio',
        value: `${metrics.total_capital_ratio}%`,
        change: 0,
        changeLabel: fmt.changeLabel,
        source: fmt.source,
        reportType: fmt.reportType,
        sourceUrl: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx',
        bankId: 'mizuho',
        description: 'Total regulatory capital as % of risk-weighted assets.',
        threshold: { min: 10.0, status: metrics.total_capital_ratio >= 12 ? 'good' : metrics.total_capital_ratio >= 10 ? 'warning' : 'critical' }
      });
    }

    // Tier 1 Leverage Ratio
    if (metrics.tier1_leverage_ratio !== undefined && metrics.tier1_leverage_ratio > 0) {
      const fmt = formatSourcesForMetric(metricSources['tier1_leverage_ratio'], 'UBPR');
      realMetrics.push({
        id: 'leverage-ratio',
        label: 'Tier 1 Leverage Ratio',
        value: `${metrics.tier1_leverage_ratio}%`,
        change: 0,
        changeLabel: fmt.changeLabel,
        source: fmt.source,
        reportType: fmt.reportType,
        sourceUrl: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx',
        bankId: 'mizuho',
        description: 'Tier 1 capital divided by average total consolidated assets.',
        threshold: { min: 4.0, status: metrics.tier1_leverage_ratio >= 5 ? 'good' : metrics.tier1_leverage_ratio >= 4 ? 'warning' : 'critical' }
      });
    }

    // Net Interest Margin
    if (metrics.net_interest_margin !== undefined && metrics.net_interest_margin > 0) {
      const fmt = formatSourcesForMetric(metricSources['net_interest_margin'], 'UBPR');
      realMetrics.push({
        id: 'nim',
        label: 'Net Interest Margin',
        value: `${metrics.net_interest_margin}%`,
        change: 0,
        changeLabel: fmt.changeLabel,
        source: fmt.source,
        reportType: fmt.reportType,
        sourceUrl: 'https://cdr.ffiec.gov/',
        bankId: 'mizuho',
        description: 'Difference between interest income and interest paid, relative to assets.',
        threshold: { min: 2.5, status: metrics.net_interest_margin >= 2.5 ? 'good' : metrics.net_interest_margin >= 2 ? 'warning' : 'critical' }
      });
    }

    // ROA (Return on Assets)
    const roaValue = metrics.roa || metrics.return_on_average_assets;
    const roaKey = metrics.roa ? 'roa' : 'return_on_average_assets';
    if (roaValue !== undefined && roaValue > 0) {
      const fmt = formatSourcesForMetric(metricSources[roaKey], 'UBPR');
      realMetrics.push({
        id: 'roa',
        label: 'Return on Assets (ROA)',
        value: `${roaValue}%`,
        change: 0,
        changeLabel: fmt.changeLabel,
        source: fmt.source,
        reportType: fmt.reportType,
        sourceUrl: 'https://cdr.ffiec.gov/',
        bankId: 'mizuho',
        description: 'Net income as a percentage of average total assets.',
        threshold: { min: 1.0, status: roaValue >= 1.0 ? 'good' : roaValue >= 0.5 ? 'warning' : 'critical' }
      });
    }

    // ROE (Return on Equity)
    if (metrics.roe !== undefined && metrics.roe > 0) {
      const fmt = formatSourcesForMetric(metricSources['roe'], 'UBPR');
      realMetrics.push({
        id: 'roe',
        label: 'Return on Equity (ROE)',
        value: `${metrics.roe}%`,
        change: 0,
        changeLabel: fmt.changeLabel,
        source: fmt.source,
        reportType: fmt.reportType,
        sourceUrl: 'https://cdr.ffiec.gov/',
        bankId: 'mizuho',
        description: 'Net income as a percentage of average total equity.',
        threshold: { min: 10.0, status: metrics.roe >= 10 ? 'good' : metrics.roe >= 6 ? 'warning' : 'critical' }
      });
    }

    // Efficiency Ratio
    if (metrics.efficiency_ratio !== undefined && metrics.efficiency_ratio > 0) {
      const fmt = formatSourcesForMetric(metricSources['efficiency_ratio'], 'UBPR');
      realMetrics.push({
        id: 'efficiency',
        label: 'Efficiency Ratio',
        value: `${metrics.efficiency_ratio}%`,
        change: 0,
        changeLabel: fmt.changeLabel,
        source: fmt.source,
        reportType: fmt.reportType,
        sourceUrl: 'https://cdr.ffiec.gov/',
        bankId: 'mizuho',
        description: 'Non-interest expenses divided by revenue. Lower is better.',
        threshold: { max: 60.0, status: metrics.efficiency_ratio <= 55 ? 'good' : metrics.efficiency_ratio <= 65 ? 'warning' : 'critical' }
      });
    }

    // NPL Ratio
    if (metrics.npl_ratio !== undefined && metrics.npl_ratio > 0) {
      const fmt = formatSourcesForMetric(metricSources['npl_ratio'], 'UBPR');
      realMetrics.push({
        id: 'npl',
        label: 'NPL Ratio',
        value: `${metrics.npl_ratio}%`,
        change: 0,
        changeLabel: fmt.changeLabel,
        source: fmt.source,
        reportType: fmt.reportType,
        sourceUrl: 'https://cdr.ffiec.gov/',
        bankId: 'mizuho',
        description: 'Non-performing loans as a percentage of total loans.',
        threshold: { max: 2.0, status: metrics.npl_ratio <= 1 ? 'good' : metrics.npl_ratio <= 2 ? 'warning' : 'critical' }
      });
    }

    // LCR (Liquidity Coverage Ratio)
    if (metrics.lcr !== undefined && metrics.lcr > 0) {
      const fmt = formatSourcesForMetric(metricSources['lcr'], 'Call Report');
      realMetrics.push({
        id: 'lcr',
        label: 'Liquidity Coverage Ratio',
        value: `${metrics.lcr}%`,
        change: 0,
        changeLabel: fmt.changeLabel,
        source: fmt.source,
        reportType: fmt.reportType,
        sourceUrl: 'https://cdr.ffiec.gov/',
        bankId: 'mizuho',
        description: 'High-quality liquid assets to net cash outflows over 30 days.',
        threshold: { min: 100.0, status: metrics.lcr >= 120 ? 'good' : metrics.lcr >= 100 ? 'warning' : 'critical' }
      });
    }

    // Total Assets (convert to display format)
    if (metrics.total_assets !== undefined && metrics.total_assets > 0) {
      const fmt = formatSourcesForMetric(metricSources['total_assets'], 'Call Report');
      const assetsDisplay = metrics.total_assets >= 1e12 
        ? `$${(metrics.total_assets / 1e12).toFixed(2)}T`
        : metrics.total_assets >= 1e9 
          ? `$${(metrics.total_assets / 1e9).toFixed(1)}B`
          : `$${(metrics.total_assets / 1e6).toFixed(0)}M`;
      
      realMetrics.push({
        id: 'total-assets',
        label: 'Total Assets',
        value: assetsDisplay,
        change: 0,
        changeLabel: fmt.changeLabel,
        source: fmt.source,
        reportType: fmt.reportType,
        sourceUrl: 'https://cdr.ffiec.gov/',
        bankId: 'mizuho',
        description: 'Total consolidated assets of the institution.',
        threshold: { status: 'good' }
      });
    }
  }

  return {
    metrics: realMetrics,
    reportingPeriod,
    institutionName,
    isLoading,
    error,
    hasData,
    reportsCount: new Set(reports?.map(r => r.name)).size || 0,
  };
}

// Source report info for citations
export interface ReportCitation {
  name: string;
  reportType: string;
  source: string;
  period: string;
  status: string;
}

// Convert insights to ExecutiveInsight format - aggregates from ALL analyzed reports
export function useRealExecutiveInsights() {
  const { data: reports, isLoading, error } = useIngestedReports();

  // Map insight categories
  const mapCategory = (category: string | null, insightType: string): 'strength' | 'attention' | 'opportunity' | 'risk' => {
    // First prioritize insight_type for clearer mapping
    if (insightType === 'risk_assessment') return 'risk';
    if (insightType === 'recommendation') return 'opportunity';
    
    // Then use category
    if (category === 'capital' || category === 'liquidity' || category === 'balance_sheet' || category === 'general') return 'strength';
    if (category === 'compliance' || category === 'strategic' || category === 'strategic_planning' || category === 'strategy' || category === 'operations' || category === 'regulatory_strategy' || category === 'growth') return 'opportunity';
    if (category === 'asset_quality' || category === 'profitability' || category === 'financial_performance' || category === 'operational_risk' || category === 'liquidity_risk') return 'attention';
    
    // Remaining insight_type fallbacks
    if (insightType === 'trend_analysis') return 'attention';
    if (insightType === 'metric_extraction' || insightType === 'summary') return 'strength';
    return 'attention';
  };

  const getSourceLabel = (source: string): string => {
    switch (source) {
      case 'ffiec': return 'FFIEC CDR';
      case 'fdic': return 'FDIC';
      case 'sec': return 'SEC EDGAR';
      case 'fred': return 'FRED';
      case 'upload': return 'Uploaded Report';
      default: return source.toUpperCase();
    }
  };

  const getReportTypeLabel = (reportType: string): string => {
    switch (reportType) {
      case 'call_report': return 'Call Report';
      case 'ubpr': return 'UBPR';
      case 'fr_y9c': return 'FRY-9C';
      case 'summary_of_deposits': return 'Summary of Deposits';
      case 'sec_filing': return 'SEC Filing';
      case 'economic_indicator': return 'Economic Indicator';
      case 'custom': return 'FDIC Financials';
      default: return reportType.toUpperCase();
    }
  };

  const insights: ExecutiveInsight[] = [];
  const citations: ReportCitation[] = [];
  let reportingPeriod = '';
  let institutionName: string | undefined;

  // Aggregate insights from ALL analyzed reports
  reports?.forEach((report) => {
    if (!institutionName && report.institution_name) {
      institutionName = report.institution_name;
    }
    if (!reportingPeriod && report.reporting_period) {
      reportingPeriod = report.reporting_period;
    }

    // Track citations
    citations.push({
      name: report.name,
      reportType: getReportTypeLabel(report.report_type),
      source: getSourceLabel(report.source),
      period: report.reporting_period || extractPeriodFromFilename(report.name) || 'Latest',
      status: report.status,
    });

    report.insights.forEach((insight, index) => {
      // Skip metric extraction insights - we use those for the metrics cards
      if (insight.insight_type === 'metric_extraction') return;
      
      // Skip insights that indicate failed data retrieval or lack actionable content
      const lowerContent = insight.content.toLowerCase();
      if (
        lowerContent.includes('no financial data is available') ||
        lowerContent.includes('system error') ||
        lowerContent.includes('resulted in a system error') ||
        lowerContent.includes('data retrieval failed') ||
        lowerContent.includes('no data available')
      ) return;
      
      // Skip outdated insights (pre-2024) to keep the summary current
      const hasOldDate = /\b(201\d|202[0-3])\b/.test(insight.content) && 
                         !/\b(2024|2025|2026)\b/.test(insight.content);
      if (hasOldDate) return;

      // Extract a metric value if present in the content
      const metricMatch = insight.content.match(/(\d+\.?\d*%|\d+\.?\d*\s*bps|\d+\.?\d*x)/);
      
      insights.push({
        id: `real-insight-${report.id}-${index}`,
        category: mapCategory(insight.category, insight.insight_type),
        title: insight.title,
        summary: insight.content,
        metric: metricMatch ? metricMatch[0] : undefined,
        source: getSourceLabel(report.source),
        reportType: `${getReportTypeLabel(report.report_type)} (${report.reporting_period || 'Latest'})`,
        confidence: insight.confidence_score ?? undefined
      });
    });
  });

  return {
    insights,
    citations,
    reportingPeriod,
    institutionName,
    isLoading,
    error,
    hasData: insights.length > 0,
  };
}
