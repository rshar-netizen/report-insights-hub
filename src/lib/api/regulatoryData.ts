import { supabase } from '@/integrations/supabase/client';

export type DataSource = 'ffiec' | 'fred' | 'sec' | 'fdic';

export interface ScrapeResult {
  success: boolean;
  source: DataSource;
  url: string;
  scrapedAt: string;
  data: Record<string, unknown> | null;
  markdown: string | null;
  metadata: Record<string, unknown> | null;
  error?: string;
}

export interface MetricDataResult {
  success: boolean;
  metricId: string;
  source: string;
  url: string;
  scrapedAt: string;
  data: {
    metricName: string;
    currentValue?: number;
    unit: string;
    quarterlyData: { period: string; value: number }[];
    yearlyData: { period: string; value: number }[];
    peerMedian?: number;
    regulatoryMinimum?: number;
    reportingPeriod?: string;
  };
  rawMarkdown?: string;
  error?: string;
}

export const regulatoryDataApi = {
  /**
   * Scrape data from a regulatory source
   */
  async scrapeSource(
    source: DataSource,
    options?: {
      rssdId?: string;
      metric?: string;
      bankName?: string;
    }
  ): Promise<ScrapeResult> {
    const { data, error } = await supabase.functions.invoke('scrape-regulatory-data', {
      body: {
        source,
        ...options,
      },
    });

    if (error) {
      return {
        success: false,
        source,
        url: '',
        scrapedAt: new Date().toISOString(),
        data: null,
        markdown: null,
        metadata: null,
        error: error.message,
      };
    }

    return data as ScrapeResult;
  },

  /**
   * Fetch specific metric data with structured extraction
   */
  async fetchMetric(
    metricId: string,
    options?: {
      rssdId?: string;
      periods?: number;
    }
  ): Promise<MetricDataResult> {
    const { data, error } = await supabase.functions.invoke('fetch-metric-data', {
      body: {
        metricId,
        rssdId: options?.rssdId || '623806', // Default to Mizuho RSSD
        periods: options?.periods || 8,
      },
    });

    if (error) {
      return {
        success: false,
        metricId,
        source: '',
        url: '',
        scrapedAt: new Date().toISOString(),
        data: {
          metricName: metricId,
          unit: '%',
          quarterlyData: [],
          yearlyData: [],
        },
        error: error.message,
      };
    }

    return data as MetricDataResult;
  },

  /**
   * Fetch all available metrics for an institution
   */
  async fetchAllMetrics(rssdId: string = '623806'): Promise<MetricDataResult[]> {
    const metricIds = [
      'nim', 'tier1', 'cet1', 'roa', 'roe', 
      'efficiency', 'npl', 'lcr', 'ldr', 'cof', 'acl_coverage'
    ];

    const results = await Promise.all(
      metricIds.map(metricId => this.fetchMetric(metricId, { rssdId }))
    );

    return results;
  },

  /**
   * Scrape FDIC Summary of Deposits
   */
  async fetchSummaryOfDeposits(rssdId?: string): Promise<ScrapeResult> {
    return this.scrapeSource('fdic', { rssdId });
  },

  /**
   * Scrape SEC EDGAR filings
   */
  async fetchSecFilings(bankName: string): Promise<ScrapeResult> {
    return this.scrapeSource('sec', { bankName });
  },

  /**
   * Scrape FRED economic indicators
   */
  async fetchFredData(metric: string): Promise<ScrapeResult> {
    return this.scrapeSource('fred', { metric });
  },
};
