const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AnalyzeRequest {
  reportId: string;
  content: string;
  reportType: string;
  institutionName?: string;
  reportingPeriod?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportId, content, reportType, institutionName, reportingPeriod } = await req.json() as AnalyzeRequest;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing report: ${reportId}, type: ${reportType}`);

    const systemPrompt = `You are a senior financial analyst specializing in US banking regulatory reports. 
You analyze regulatory filings including Call Reports, UBPR, FRY-9C, Summary of Deposits, and SEC filings.

Your task is to extract key insights from the provided report content and generate structured analysis.

For each report, provide:
1. EXECUTIVE SUMMARY: A 2-3 sentence high-level summary of the report's key findings
2. KEY METRICS: Extract specific financial metrics with their values (e.g., Tier 1 Capital Ratio: 12.5%)
3. RISK ASSESSMENT: Identify any risk factors, regulatory concerns, or areas requiring attention
4. TRENDS: Note any significant changes compared to prior periods if mentioned
5. RECOMMENDATIONS: Actionable insights for management

Format your response as JSON with this structure:
{
  "insights": [
    {
      "type": "summary",
      "category": "general",
      "title": "Executive Summary",
      "content": "...",
      "confidence": 0.95
    },
    {
      "type": "metric_extraction",
      "category": "capital",
      "title": "Capital Metrics",
      "content": "...",
      "metrics": {"tier1_ratio": 12.5, "cet1_ratio": 11.2},
      "confidence": 0.9
    },
    {
      "type": "risk_assessment",
      "category": "asset_quality",
      "title": "Credit Risk Analysis",
      "content": "...",
      "confidence": 0.85
    },
    {
      "type": "trend_analysis",
      "category": "profitability",
      "title": "Profitability Trends",
      "content": "...",
      "confidence": 0.8
    },
    {
      "type": "recommendation",
      "category": "compliance",
      "title": "Strategic Recommendations",
      "content": "...",
      "confidence": 0.75
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
