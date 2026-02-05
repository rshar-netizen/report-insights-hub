const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface FetchApiRequest {
  connectionId?: string;
  portal: 'ffiec' | 'fred' | 'sec' | 'fdic' | 'custom';
  sourceId?: string; // Identifies specific data source like 'ffiec-call-report'
  baseUrl?: string;
  endpoint?: string;
  rssdId?: string;
  certNumber?: string;
  cik?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
}

interface FetchResult {
  success: boolean;
  data: unknown;
  markdown?: string;
  metadata?: unknown;
  error?: string;
  dataAvailable?: boolean;
}

// Mizuho Bank USA identifiers
const MIZUHO_IDENTIFIERS = {
  certNumber: '21843',
  cik: '0001785149',
  ein: '81-3006831',
  rssdId: '623806',
  institutionName: 'Mizuho Bank (USA)'
};

// Build proper URLs for each data source
function buildSourceUrl(sourceId: string, portal: string): { url: string; description: string; requiresAuth: boolean } {
  const rssd = MIZUHO_IDENTIFIERS.rssdId;
  const cik = MIZUHO_IDENTIFIERS.cik;
  
  switch (sourceId) {
    // FFIEC Sources - Use RSSD ID type which is correct for these reports
    case 'ffiec-call-report':
      return {
        url: `https://cdr.ffiec.gov/Public/ManageFacsimiles.aspx?IdType=IDRSSD&ID=${rssd}&DS=Call`,
        description: 'FFIEC Call Report',
        requiresAuth: false
      };
    case 'ffiec-ubpr':
      return {
        url: `https://cdr.ffiec.gov/Public/ManageFacsimiles.aspx?IdType=IDRSSD&ID=${rssd}&DS=UBPR`,
        description: 'FFIEC UBPR',
        requiresAuth: false
      };
    case 'ffiec-fry9c':
      // FRY-9C is for bank holding companies
      return {
        url: `https://www.ffiec.gov/npw/Institution/Profile/${rssd}`,
        description: 'FFIEC Institution Profile',
        requiresAuth: false
      };
    
    // FDIC Sources  
    case 'fdic-sod':
      return {
        url: `https://banks.data.fdic.gov/api/sod?filters=CERT:${cert}&fields=STNAME,SIMS_LATITUDE,SIMS_LONGITUDE,DEPSUMBR,BKCLASS,YEAR&limit=100&format=json`,
        description: 'FDIC Summary of Deposits',
        requiresAuth: false
      };
    case 'fdic-financials':
      return {
        url: `https://banks.data.fdic.gov/api/financials?filters=CERT:${cert}&fields=ASSET,DEP,NETINC,EQ,ROA,ROE,NIMY,YEAR,REPDTE&sort_by=REPDTE&sort_order=DESC&limit=20&format=json`,
        description: 'FDIC Institution Financials',
        requiresAuth: false
      };
    
    // SEC Sources
    case 'sec-10k':
      return {
        url: `https://data.sec.gov/submissions/CIK${cik}.json`,
        description: 'SEC Filings (10-K)',
        requiresAuth: false
      };
    case 'sec-10q':
      return {
        url: `https://data.sec.gov/submissions/CIK${cik}.json`,
        description: 'SEC Filings (10-Q)',
        requiresAuth: false
      };
    
    // FRED Sources (require API key)
    case 'fred-rates':
      return {
        url: 'https://api.stlouisfed.org/fred/series/observations',
        description: 'Federal Reserve Interest Rates',
        requiresAuth: true
      };
    case 'fred-economic':
      return {
        url: 'https://api.stlouisfed.org/fred/series/observations',
        description: 'Economic Indicators',
        requiresAuth: true
      };
    
    default:
      return {
        url: '',
        description: 'Unknown source',
        requiresAuth: false
      };
  }
}

