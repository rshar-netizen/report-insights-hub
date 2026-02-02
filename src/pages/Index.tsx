import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SummaryDashboard } from '@/components/SummaryDashboard';
import { ConversationChat } from '@/components/ConversationChat';
import { LayoutDashboard, MessageSquare, Building2, Shield } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState('summary');

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
                  Financial Intelligence Platform
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-medium text-success">
                  All Systems Operational
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Enterprise Demo
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
              value="summary"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 px-6"
            >
              <LayoutDashboard className="w-4 h-4" />
              Summary Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="conversation"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 px-6"
            >
              <MessageSquare className="w-4 h-4" />
              AI Conversation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-0">
            <SummaryDashboard />
          </TabsContent>

          <TabsContent value="conversation" className="mt-0">
            <ConversationChat />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto py-4">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>© 2024 RegInsightAI. Enterprise Financial Intelligence.</span>
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
