import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Send, 
  Loader2, 
  Bot, 
  User,
  FileText,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { dataIngestionApi, IngestedReport } from '@/lib/api/dataIngestion';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function DataChat() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [showReportSelector, setShowReportSelector] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: reports = [] } = useQuery({
    queryKey: ['ingested-reports'],
    queryFn: () => dataIngestionApi.getReports(),
  });

  const analyzedReports = reports.filter(r => r.status === 'analyzed');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleReport = (id: string) => {
    setSelectedReports(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      await dataIngestionApi.streamChat(
        [...messages, userMessage],
        selectedReports,
        updateAssistant,
        () => setIsLoading(false)
      );
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Chat error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Ask About Your Data
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReportSelector(!showReportSelector)}
            className="text-xs"
          >
            <FileText className="w-3 h-3 mr-1" />
            {selectedReports.length > 0 ? `${selectedReports.length} reports` : 'Select reports'}
          </Button>
        </div>

        {/* Report selector */}
        {showReportSelector && analyzedReports.length > 0 && (
          <div className="mt-3 p-3 bg-secondary/30 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">Include in context:</p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {analyzedReports.map(report => (
                <label key={report.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedReports.includes(report.id)}
                    onCheckedChange={() => toggleReport(report.id)}
                  />
                  <span className="text-sm truncate">{report.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Selected reports badges */}
        {selectedReports.length > 0 && !showReportSelector && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedReports.map(id => {
              const report = reports.find(r => r.id === id);
              return report ? (
                <Badge key={id} variant="secondary" className="text-xs flex items-center gap-1">
                  {report.name.slice(0, 20)}...
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => toggleReport(id)}
                  />
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center text-muted-foreground">
              <div>
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Ask questions about your regulatory data</p>
                <p className="text-sm mt-1">
                  Select reports to include them in the context
                </p>
                <div className="mt-4 space-y-1 text-sm text-left max-w-xs mx-auto">
                  <p className="text-muted-foreground">Try asking:</p>
                  <p className="text-foreground">"What are the key capital ratios?"</p>
                  <p className="text-foreground">"Summarize the liquidity position"</p>
                  <p className="text-foreground">"What risks are identified?"</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-secondary rounded-lg px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about regulatory metrics, risks, or trends..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!input.trim() || isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
