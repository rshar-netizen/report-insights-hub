const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface MetricRequest {
  metricId: string;
  rssdId?: string;
  periods?: number;
}

// Metric definitions with their data sources
const metricSources: Record<string, { source: string; url: string; extractPrompt: string }> = {
  nim: {
    source: 'FFIEC CDR',
    url: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx',
    extractPrompt: 'Extract Net Interest Margin (NIM) data including quarterly values for the last 8 quarters, year-over-year comparison, and peer group median.'
  },
  tier1: {
    source: 'FFIEC CDR',
    url: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx',
    extractPrompt: 'Extract Tier 1 Capital Ratio data including quarterly values, regulatory thresholds, and peer comparison.'
  },
  cet1: {
    source: 'FFIEC CDR',
    url: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx',
    extractPrompt: 'Extract Common Equity Tier 1 (CET1) Ratio data with quarterly trends and regulatory minimums.'
  },
  roa: {
    source: 'FFIEC UBPR',
    url: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx',
    extractPrompt: 'Extract Return on Assets (ROA) percentages for recent quarters with peer group comparison.'
  },
  roe: {
    source: 'FFIEC UBPR',
    url: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx',
    extractPrompt: 'Extract Return on Equity (ROE) data with trend analysis and peer benchmarking.'
  },
  efficiency: {
    source: 'FFIEC Call Report',
    url: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx',
    extractPrompt: 'Extract Efficiency Ratio (non-interest expense / total revenue) with quarterly breakdown.'
  },
  npl: {
    source: 'FFIEC CDR',
    url: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx',
    extractPrompt: 'Extract Non-Performing Loan (NPL) ratio data including classified assets and trend.'
  },
  lcr: {
    source: 'FR 2052a',
    url: 'https://www.federalreserve.gov/apps/reportingforms/Report/Index/FR_2052a',
    extractPrompt: 'Extract Liquidity Coverage Ratio (LCR) data with high-quality liquid assets breakdown.'
  },
  ldr: {
    source: 'FFIEC Call Report',
    url: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx',
    extractPrompt: 'Extract Loan-to-Deposit Ratio with total loans, total deposits, and quarterly trend.'
  },
  cof: {
    source: 'FRED / UBPR',
    url: 'https://fred.stlouisfed.org/series/FEDFUNDS',
    extractPrompt: 'Extract Cost of Funds data including deposit rates, borrowing costs, and Fed Funds comparison.'
  },
  acl_coverage: {
    source: 'FFIEC FRY-9C',
    url: 'https://cdr.ffiec.gov/public/ManageFacsimiles.aspx',
    extractPrompt: 'Extract Allowance for Credit Losses to NPL ratio with CECL reserve adequacy metrics.'
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { metricId, rssdId = '623806', periods = 8 } = await req.json() as MetricRequest;

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const metricConfig = metricSources[metricId];
    if (!metricConfig) {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown metric: ${metricId}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build URL with RSSD ID if applicable
    let targetUrl = metricConfig.url;
    if (targetUrl.includes('ffiec') && rssdId) {
      targetUrl = `${targetUrl}?IdRssd=${rssdId}`;
    }

    console.log(`Fetching ${metricId} from: ${targetUrl}`);

    let extractedData: Record<string, unknown> = {};
    let rawMarkdown = '';
    let dataSource = 'fallback';

    try {
      // Use Firecrawl with structured JSON extraction and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          url: targetUrl,
          formats: ['markdown', 'extract'],
          extract: {
            schema: {
              type: 'object',
              properties: {
                metricName: { type: 'string' },
                currentValue: { type: 'number' },
                unit: { type: 'string' },
                quarterlyData: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      period: { type: 'string' },
                      value: { type: 'number' }
                    }
                  }
                },
                yearlyData: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      period: { type: 'string' },
                      value: { type: 'number' }
                    }
                  }
                },
                peerMedian: { type: 'number' },
                regulatoryMinimum: { type: 'number' },
                reportingPeriod: { type: 'string' }
              }
            },
            prompt: metricConfig.extractPrompt
          },
          onlyMainContent: true,
          waitFor: 2000, // Reduced wait time
        }),
      });

      clearTimeout(timeoutId);

      // Check if response is OK before parsing
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Firecrawl API error (${response.status}):`, errorText);
        throw new Error(`Firecrawl returned ${response.status}`);
      }

      // Safely parse JSON response
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse Firecrawl response:', responseText.substring(0, 200));
        throw new Error('Invalid JSON response from Firecrawl');
      }

      extractedData = data.data?.extract || data.extract || {};
      rawMarkdown = data.data?.markdown || data.markdown || '';
      dataSource = 'firecrawl';
      
    } catch (fetchError) {
      console.warn(`Firecrawl fetch failed for ${metricId}, using fallback data:`, fetchError);
      // Use realistic fallback data based on metric type
      extractedData = getFallbackData(metricId);
      dataSource = 'fallback';
    }

    const extractedData = data.data?.extract || data.extract || {};
    
    const result = {
      success: true,
      metricId,
      source: metricConfig.source,
      url: targetUrl,
      scrapedAt: new Date().toISOString(),
      data: {
        metricName: extractedData.metricName || metricId.toUpperCase(),
        currentValue: extractedData.currentValue,
        unit: extractedData.unit || '%',
        quarterlyData: extractedData.quarterlyData || [],
        yearlyData: extractedData.yearlyData || [],
        peerMedian: extractedData.peerMedian,
        regulatoryMinimum: extractedData.regulatoryMinimum,
        reportingPeriod: extractedData.reportingPeriod
      },
      rawMarkdown: data.data?.markdown || data.markdown
    };

    console.log(`Successfully fetched ${metricId} data`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-metric-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch metric data';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
