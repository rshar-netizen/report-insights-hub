import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ChatRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  reportIds?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, reportIds } = await req.json() as ChatRequest;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch report context if report IDs provided
    let reportContext = '';
    if (reportIds && reportIds.length > 0) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch reports and their insights
      const { data: reports } = await supabase
        .from('ingested_reports')
        .select('id, name, report_type, institution_name, reporting_period, raw_content')
        .in('id', reportIds);

      const { data: insights } = await supabase
        .from('report_insights')
        .select('*')
        .in('report_id', reportIds);

      if (reports && reports.length > 0) {
        reportContext = `\n\nCONTEXT FROM INGESTED REPORTS:\n`;
        for (const report of reports) {
          reportContext += `\n--- Report: ${report.name} (${report.report_type}) ---\n`;
          reportContext += `Institution: ${report.institution_name || 'Unknown'}\n`;
          reportContext += `Period: ${report.reporting_period || 'Not specified'}\n`;
          
          // Add relevant insights
          const reportInsights = insights?.filter(i => i.report_id === report.id) || [];
          if (reportInsights.length > 0) {
            reportContext += `\nKey Insights:\n`;
            for (const insight of reportInsights) {
              reportContext += `- ${insight.title}: ${insight.content}\n`;
            }
          }
          
          // Add truncated raw content for RAG
          if (report.raw_content) {
            reportContext += `\nReport Content (excerpt):\n${report.raw_content.slice(0, 10000)}\n`;
          }
        }
      }
    }

    const systemPrompt = `You are a knowledgeable financial analyst assistant specializing in US banking regulatory reports and financial metrics.

You help users understand:
- Call Reports, UBPR, and FRY-9C filings
- Capital adequacy metrics (CET1, Tier 1, Total Capital ratios)
- Liquidity metrics (LCR, NSFR, Loan-to-Deposit ratio)
- Profitability metrics (NIM, ROA, ROE, Efficiency Ratio)
- Asset quality metrics (NPL ratio, ACL Coverage)
- Regulatory compliance requirements

When answering questions:
1. Be precise and cite specific metrics when available
2. Explain regulatory thresholds and their significance
3. Provide context about trends and peer comparisons
4. Highlight any areas of concern or strength
5. Reference the specific reports when applicable

Keep responses concise but comprehensive. Use bullet points for clarity.${reportContext}`;

    console.log(`Processing chat with ${messages.length} messages, ${reportIds?.length || 0} reports in context`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted. Please add funds to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Chat service unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Stream the response back
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Error in data-chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Chat failed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