// Fetch from FDIC API (JSON)
async function fetchFdicData(sourceId: string): Promise<FetchResult> {
  const { url, description } = buildSourceUrl(sourceId, 'fdic');
  
  console.log(`Fetching FDIC data: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: `FDIC API returned ${response.status}`,
        dataAvailable: false
      };
    }
    
    const data = await response.json();
    
    // FDIC API returns nested structure: data.data[].data.FIELD
    const rawRecords = data.data || [];
    // Extract the actual data from nested structure
    const records = rawRecords.map((item: { data?: Record<string, unknown> }) => item.data || item);
    const hasData = records.length > 0;
    
    if (!hasData) {
      return {
        success: true,
        data: data,
        markdown: `# ${description}\n\nNo data found for Cert #${MIZUHO_IDENTIFIERS.certNumber}`,
        dataAvailable: false,
        metadata: { source: 'fdic', url }
      };
    }
    
    // Format the data as markdown
    let markdown = `# ${description}\n\n**Institution:** ${MIZUHO_IDENTIFIERS.institutionName}\n**Cert Number:** ${MIZUHO_IDENTIFIERS.certNumber}\n\n`;
    
    if (sourceId === 'fdic-financials') {
      markdown += `## Financial Data (Most Recent Periods)\n\n`;
      markdown += `| Period | Total Assets | Deposits | Net Income | Equity | ROA | ROE | NIM |\n`;
      markdown += `|--------|-------------|----------|------------|--------|-----|-----|-----|\n`;
      
      records.slice(0, 8).forEach((r: Record<string, unknown>) => {
        const repDate = r.REPDTE ? String(r.REPDTE) : 'N/A';
        const asset = typeof r.ASSET === 'number' ? r.ASSET : 0;
        const dep = typeof r.DEP === 'number' ? r.DEP : 0;
        const netinc = typeof r.NETINC === 'number' ? r.NETINC : 0;
        const eq = typeof r.EQ === 'number' ? r.EQ : 0;
        const roa = r.ROA !== undefined ? Number(r.ROA).toFixed(2) : 'N/A';
        const roe = r.ROE !== undefined ? Number(r.ROE).toFixed(2) : 'N/A';
        const nimy = r.NIMY !== undefined ? Number(r.NIMY).toFixed(2) : 'N/A';
        markdown += `| ${repDate} | $${formatNumber(asset)}K | $${formatNumber(dep)}K | $${formatNumber(netinc)}K | $${formatNumber(eq)}K | ${roa}% | ${roe}% | ${nimy}% |\n`;
      });
    } else if (sourceId === 'fdic-sod') {
      markdown += `## Summary of Deposits by Branch\n\n`;
      markdown += `| State | Deposits | Year |\n`;
      markdown += `|-------|----------|------|\n`;
      
      records.slice(0, 20).forEach((r: Record<string, unknown>) => {
        const depsumbr = typeof r.DEPSUMBR === 'number' ? r.DEPSUMBR : 0;
        markdown += `| ${r.STNAME || 'N/A'} | $${formatNumber(depsumbr)}K | ${r.YEAR || 'N/A'} |\n`;
      });
    }
    
    return {
      success: true,
      data: data,
      markdown,
      dataAvailable: true,
      metadata: { source: 'fdic', url, recordCount: records.length }
    };
    
  } catch (error) {
    console.error('FDIC fetch error:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'FDIC fetch failed',
      dataAvailable: false
    };
  }
}

