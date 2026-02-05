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

// Get all reports with metrics, aggregated
export function useAllReportMetrics() {
  const { data: reports, isLoading, error } = useIngestedReports();

  // Aggregate metrics from all reports with metric_extraction insights
  const allMetrics: ExtractedMetrics = {};
  const metricSources: Record<string, { reportType: string; period: string; source: string }> = {};

  reports?.forEach(report => {
    const metricsInsight = report.insights.find(
      i => i.insight_type === 'metric_extraction' && i.metrics
    );
    
    if (metricsInsight?.metrics) {
      const period = report.reporting_period || extractPeriodFromFilename(report.name) || 'Latest';
      const sourceLabel = report.source === 'ffiec' ? 'FFIEC CDR' : 
                          report.source === 'fdic' ? 'FDIC' : 
                          report.report_type.toUpperCase();
      
      // Merge metrics, tracking sources
      Object.entries(metricsInsight.metrics).forEach(([key, value]) => {
        if (value !== undefined && value !== null && (typeof value === 'number' && value > 0)) {
          if (!(key in allMetrics) || !allMetrics[key as keyof ExtractedMetrics]) {
            (allMetrics as Record<string, number>)[key] = value as number;
            metricSources[key] = { 
              reportType: report.report_type.toUpperCase(), 
              period, 
              source: sourceLabel 
            };
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
      const src = metricSources['tier1_capital_ratio'];
      realMetrics.push({
        id: 'tier1-capital',
        label: 'Tier 1 Capital Ratio',
        value: `${metrics.tier1_capital_ratio}%`,
        change: 0,
        changeLabel: src?.period ? `as of ${src.period}` : '',
        source: src?.source || 'Call Report',
        reportType: src?.reportType || 'Call Report Schedule RC-R',
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
      const src = metricSources[cet1Key];
      realMetrics.push({
        id: 'cet1',
        label: 'CET1 Ratio',
        value: `${cet1Value}%`,
        change: 0,
        changeLabel: src?.period ? `as of ${src.period}` : '',
        source: src?.source || 'Call Report',
        reportType: src?.reportType || 'Call Report Schedule RC-R',
        sourceUrl: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx',
        bankId: 'mizuho',
        description: 'Common Equity Tier 1 capital as % of risk-weighted assets.',
        threshold: { min: 7.0, status: cet1Value >= 9 ? 'good' : cet1Value >= 7 ? 'warning' : 'critical' }
      });
    }

    // Total Capital Ratio
    if (metrics.total_capital_ratio !== undefined && metrics.total_capital_ratio > 0) {
      const src = metricSources['total_capital_ratio'];
      realMetrics.push({
        id: 'total-capital',
        label: 'Total Capital Ratio',
        value: `${metrics.total_capital_ratio}%`,
        change: 0,
        changeLabel: src?.period ? `as of ${src.period}` : '',
        source: src?.source || 'UBPR',
        reportType: src?.reportType || 'UBPR',
        sourceUrl: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx',
        bankId: 'mizuho',
        description: 'Total regulatory capital as % of risk-weighted assets.',
        threshold: { min: 10.0, status: metrics.total_capital_ratio >= 12 ? 'good' : metrics.total_capital_ratio >= 10 ? 'warning' : 'critical' }
      });
    }

    // Tier 1 Leverage Ratio
    if (metrics.tier1_leverage_ratio !== undefined && metrics.tier1_leverage_ratio > 0) {
      const src = metricSources['tier1_leverage_ratio'];
      realMetrics.push({
        id: 'leverage-ratio',
        label: 'Tier 1 Leverage Ratio',
        value: `${metrics.tier1_leverage_ratio}%`,
        change: 0,
        changeLabel: src?.period ? `as of ${src.period}` : '',
        source: src?.source || 'UBPR',
        reportType: src?.reportType || 'UBPR',
        sourceUrl: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx',
        bankId: 'mizuho',
        description: 'Tier 1 capital divided by average total consolidated assets.',
        threshold: { min: 4.0, status: metrics.tier1_leverage_ratio >= 5 ? 'good' : metrics.tier1_leverage_ratio >= 4 ? 'warning' : 'critical' }
      });
    }

    // Net Interest Margin
    if (metrics.net_interest_margin !== undefined && metrics.net_interest_margin > 0) {
      const src = metricSources['net_interest_margin'];
      realMetrics.push({
        id: 'nim',
        label: 'Net Interest Margin',
        value: `${metrics.net_interest_margin}%`,
        change: 0,
        changeLabel: src?.period ? `as of ${src.period}` : '',
        source: src?.source || 'UBPR',
        reportType: src?.reportType || 'UBPR',
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
      const src = metricSources[roaKey];
      realMetrics.push({
        id: 'roa',
        label: 'Return on Assets (ROA)',
        value: `${roaValue}%`,
        change: 0,
        changeLabel: src?.period ? `as of ${src.period}` : '',
        source: src?.source || 'UBPR',
        reportType: src?.reportType || 'UBPR',
        sourceUrl: 'https://cdr.ffiec.gov/',
        bankId: 'mizuho',
        description: 'Net income as a percentage of average total assets.',
        threshold: { min: 1.0, status: roaValue >= 1.0 ? 'good' : roaValue >= 0.5 ? 'warning' : 'critical' }
      });
    }

    // ROE (Return on Equity)
    if (metrics.roe !== undefined && metrics.roe > 0) {
      const src = metricSources['roe'];
      realMetrics.push({
        id: 'roe',
        label: 'Return on Equity (ROE)',
        value: `${metrics.roe}%`,
        change: 0,
        changeLabel: src?.period ? `as of ${src.period}` : '',
        source: src?.source || 'UBPR',
        reportType: src?.reportType || 'UBPR',
        sourceUrl: 'https://cdr.ffiec.gov/',
        bankId: 'mizuho',
        description: 'Net income as a percentage of average total equity.',
        threshold: { min: 10.0, status: metrics.roe >= 10 ? 'good' : metrics.roe >= 6 ? 'warning' : 'critical' }
      });
    }

    // Efficiency Ratio
    if (metrics.efficiency_ratio !== undefined && metrics.efficiency_ratio > 0) {
      const src = metricSources['efficiency_ratio'];
      realMetrics.push({
        id: 'efficiency',
        label: 'Efficiency Ratio',
        value: `${metrics.efficiency_ratio}%`,
        change: 0,
        changeLabel: src?.period ? `as of ${src.period}` : '',
        source: src?.source || 'UBPR',
        reportType: src?.reportType || 'UBPR',
        sourceUrl: 'https://cdr.ffiec.gov/',
        bankId: 'mizuho',
        description: 'Non-interest expenses divided by revenue. Lower is better.',
        threshold: { max: 60.0, status: metrics.efficiency_ratio <= 55 ? 'good' : metrics.efficiency_ratio <= 65 ? 'warning' : 'critical' }
      });
    }

    // NPL Ratio
    if (metrics.npl_ratio !== undefined && metrics.npl_ratio > 0) {
      const src = metricSources['npl_ratio'];
      realMetrics.push({
        id: 'npl',
        label: 'NPL Ratio',
        value: `${metrics.npl_ratio}%`,
        change: 0,
        changeLabel: src?.period ? `as of ${src.period}` : '',
        source: src?.source || 'UBPR',
        reportType: src?.reportType || 'UBPR',
        sourceUrl: 'https://cdr.ffiec.gov/',
        bankId: 'mizuho',
        description: 'Non-performing loans as a percentage of total loans.',
        threshold: { max: 2.0, status: metrics.npl_ratio <= 1 ? 'good' : metrics.npl_ratio <= 2 ? 'warning' : 'critical' }
      });
    }

    // LCR (Liquidity Coverage Ratio)
    if (metrics.lcr !== undefined && metrics.lcr > 0) {
      const src = metricSources['lcr'];
      realMetrics.push({
        id: 'lcr',
        label: 'Liquidity Coverage Ratio',
        value: `${metrics.lcr}%`,
        change: 0,
        changeLabel: src?.period ? `as of ${src.period}` : '',
        source: src?.source || 'Call Report',
        reportType: src?.reportType || 'Call Report',
        sourceUrl: 'https://cdr.ffiec.gov/',
        bankId: 'mizuho',
        description: 'High-quality liquid assets to net cash outflows over 30 days.',
        threshold: { min: 100.0, status: metrics.lcr >= 120 ? 'good' : metrics.lcr >= 100 ? 'warning' : 'critical' }
      });
    }

    // Total Assets (convert to display format)
    if (metrics.total_assets !== undefined && metrics.total_assets > 0) {
      const src = metricSources['total_assets'];
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
        changeLabel: src?.period ? `as of ${src.period}` : '',
        source: src?.source || 'Call Report',
        reportType: src?.reportType || 'Call Report Schedule RC',
        sourceUrl: 'https://cdr.ffiec.gov/',
        bankId: 'mizuho',
        description: 'Total consolidated assets of the institution.',
        threshold: { status: 'good' }
      });
    }
  }

  return {
    metrics: realMetrics,
    isLoading,
    error,
    hasData,
    reportsCount: reports?.length || 0,
  };
}

// Convert insights to ExecutiveInsight format
export function useRealExecutiveInsights() {
  const { data: reports, isLoading, error } = useIngestedReports();

  // Get all insights from the latest report
  const latestReport = reports?.[0];
  const reportingPeriod = latestReport?.reporting_period || '';

  // Map insight categories
  const mapCategory = (category: string | null, insightType: string): 'strength' | 'attention' | 'opportunity' | 'risk' => {
    if (category === 'capital' || category === 'liquidity') return 'strength';
    if (category === 'compliance' || category === 'strategic') return 'opportunity';
    if (category === 'asset_quality' || category === 'profitability') return 'attention';
    if (insightType === 'risk_assessment') return 'risk';
    if (insightType === 'recommendation') return 'opportunity';
    return 'attention';
  };

  const insights: ExecutiveInsight[] = [];

  if (latestReport?.insights) {
    latestReport.insights.forEach((insight, index) => {
      // Skip metric extraction insights - we use those for the metrics cards
      if (insight.insight_type === 'metric_extraction') return;

      // Extract a metric value if present in the content
      const metricMatch = insight.content.match(/(\d+\.?\d*%|\d+\.?\d*\s*bps|\d+\.?\d*x)/);
      
      insights.push({
        id: `real-insight-${index}`,
        category: mapCategory(insight.category, insight.insight_type),
        title: insight.title,
        summary: insight.content.length > 200 
          ? insight.content.substring(0, 200) + '...' 
          : insight.content,
        metric: metricMatch ? metricMatch[0] : undefined,
        source: latestReport.source === 'upload' ? 'Call Report' : latestReport.source.toUpperCase(),
        reportType: `${latestReport.report_type} (${reportingPeriod || 'Latest'})`
      });
    });
  }

  return {
    insights,
    reportingPeriod,
    institutionName: latestReport?.institution_name,
    isLoading,
    error,
    hasData: insights.length > 0,
  };
}
