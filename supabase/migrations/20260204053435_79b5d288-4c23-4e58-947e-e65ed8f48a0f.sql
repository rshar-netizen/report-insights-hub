-- Create table for storing ingested reports
CREATE TABLE public.ingested_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'call_report', 'ubpr', 'fr_y9c', 'summary_of_deposits', 'sec_filing', 'custom'
  source TEXT NOT NULL, -- 'upload', 'ffiec', 'fred', 'sec', 'fdic', 'custom_api'
  source_url TEXT,
  file_path TEXT, -- Storage path for uploaded files
  rssd_id TEXT,
  institution_name TEXT,
  reporting_period TEXT, -- e.g., 'Q4 2023', '2023'
  raw_content TEXT, -- Extracted text/markdown from document
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'analyzed', 'error'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for AI-generated insights from reports
CREATE TABLE public.report_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.ingested_reports(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'summary', 'risk_assessment', 'metric_extraction', 'trend_analysis', 'recommendation'
  category TEXT, -- 'capital', 'liquidity', 'profitability', 'asset_quality', 'compliance'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  metrics JSONB, -- Extracted metrics with values
  sources JSONB, -- References to specific sections in the report
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for API connection configurations
CREATE TABLE public.api_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  portal TEXT NOT NULL, -- 'ffiec', 'fred', 'sec', 'fdic', 'custom'
  base_url TEXT NOT NULL,
  auth_type TEXT NOT NULL DEFAULT 'api_key', -- 'api_key', 'oauth', 'basic', 'none'
  credentials_encrypted TEXT, -- Encrypted credentials storage
  headers JSONB, -- Custom headers
  query_params JSONB, -- Default query parameters
  rssd_id TEXT, -- Institution identifier
  schedule TEXT, -- Cron expression for scheduled pulls
  last_sync_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'error'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for chat history with ingested data
CREATE TABLE public.data_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL, -- 'user', 'assistant'
  content TEXT NOT NULL,
  report_ids UUID[], -- Array of report IDs in context
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (public access for demo - in production, add user_id)
ALTER TABLE public.ingested_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create public access policies (for demo purposes)
CREATE POLICY "Allow public read on ingested_reports" ON public.ingested_reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert on ingested_reports" ON public.ingested_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on ingested_reports" ON public.ingested_reports FOR UPDATE USING (true);

CREATE POLICY "Allow public read on report_insights" ON public.report_insights FOR SELECT USING (true);
CREATE POLICY "Allow public insert on report_insights" ON public.report_insights FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on api_connections" ON public.api_connections FOR SELECT USING (true);
CREATE POLICY "Allow public insert on api_connections" ON public.api_connections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on api_connections" ON public.api_connections FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on api_connections" ON public.api_connections FOR DELETE USING (true);

CREATE POLICY "Allow public read on data_chat_messages" ON public.data_chat_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert on data_chat_messages" ON public.data_chat_messages FOR INSERT WITH CHECK (true);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_ingested_reports_updated_at
  BEFORE UPDATE ON public.ingested_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_connections_updated_at
  BEFORE UPDATE ON public.api_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for uploaded reports
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false);

-- Create storage policies
CREATE POLICY "Allow public upload to reports" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reports');
CREATE POLICY "Allow public read from reports" ON storage.objects FOR SELECT USING (bucket_id = 'reports');