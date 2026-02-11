-- Allow public update on report_insights for status changes
CREATE POLICY "Allow public update on report_insights"
ON public.report_insights
FOR UPDATE
USING (true);