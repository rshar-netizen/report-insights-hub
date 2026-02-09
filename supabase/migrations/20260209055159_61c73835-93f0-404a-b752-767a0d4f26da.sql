CREATE POLICY "Allow public delete on ingested_reports"
ON public.ingested_reports
FOR DELETE
USING (true);

CREATE POLICY "Allow public delete on report_insights"
ON public.report_insights
FOR DELETE
USING (true);