// Fetch from SEC API (JSON)
async function fetchSecData(sourceId: string): Promise<FetchResult> {
  const { url, description } = buildSourceUrl(sourceId, 'sec');
  
  console.log(`Fetching SEC data: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'Regulatory Intelligence Platform research@example.com'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: true,
          data: null,
          markdown: `# ${description}\n\nNo SEC filings found for CIK ${MIZUHO_IDENTIFIERS.cik}. This may indicate the entity is not an SEC registrant or files under a different identifier.`,
          dataAvailable: false,
          metadata: { source: 'sec', url, status: 404 }
        };
      }
      return {
        success: false,
        data: null,
        error: `SEC API returned ${response.status}`,
        dataAvailable: false
      };
    }
    
    const data = await response.json();
    
    // Extract filing information
    const filings = data.filings?.recent;
    const hasFilings = filings && filings.form && filings.form.length > 0;
    
    let markdown = `# ${description}\n\n**Company:** ${data.name || MIZUHO_IDENTIFIERS.institutionName}\n**CIK:** ${MIZUHO_IDENTIFIERS.cik}\n\n`;
    
    if (!hasFilings) {
      markdown += `No recent filings found.`;
      return {
        success: true,
        data: data,
        markdown,
        dataAvailable: false,
        metadata: { source: 'sec', url }
      };
    }
    
    // Filter for relevant forms
    const targetForm = sourceId === 'sec-10k' ? '10-K' : '10-Q';
    const relevantFilings: { form: string; date: string; accession: string }[] = [];
    
    for (let i = 0; i < Math.min(filings.form.length, 100); i++) {
      if (filings.form[i] === targetForm || filings.form[i].includes(targetForm)) {
        relevantFilings.push({
          form: filings.form[i],
          date: filings.filingDate[i],
          accession: filings.accessionNumber[i]
        });
      }
    }
    
    if (relevantFilings.length === 0) {
      markdown += `No ${targetForm} filings found in recent submissions.\n\n`;
      markdown += `## Available Filing Types:\n`;
      const uniqueForms = [...new Set(filings.form.slice(0, 20))];
      uniqueForms.forEach((form: string) => {
        markdown += `- ${form}\n`;
      });
    } else {
      markdown += `## Recent ${targetForm} Filings\n\n`;
      markdown += `| Form | Filing Date | Accession Number |\n`;
      markdown += `|------|-------------|------------------|\n`;
      
      relevantFilings.slice(0, 10).forEach(f => {
        markdown += `| ${f.form} | ${f.date} | ${f.accession} |\n`;
      });
    }
    
    return {
      success: true,
      data: data,
      markdown,
      dataAvailable: relevantFilings.length > 0,
      metadata: { source: 'sec', url, filingCount: relevantFilings.length }
    };
    
  } catch (error) {
    console.error('SEC fetch error:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'SEC fetch failed',
      dataAvailable: false
    };
  }
}

// Fetch from FRED API (requires API key)
async function fetchFredData(sourceId: string): Promise<FetchResult> {
  const fredApiKey = Deno.env.get('FRED_API_KEY');
  
  if (!fredApiKey) {
    return {
      success: false,
      data: null,
      error: 'FRED_API_KEY not configured. Add the API key in Settings to fetch economic data.',
      dataAvailable: false,
      metadata: { source: 'fred', requiresApiKey: true }
    };
  }
  
  // Define series based on sourceId
  const seriesMap: Record<string, { series: string[]; name: string }> = {
    'fred-rates': {
      series: ['FEDFUNDS', 'DGS10', 'DGS2', 'DGS30'],
      name: 'Interest Rates'
    },
    'fred-economic': {
      series: ['GDP', 'UNRATE', 'CPIAUCSL'],
      name: 'Economic Indicators'
    }
  };
  
  const config = seriesMap[sourceId] || seriesMap['fred-rates'];
  
  let markdown = `# FRED ${config.name}\n\n`;
  const allData: Record<string, unknown> = {};
  
  try {
    for (const seriesId of config.series) {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${fredApiKey}&file_type=json&sort_order=desc&limit=5`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        allData[seriesId] = data.observations || [];
        
        markdown += `## ${seriesId}\n\n`;
        if (data.observations && data.observations.length > 0) {
          markdown += `| Date | Value |\n|------|-------|\n`;
          data.observations.slice(0, 5).forEach((obs: { date: string; value: string }) => {
            markdown += `| ${obs.date} | ${obs.value} |\n`;
          });
        }
        markdown += '\n';
      }
    }
    
    return {
      success: true,
      data: allData,
      markdown,
      dataAvailable: Object.keys(allData).length > 0,
      metadata: { source: 'fred', series: config.series }
    };
    
  } catch (error) {
    console.error('FRED fetch error:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'FRED fetch failed',
      dataAvailable: false
    };
  }
}

