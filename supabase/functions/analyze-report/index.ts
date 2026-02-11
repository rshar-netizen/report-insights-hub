import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.94.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AnalyzeRequest {
  reportId: string;
  content?: string;
  filePath?: string;
  reportType: string;
  institutionName?: string;
  reportingPeriod?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportId, content: providedContent, filePath, reportType, institutionName, reportingPeriod } = await req.json() as AnalyzeRequest;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resolve content: use provided content, or read from storage
    let content = providedContent || '';
    
    if ((!content || content.length < 100) && filePath) {
      console.log(`Reading file from storage: ${filePath}`);
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: fileData, error: fileError } = await supabase.storage
        .from('reports')
        .download(filePath);
      
      if (fileError) {
        console.error('Failed to download file from storage:', fileError);
        return new Response(
          JSON.stringify({ success: false, error: `Could not read file from storage: ${fileError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Extract text from the file
      if (filePath.endsWith('.pdf')) {
        // For PDFs, convert to text - use the raw bytes as text extraction
        // The AI model can work with raw PDF text content
        const arrayBuffer = await fileData.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        // Extract readable text from PDF bytes
        const rawText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
        // Filter to printable ASCII and common unicode, clean up binary noise
        content = rawText
          .replace(/[^\x20-\x7E\n\r\t\u00A0-\u024F]/g, ' ')
          .replace(/\s{3,}/g, '  ')
          .trim();
        console.log(`Extracted ${content.length} chars from PDF`);
      } else {
        content = await fileData.text();
      }
      
      if (!content || content.length < 50) {
        return new Response(
          JSON.stringify({ success: false, error: 'Could not extract readable content from the file. Try uploading as CSV or text format.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Analyzing report: ${reportId}, type: ${reportType}, content length: ${content.length}`);

    const systemPrompt = `You are a senior financial analyst specializing in US banking regulatory reports. 
You analyze regulatory filings including Call Reports, UBPR, FRY-9C, Summary of Deposits, and SEC filings.

Your task is to extract key insights from the provided report content and generate structured analysis.

CRITICAL RULES:
- ONLY generate insights that contain SPECIFIC data, numbers, percentages, or concrete findings from the report.
- NEVER generate placeholder or template insights like "[Analysis of ...]" or "Analysis of the bank's solvency..."
- If the report doesn't contain enough data for a category, SKIP that category entirely.
- Every insight MUST contain at least one specific data point, metric, or actionable finding.
- Use descriptive, specific titles (e.g., "NIM Improved to 2.27% in Q3" not just "Net Interest Margin Trends").
- Content must be 2+ sentences with real analysis, not generic descriptions of what could be analyzed.

For each report, provide insights in these categories (only if substantive data exists):
1. EXECUTIVE SUMMARY: 2-3 sentences with specific findings and numbers
2. KEY METRICS: Extract actual metric values found in the report
3. RISK ASSESSMENT: Specific risks with supporting data points
4. TRENDS: Concrete period-over-period changes with numbers
5. RECOMMENDATIONS: Actionable steps tied to specific findings

BALANCE SHEET EXTRACTION (CRITICAL):
For UBPR, Call Reports, and FRY-9C, you MUST extract actual dollar amounts for balance sheet line items into the "metrics" object. 
Look for the Balance Sheet section and extract these fields (values should be in raw dollars, NOT thousands or millions — convert if the report shows values in thousands by multiplying by 1000):
- "total_loans": Total loans and leases
- "total_securities": Total securities (investment securities)
- "cash_and_due": Cash and balances due from depository institutions
- "trading_assets": Trading assets (if applicable)
- "other_assets": Other assets / intangibles / all remaining asset categories
- "total_deposits": Total deposits
- "total_borrowings": Total borrowings (fed funds, repos, FHLB, other borrowed money)
- "subordinated_debt": Subordinated notes and debentures
- "other_liabilities": Other liabilities
- "total_equity": Total equity capital
- "total_liabilities": Total liabilities
- "total_assets": Total assets

These are ACTUAL reported dollar amounts from the balance sheet, not ratios. Extract them precisely.

ADDITIONAL RULES:
- Focus on data from 2015 onwards. Do NOT generate insights about trends or data exclusively before 2015.
- For EACH insight, include a "sources" object with:
  - "reference": A specific location in the report (e.g., "Page 3", "Schedule RC-R", "Table 4.1")
  - "section": The report section name (e.g., "Interest Income", "Capital Adequacy", "Deposit Composition")
  If you cannot determine the exact page/section, provide the most specific reference you can (e.g., "Balance Sheet section", "Income Statement").

Format your response as JSON with this structure:
{
  "insights": [
    {
      "type": "summary",
      "category": "general",
      "title": "Descriptive Title With Key Finding",
      "content": "Substantive analysis with specific numbers...",
      "sources": {"reference": "Page 1-2", "section": "Executive Overview"},
      "confidence": 0.95
    },
    {
      "type": "metric_extraction",
      "category": "capital",
      "title": "Strong Capital Position at 14.8% Tier 1",
      "content": "Detailed analysis with extracted values...",
      "metrics": {
        "tier1_capital_ratio": 14.8, 
        "cet1_ratio": 13.2,
        "total_assets": 24500000000,
        "total_loans": 11000000000,
        "total_securities": 5200000000,
        "total_deposits": 15800000000,
        "total_equity": 2800000000,
        "total_borrowings": 3200000000,
        "total_liabilities": 21700000000
      },
      "sources": {"reference": "Schedule RC", "section": "Balance Sheet"},
      "confidence": 0.9
    }
  ]
}`;

    const userPrompt = `Analyze the following ${reportType} report${institutionName ? ` for ${institutionName}` : ''}${reportingPeriod ? ` (${reportingPeriod})` : ''}:

${content.slice(0, 50000)}

Provide comprehensive analysis following the JSON structure specified.`;

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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
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
        JSON.stringify({ success: false, error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || '';

    // Parse the JSON response from AI
    let insights = [];
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      const parsed = JSON.parse(jsonStr);
      insights = parsed.insights || [];
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback: create a summary insight from raw content
      insights = [{
        type: 'summary',
        category: 'general',
        title: 'AI Analysis',
        content: aiContent.slice(0, 2000),
        confidence: 0.7
      }];
    }

    console.log(`Generated ${insights.length} insights for report ${reportId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        reportId,
        insights,
        analyzedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze report';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
