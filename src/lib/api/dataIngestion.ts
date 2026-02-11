import { supabase } from '@/integrations/supabase/client';

export interface IngestedReport {
  id: string;
  name: string;
  report_type: string;
  source: string;
  source_url?: string;
  file_path?: string;
  rssd_id?: string;
  institution_name?: string;
  reporting_period?: string;
  raw_content?: string;
  status: 'pending' | 'processing' | 'analyzed' | 'error';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportInsight {
  id: string;
  report_id: string;
  insight_type: string;
  category?: string;
  title: string;
  content: string;
  confidence_score?: number;
  metrics?: Record<string, unknown>;
  sources?: Record<string, unknown>;
  created_at: string;
}

export interface ApiConnection {
  id: string;
  name: string;
  portal: string;
  base_url: string;
  auth_type: string;
  headers?: Record<string, unknown>;
  query_params?: Record<string, unknown>;
  rssd_id?: string;
  schedule?: string;
  last_sync_at?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyzeResult {
  success: boolean;
  reportId: string;
  insights: Array<{
    type: string;
    category: string;
    title: string;
    content: string;
    metrics?: Record<string, unknown>;
    confidence: number;
  }>;
  analyzedAt: string;
  error?: string;
}

export const dataIngestionApi = {
  // Upload and create a report record
  async uploadReport(
    file: File,
    metadata: {
      reportType: string;
      institutionName?: string;
      rssdId?: string;
      reportingPeriod?: string;
    }
  ): Promise<{ success: boolean; report?: IngestedReport; error?: string }> {
    try {
      // Upload file to storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reports')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { success: false, error: uploadError.message };
      }

      // Create report record
      const { data: report, error: insertError } = await supabase
        .from('ingested_reports')
        .insert({
          name: file.name,
          report_type: metadata.reportType,
          source: 'upload',
          file_path: uploadData.path,
          institution_name: metadata.institutionName,
          rssd_id: metadata.rssdId,
          reporting_period: metadata.reportingPeriod,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return { success: false, error: insertError.message };
      }

      return { success: true, report: report as IngestedReport };
    } catch (error) {
      console.error('Upload report error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  },

  // Analyze a report using AI
  async analyzeReport(
    reportId: string,
    content: string,
    reportType: string,
    institutionName?: string,
    reportingPeriod?: string
  ): Promise<AnalyzeResult> {
    const { data, error } = await supabase.functions.invoke('analyze-report', {
      body: {
        reportId,
        content,
        reportType,
        institutionName,
        reportingPeriod
      }
    });

    if (error) {
      return { success: false, reportId, insights: [], analyzedAt: new Date().toISOString(), error: error.message };
    }

    return data as AnalyzeResult;
  },

  // Save insights to database
  async saveInsights(
    reportId: string,
    insights: AnalyzeResult['insights']
  ): Promise<{ success: boolean; error?: string }> {
    const insightRecords = insights.map(insight => ({
      report_id: reportId,
      insight_type: insight.type,
      category: insight.category,
      title: insight.title,
      content: insight.content,
      confidence_score: insight.confidence,
      metrics: insight.metrics ? JSON.parse(JSON.stringify(insight.metrics)) : null,
      sources: (insight as any).sources ? JSON.parse(JSON.stringify((insight as any).sources)) : null
    }));

    const { error } = await supabase
      .from('report_insights')
      .insert(insightRecords as any);

    if (error) {
      return { success: false, error: error.message };
    }

    // Update report status
    await supabase
      .from('ingested_reports')
      .update({ status: 'analyzed' })
      .eq('id', reportId);

    return { success: true };
  },

  // Get all reports
  async getReports(): Promise<IngestedReport[]> {
    const { data, error } = await supabase
      .from('ingested_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get reports error:', error);
      return [];
    }

    return (data || []) as IngestedReport[];
  },

  // Get insights for a report
  async getInsights(reportId?: string): Promise<ReportInsight[]> {
    let query = supabase
      .from('report_insights')
      .select('*')
      .order('created_at', { ascending: false });

    if (reportId) {
      query = query.eq('report_id', reportId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get insights error:', error);
      return [];
    }

    return (data || []) as ReportInsight[];
  },

  // API Connections
  async createApiConnection(
    connection: Omit<ApiConnection, 'id' | 'created_at' | 'updated_at' | 'last_sync_at'>
  ): Promise<{ success: boolean; connection?: ApiConnection; error?: string }> {
    const insertData = {
      name: connection.name,
      portal: connection.portal,
      base_url: connection.base_url,
      auth_type: connection.auth_type,
      rssd_id: connection.rssd_id || null,
      schedule: connection.schedule || null,
      status: connection.status,
      headers: connection.headers ? JSON.parse(JSON.stringify(connection.headers)) : null,
      query_params: connection.query_params ? JSON.parse(JSON.stringify(connection.query_params)) : null,
    };

    const { data, error } = await supabase
      .from('api_connections')
      .insert(insertData as any)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, connection: data as ApiConnection };
  },

  async getApiConnections(): Promise<ApiConnection[]> {
    const { data, error } = await supabase
      .from('api_connections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get connections error:', error);
      return [];
    }

    return (data || []) as ApiConnection[];
  },

  async deleteApiConnection(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('api_connections')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  // Fetch data from API connection
  async fetchFromApi(
    portal: string,
    options: {
      baseUrl?: string;
      endpoint?: string;
      rssdId?: string;
      apiKey?: string;
      headers?: Record<string, string>;
      queryParams?: Record<string, string>;
    }
  ): Promise<{ success: boolean; data?: unknown; markdown?: string; error?: string }> {
    const { data, error } = await supabase.functions.invoke('fetch-api-data', {
      body: {
        portal,
        ...options
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data;
  },

  // Update insight status (accept/reject)
  async updateInsightStatus(id: string, status: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('report_insights')
      .update({ status } as any)
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  // Delete an insight
  async deleteInsight(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('report_insights')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  // Chat with data
  async streamChat(
    messages: { role: 'user' | 'assistant'; content: string }[],
    reportIds: string[],
    onDelta: (text: string) => void,
    onDone: () => void
  ): Promise<void> {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/data-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, reportIds }),
    });

    if (!response.ok || !response.body) {
      throw new Error('Failed to start chat stream');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          // Incomplete JSON, put back and wait
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    onDone();
  }
};
