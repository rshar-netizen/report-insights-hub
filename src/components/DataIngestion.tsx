import { Sparkles } from 'lucide-react';
import { ReportUploader } from './ReportUploader';
import { InsightsPanel } from './InsightsPanel';

export function DataIngestion() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Data Ingestion</h2>
        <p className="text-muted-foreground">
          Upload regulatory reports or connect to Federal portals for AI-powered analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Upload & Connections */}
        <div className="space-y-6">
          <ReportUploader />
        </div>

        {/* Right Column: AI Insights */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">AI Insights</h3>
          </div>
          <InsightsPanel />
        </div>
      </div>
    </div>
  );
}
