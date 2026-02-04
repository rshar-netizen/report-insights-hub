const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ScrapeRequest {
  source: 'ffiec' | 'fred' | 'sec' | 'fdic';
  rssdId?: string;
  metric?: string;
  bankName?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { source, rssdId, metric, bankName } = await req.json() as ScrapeRequest;

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let url = '';
    let extractionPrompt = '';

    switch (source) {
      case 'ffiec':
        // FFIEC Central Data Repository - UBPR and Call Reports
        url = rssdId 
          ? `https://cdr.ffiec.gov/public/ManageFacsimiles.aspx?IdRssd=${rssdId}`
          : 'https://cdr.ffiec.gov/public/PWS/DownloadBulkData.aspx';
        extractionPrompt = `Extract all financial metrics including Tier 1 Capital Ratio, CET1 Ratio, Net Interest Margin, Return on Assets, Return on Equity, Efficiency Ratio, NPL Ratio, and Liquidity Coverage Ratio. Include the reporting period and institution name.`;
        break;

      case 'fred':
        // Federal Reserve Economic Data - Interest rates and economic indicators
        const fredSeriesMap: Record<string, string> = {
          'fed_funds': 'FEDFUNDS',
          'treasury_10y': 'GS10',
          'treasury_2y': 'GS2',
          'unemployment': 'UNRATE',
          'gdp': 'GDP',
          'inflation': 'CPIAUCSL'
        };
        const series = metric ? fredSeriesMap[metric] || 'FEDFUNDS' : 'FEDFUNDS';
        url = `https://fred.stlouisfed.org/series/${series}`;
        extractionPrompt = `Extract the latest value, date, previous values for the last 8 quarters, percentage change, and any trend information for this economic indicator.`;
        break;

      case 'sec':
        // SEC EDGAR - 10-K and 10-Q filings
        const cik = bankName ? bankName.replace(/\s+/g, '+') : 'Mizuho';
        url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${cik}&type=10-K&dateb=&owner=include&count=10`;
        extractionPrompt = `Extract filing dates, form types (10-K, 10-Q), document links, and key financial highlights from the most recent filings.`;
        break;

      case 'fdic':
        // FDIC Summary of Deposits
        url = rssdId 
          ? `https://www7.fdic.gov/sod/sodInstBranch.asp?baression=${rssdId}`
          : 'https://www7.fdic.gov/sod/sodInstBranchFind.asp';
        extractionPrompt = `Extract total deposits by branch, market share data, deposit trends by region, and any comparative market data.`;
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown source: ${source}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`Scraping ${source} from URL: ${url}`);

    // Use Firecrawl to scrape with JSON extraction
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', { type: 'json', prompt: extractionPrompt }],
        onlyMainContent: true,
        waitFor: 3000, // Wait for dynamic content
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.error || `Request failed with status ${response.status}`,
          source,
          url
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully scraped ${source}`);

    // Parse and structure the response
    const structuredData = {
      success: true,
      source,
      url,
      scrapedAt: new Date().toISOString(),
      data: data.data?.json || data.json || null,
      markdown: data.data?.markdown || data.markdown || null,
      metadata: data.data?.metadata || data.metadata || null
    };

    return new Response(
      JSON.stringify(structuredData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-regulatory-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape data';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