// Fetch from FFIEC using Firecrawl (web scraping)
async function fetchFfiecData(sourceId: string): Promise<FetchResult> {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  const { url, description } = buildSourceUrl(sourceId, 'ffiec');
  
  console.log(`Fetching FFIEC data: ${url}`);
  
  if (!firecrawlKey) {
    return {
      success: false,
      data: null,
      error: 'Firecrawl connector not configured for web scraping',
      dataAvailable: false
    };
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });
    
    clearTimeout(timeoutId);
    
    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error(`Firecrawl error (${scrapeResponse.status}):`, errorText.substring(0, 200));
      return {
        success: false,
        data: null,
        error: `Scraping failed: ${scrapeResponse.status}`,
        dataAvailable: false
      };
    }
    
    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    
    // Check if we got error page content - look for specific error indicators
    const isErrorPage = markdown.includes('invalid financial institution') || 
                        markdown.includes('Invalid ID') ||
                        markdown.includes('Error:') ||
                        markdown.includes('No data found') ||
                        markdown.includes('requested report query includes an invalid') ||
                        (markdown.length < 500 && !markdown.includes('Call Report') && !markdown.includes('UBPR'));
    
    if (isErrorPage) {
      return {
        success: true,
        data: scrapeData,
        markdown: `# ${description}\n\n**Status:** Data not available via direct API.\n\n**Note:** The FFIEC portal requires authenticated access or specific report parameters. This source may need manual download from [FFIEC CDR](https://cdr.ffiec.gov).\n\n**Institution:** ${MIZUHO_IDENTIFIERS.institutionName} (RSSD: ${MIZUHO_IDENTIFIERS.rssdId})`,
        dataAvailable: false,
        metadata: { source: 'ffiec', url, isErrorPage: true }
      };
    }
    
    return {
      success: true,
      data: scrapeData.data || {},
      markdown: `# ${description}\n\n**Institution:** ${MIZUHO_IDENTIFIERS.institutionName}\n**RSSD ID:** ${MIZUHO_IDENTIFIERS.rssdId}\n\n${markdown}`,
      dataAvailable: true,
      metadata: { source: 'ffiec', url }
    };
    
  } catch (error) {
    console.error('FFIEC fetch error:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'FFIEC fetch failed',
      dataAvailable: false
    };
  }
}

// Helper function to format numbers
function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return 'N/A';
  if (typeof num !== 'number') return String(num);
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { portal, sourceId, endpoint } = await req.json() as FetchApiRequest;
    
    console.log(`Fetch request - Portal: ${portal}, SourceId: ${sourceId || 'none'}`);
    
    let result: FetchResult;
    
    // Route to appropriate fetcher based on portal/sourceId
    if (sourceId) {
      if (sourceId.startsWith('fdic-')) {
        result = await fetchFdicData(sourceId);
      } else if (sourceId.startsWith('sec-')) {
        result = await fetchSecData(sourceId);
      } else if (sourceId.startsWith('fred-')) {
        result = await fetchFredData(sourceId);
      } else if (sourceId.startsWith('ffiec-')) {
        result = await fetchFfiecData(sourceId);
      } else {
        result = {
          success: false,
          data: null,
          error: `Unknown source: ${sourceId}`,
          dataAvailable: false
        };
      }
    } else {
      // Legacy portal-based routing
      switch (portal) {
        case 'fdic':
          result = await fetchFdicData('fdic-financials');
          break;
        case 'sec':
          result = await fetchSecData('sec-10k');
          break;
        case 'fred':
          result = await fetchFredData('fred-rates');
          break;
        case 'ffiec':
          result = await fetchFfiecData('ffiec-call-report');
          break;
        default:
          result = {
            success: false,
            data: null,
            error: `Unknown portal: ${portal}`,
            dataAvailable: false
          };
      }
    }
    
    console.log(`Fetch complete - Success: ${result.success}, DataAvailable: ${result.dataAvailable}`);

    return new Response(
      JSON.stringify({
        ...result,
        portal,
        sourceId,
        institution: MIZUHO_IDENTIFIERS,
        fetchedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-api-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch API data';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, dataAvailable: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
