const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PeerRequest {
  peers: { rssdId: string; certNumber?: string; name: string }[];
}

interface PeerMetrics {
  rssdId: string;
  name: string;
  certNumber?: string;
  period?: string;
  metrics: {
    roa?: number;
    roe?: number;
    nim?: number;
    efficiency?: number;
    npl?: number;
    tier1?: number;
    cet1?: number;
    lcr?: number;
    totalAssets?: number;
  };
  source: string;
  fetchedAt: string;
  error?: string;
}

// Map from RSSD ID to FDIC cert number for known banks
const KNOWN_CERT_NUMBERS: Record<string, string> = {
  '852218': '628',     // JPMorgan Chase Bank
  '480228': '3510',    // Bank of America
  '476810': '7213',    // Citibank
  '451965': '3511',    // Wells Fargo Bank
  '2182786': '33124',  // Goldman Sachs Bank USA
  '1456501': '32992',  // Morgan Stanley Bank
  '504713': '6548',    // U.S. Bank
  '817824': '6384',    // PNC Bank
  '852320': '9846',    // Truist Bank (formerly BB&T)
  '497404': '24838',   // TD Bank
  '413208': '57890',   // HSBC Bank USA
  '134687': '32536',   // MUFG Union Bank
  '623806': '21843',   // Mizuho Bank (USA)
};

async function fetchFdicFinancials(rssdId: string, certNumber?: string): Promise<{
  metrics: PeerMetrics['metrics'];
  period?: string;
  error?: string;
}> {
  // Try cert number first (more reliable), then RSSD
  const cert = certNumber || KNOWN_CERT_NUMBERS[rssdId];
  
  if (!cert) {
    // Try lookup by RSSD through FDIC institutions API
    try {
      const lookupUrl = `https://banks.data.fdic.gov/api/financials?filters=RSSDID:${rssdId}&fields=CERT,REPNM,ASSET,DEP,NETINC,EQ,ROA,ROE,NIMY,EEFFR,NCLNLSR,IDT1RWAJR,RBCRWAJ,REPDTE&sort_by=REPDTE&sort_order=DESC&limit=1&format=json`;
      
      const response = await fetch(lookupUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      
      if (response.ok) {
        const data = await response.json();
        const records = (data.data || []).map((item: { data?: Record<string, unknown> }) => item.data || item);
        
        if (records.length > 0) {
          const r = records[0];
          return {
            metrics: extractMetrics(r),
            period: formatPeriod(r.REPDTE),
          };
        }
      }
    } catch (e) {
      console.error(`FDIC RSSD lookup failed for ${rssdId}:`, e);
    }
    
    return { metrics: {}, error: `No cert number found for RSSD ${rssdId}` };
  }

  const url = `https://banks.data.fdic.gov/api/financials?filters=CERT:${cert}&fields=REPNM,ASSET,DEP,NETINC,EQ,ROA,ROE,NIMY,EEFFR,NCLNLSR,IDT1RWAJR,RBCRWAJ,REPDTE&sort_by=REPDTE&sort_order=DESC&limit=1&format=json`;
  
  console.log(`Fetching FDIC data for cert ${cert} (RSSD: ${rssdId})`);
  
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    
    if (!response.ok) {
      return { metrics: {}, error: `FDIC API returned ${response.status}` };
    }
    
    const data = await response.json();
    const records = (data.data || []).map((item: { data?: Record<string, unknown> }) => item.data || item);
    
    if (records.length === 0) {
      return { metrics: {}, error: 'No financial data found' };
    }
    
    const r = records[0];
    return {
      metrics: extractMetrics(r),
      period: formatPeriod(r.REPDTE),
    };
    
  } catch (error) {
    console.error(`FDIC fetch error for cert ${cert}:`, error);
    return {
      metrics: {},
      error: error instanceof Error ? error.message : 'FDIC fetch failed',
    };
  }
}

function extractMetrics(r: Record<string, unknown>): PeerMetrics['metrics'] {
  return {
    roa: safeNumber(r.ROA),
    roe: safeNumber(r.ROE),
    nim: safeNumber(r.NIMY),
    efficiency: safeNumber(r.EEFFR),
    npl: safeNumber(r.NCLNLSR),
    tier1: safeNumber(r.IDT1RWAJR),
    cet1: undefined, // FDIC doesn't directly expose CET1 in basic financials
    lcr: undefined,  // LCR not in FDIC basic financials
    totalAssets: safeNumber(r.ASSET),
  };
}

function safeNumber(val: unknown): number | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

function formatPeriod(repdte: unknown): string | undefined {
  if (!repdte) return undefined;
  const s = String(repdte);
  // FDIC format: YYYYMMDD or similar
  if (s.length === 8) {
    const year = s.substring(0, 4);
    const month = parseInt(s.substring(4, 6));
    const quarter = Math.ceil(month / 3);
    return `Q${quarter} ${year}`;
  }
  return s;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { peers } = await req.json() as PeerRequest;
    
    if (!peers || !Array.isArray(peers) || peers.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'peers array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit to 12 peers max
    const limitedPeers = peers.slice(0, 12);
    
    console.log(`Fetching metrics for ${limitedPeers.length} peers`);
    
    // Fetch all peers in parallel
    const results: PeerMetrics[] = await Promise.all(
      limitedPeers.map(async (peer) => {
        const { metrics, period, error } = await fetchFdicFinancials(peer.rssdId, peer.certNumber);
        return {
          rssdId: peer.rssdId,
          name: peer.name,
          certNumber: peer.certNumber || KNOWN_CERT_NUMBERS[peer.rssdId],
          period,
          metrics,
          source: 'FDIC BankFind',
          fetchedAt: new Date().toISOString(),
          error,
        };
      })
    );
    
    const successCount = results.filter(r => !r.error && Object.values(r.metrics).some(v => v !== undefined)).length;
    
    console.log(`Fetched ${successCount}/${limitedPeers.length} peers successfully`);
    
    return new Response(
      JSON.stringify({
        success: true,
        results,
        fetchedAt: new Date().toISOString(),
        successCount,
        totalRequested: limitedPeers.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-peer-metrics:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch peer metrics' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
