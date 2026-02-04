import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Sparkles, MessageSquareText } from 'lucide-react';
import { ReportUploader } from './ReportUploader';
import { InsightsPanel } from './InsightsPanel';
import { DataChat } from './DataChat';

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

        {/* Right Column: Insights & Chat */}
        <div className="space-y-6">
          <Tabs defaultValue="insights">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Insights
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquareText className="w-4 h-4" />
                Q&A Chat
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="insights" className="mt-4">
              <InsightsPanel />
            </TabsContent>
            
            <TabsContent value="chat" className="mt-4">
              <DataChat />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
