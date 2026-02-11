-- Add status column for human-in-the-loop review
ALTER TABLE public.report_insights 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Add index for filtering by status
CREATE INDEX IF NOT EXISTS idx_report_insights_status ON public.report_insights(status);