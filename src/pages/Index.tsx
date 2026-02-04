import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExecutiveSummary } from '@/components/ExecutiveSummary';
import { PeerBenchmarking } from '@/components/PeerBenchmarking';
import { DataIngestion } from '@/components/DataIngestion';
import { ChatOverlay } from '@/components/ChatOverlay';
import { Building2, Shield, BarChart3, Users, MessageSquare, Upload } from 'lucide-react';
import { mizuho } from '@/data/dataSources';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [activeTab, setActiveTab] = useState('executive');
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  RegInsight<span className="text-primary">AI</span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  {mizuho.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
                <span className="text-xs text-muted-foreground">
                  RSSD: {mizuho.rssdId}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  Assets: {mizuho.totalAssets}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-medium text-success">
                  Live Data
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-secondary/50 border border-border p-1 mb-6">
            <TabsTrigger
              value="executive"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 px-4"
            >
              <BarChart3 className="w-4 h-4" />
              Mizuho Overview
            </TabsTrigger>
            <TabsTrigger
              value="peer"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 px-4"
            >
              <Users className="w-4 h-4" />
              Peer Benchmarking
            </TabsTrigger>
            <TabsTrigger
              value="ingestion"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 px-4"
            >
              <Upload className="w-4 h-4" />
              Data Ingestion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="executive" className="mt-0">
            <ExecutiveSummary />
          </TabsContent>

          <TabsContent value="peer" className="mt-0">
            <PeerBenchmarking />
          </TabsContent>

          <TabsContent value="ingestion" className="mt-0">
            <DataIngestion />
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground z-40"
        size="icon"
      >
        <MessageSquare className="w-6 h-6" />
      </Button>

      {/* Chat Overlay */}
      <ChatOverlay 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        activeContext={activeTab === 'executive' ? 'executive' : activeTab === 'peer' ? 'peer' : 'ingestion'}
      />

      {/* Footer */}
      <footer className="border-t border-border mt-auto py-4">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>© 2024 RegInsightAI. Financial Intelligence Platform.</span>
            <div className="flex items-center gap-4">
              <span>Data sources: FFIEC • FRED • CFPB • NIC • SEC</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
