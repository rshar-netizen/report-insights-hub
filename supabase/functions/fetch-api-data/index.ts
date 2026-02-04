const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface FetchApiRequest {
  connectionId?: string;
  portal: 'ffiec' | 'fred' | 'sec' | 'fdic' | 'custom';
  baseUrl?: string;
  endpoint?: string;
  rssdId?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
}

// Portal configurations
const portalConfigs: Record<string, { baseUrl: string; endpoints: Record<string, string> }> = {
  ffiec: {
    baseUrl: 'https://cdr.ffiec.gov/public',
    endpoints: {
      callReport: '/ManageFacsimiles.aspx',
      ubpr: '/ManageFacsimiles.aspx',
      nicSearch: '/NIC/NICSearchProxy.aspx',
    }
  },
  fred: {
    baseUrl: 'https://api.stlouisfed.org/fred',
    endpoints: {
      series: '/series/observations',
      search: '/series/search',
    }
  },
  sec: {
    baseUrl: 'https://www.sec.gov/cgi-bin',
    endpoints: {
      edgar: '/browse-edgar',
      filings: '/srch-ia',
    }
  },
  fdic: {
    baseUrl: 'https://banks.data.fdic.gov/api',
    endpoints: {
      institutions: '/institutions',
      sod: '/sod',
      financials: '/financials',
    }
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { portal, baseUrl, endpoint, rssdId, apiKey, headers, queryParams } = await req.json() as FetchApiRequest;

    // Use Firecrawl for web scraping if configured
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    let targetUrl: string;
    let config = portalConfigs[portal];

    if (portal === 'custom') {
      if (!baseUrl) {
        return new Response(
          JSON.stringify({ success: false, error: 'Base URL required for custom API' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      targetUrl = endpoint ? `${baseUrl}${endpoint}` : baseUrl;
    } else if (config) {
      const endpointPath = endpoint || Object.values(config.endpoints)[0];
      targetUrl = `${config.baseUrl}${endpointPath}`;
    } else {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown portal: ${portal}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query string
    const params = new URLSearchParams(queryParams || {});
    if (rssdId) params.set('IdRssd', rssdId);
    if (portal === 'fred' && apiKey) params.set('api_key', apiKey);
    
    const fullUrl = params.toString() ? `${targetUrl}?${params}` : targetUrl;
    
    console.log(`Fetching from ${portal}: ${fullUrl}`);

    let result: { success: boolean; data: unknown; markdown?: string; metadata?: unknown };

    // Use Firecrawl for scraping if available
    if (firecrawlKey && (portal === 'ffiec' || portal === 'sec')) {
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: fullUrl,
          formats: ['markdown', 'extract'],
          extract: {
            schema: {
              type: 'object',
              properties: {
                institutionName: { type: 'string' },
                rssdId: { type: 'string' },
                reportingPeriod: { type: 'string' },
                metrics: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      value: { type: 'string' },
                      period: { type: 'string' }
                    }
                  }
                },
                tables: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      data: { type: 'string' }
                    }
                  }
                }
              }
            },
            prompt: 'Extract financial metrics, institution details, and any tabular data from this regulatory report page.'
          },
          onlyMainContent: true,
          waitFor: 3000,
        }),
      });

      const scrapeData = await scrapeResponse.json();
      
      if (!scrapeResponse.ok) {
        console.error('Firecrawl error:', scrapeData);
        return new Response(
          JSON.stringify({ success: false, error: scrapeData.error || 'Failed to scrape page' }),
          { status: scrapeResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      result = {
        success: true,
        data: scrapeData.data?.extract || scrapeData.extract || {},
        markdown: scrapeData.data?.markdown || scrapeData.markdown,
        metadata: scrapeData.data?.metadata || scrapeData.metadata
      };
    } else {
      // Direct API call for FRED, FDIC, or custom APIs
      const fetchHeaders: Record<string, string> = {
        'Accept': 'application/json',
        ...headers,
      };
      
      if (apiKey && portal !== 'fred') {
        fetchHeaders['Authorization'] = `Bearer ${apiKey}`;
      }

      const apiResponse = await fetch(fullUrl, {
        method: 'GET',
        headers: fetchHeaders,
      });

      const contentType = apiResponse.headers.get('content-type') || '';
      let responseData;
      
      if (contentType.includes('application/json')) {
        responseData = await apiResponse.json();
      } else {
        responseData = await apiResponse.text();
      }

      if (!apiResponse.ok) {
        console.error('API error:', apiResponse.status, responseData);
        return new Response(
          JSON.stringify({ success: false, error: `API request failed: ${apiResponse.status}` }),
          { status: apiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      result = {
        success: true,
        data: responseData,
        metadata: {
          status: apiResponse.status,
          contentType,
          url: fullUrl
        }
      };
    }

    console.log(`Successfully fetched data from ${portal}`);

    return new Response(
      JSON.stringify({
        ...result,
        portal,
        fetchedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-api-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch API data';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
