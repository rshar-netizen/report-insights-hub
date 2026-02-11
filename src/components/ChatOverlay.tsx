import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Send,
  Sparkles,
  MessageSquare,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from './ChatMessage';
import { ChatMessage as ChatMessageType } from '@/data/dataSources';
import { dataIngestionApi, IngestedReport } from '@/lib/api/dataIngestion';

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activeContext: 'executive' | 'peer' | 'ingestion';
}

function generateSuggestedQuestions(
  reports: IngestedReport[],
  activeContext: string
): string[] {
  const analyzed = reports.filter((r) => r.status === 'analyzed');

  if (analyzed.length === 0) {
    // Fallback questions based on context
    if (activeContext === 'peer') {
      return [
        'How does our efficiency ratio compare to G-SIB peers?',
        'Which peers have the strongest capital positions?',
        'Compare our NIM trend to peers',
      ];
    }
    return [
      'What are the key capital adequacy metrics?',
      'Summarize the latest regulatory filing highlights',
      'What liquidity risks should we monitor?',
    ];
  }

  const questions: string[] = [];
  const reportTypes = [...new Set(analyzed.map((r) => r.report_type))];
  const institutions = [...new Set(analyzed.map((r) => r.institution_name).filter(Boolean))];

  if (reportTypes.includes('Call Report')) {
    questions.push('What are the key takeaways from the latest Call Report?');
  }
  if (reportTypes.includes('FRY-9C')) {
    questions.push('Summarize capital adequacy from the FRY-9C filing');
  }
  if (reportTypes.includes('UBPR')) {
    questions.push('What profitability trends does the UBPR show?');
  }
  if (institutions.length > 0) {
    questions.push(`What are the main risks identified for ${institutions[0]}?`);
  }

  // Fill remaining slots with generic report-aware questions
  if (questions.length < 3) {
    questions.push(`Summarize key findings across all ${analyzed.length} analyzed reports`);
  }
  if (questions.length < 3) {
    questions.push('What metrics require immediate attention?');
  }

  return questions.slice(0, 3);
}

export function ChatOverlay({ isOpen, onClose, activeContext }: ChatOverlayProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: reports = [] } = useQuery({
    queryKey: ['ingested-reports'],
    queryFn: () => dataIngestionApi.getReports(),
  });

  const analyzedReports = reports.filter((r) => r.status === 'analyzed');
  const reportIds = analyzedReports.map((r) => r.id);
  const suggestedQuestions = generateSuggestedQuestions(reports, activeContext);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (question: string) => {
    if (!question.trim() || isStreaming) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    let assistantContent = '';
    const allMessages = [...messages, userMessage];

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.id === 'streaming') {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [
          ...prev,
          {
            id: 'streaming',
            role: 'assistant' as const,
            content: assistantContent,
            timestamp: new Date(),
          },
        ];
      });
    };

    try {
      await dataIngestionApi.streamChat(
        allMessages.map((m) => ({ role: m.role, content: m.content })),
        reportIds,
        upsertAssistant,
        () => {
          // Finalize the streaming message with a real ID
          setMessages((prev) =>
            prev.map((m) =>
              m.id === 'streaming' ? { ...m, id: Date.now().toString() } : m
            )
          );
          setIsStreaming(false);
        }
      );
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to get response';
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== 'streaming'),
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `⚠️ ${errorMsg}. Please try again.`,
          timestamp: new Date(),
        },
      ]);
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(input);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col bg-background border-l border-border"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-border bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base font-semibold text-foreground">
                  RegInsight Assistant
                </SheetTitle>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {activeContext === 'executive'
                      ? 'Executive Summary'
                      : activeContext === 'peer'
                      ? 'Peer Benchmarking'
                      : 'Data Ingestion'}
                  </p>
                  {analyzedReports.length > 0 && (
                    <Badge variant="secondary" className="text-xs py-0 px-1.5">
                      <FileText className="w-3 h-3 mr-1" />
                      {analyzedReports.length} report{analyzedReports.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Suggested Questions */}
        <div className="border-b border-border px-4 py-3 bg-card/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              {analyzedReports.length > 0
                ? 'Questions based on your reports'
                : 'Suggested questions'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleSubmit(question)}
                disabled={isStreaming}
                className="glass-card text-left px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="group-hover:text-primary transition-colors line-clamp-1">
                  {question}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 animate-pulse-glow">
                <MessageSquare className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Ask About Your Data
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {analyzedReports.length > 0
                  ? `I have access to ${analyzedReports.length} analyzed report${analyzedReports.length !== 1 ? 's' : ''}. Ask me anything about the data, metrics, or regulatory insights.`
                  : 'Ingest reports in the Data Ingestion tab, and I\'ll answer questions based on your actual data. You can also ask general regulatory questions.'}
              </p>
              {analyzedReports.length === 0 && (
                <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border">
                  <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    No reports ingested yet. Responses will be based on general financial knowledge.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isStreaming && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                  <div className="chat-bubble-assistant rounded-xl px-4 py-3">
                    <span className="text-muted-foreground text-sm">
                      Analyzing regulatory data...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-3 bg-card/50">
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                analyzedReports.length > 0
                  ? 'Ask about your ingested reports, metrics, or filings...'
                  : 'Ask about regulatory metrics, filings, or peer comparison...'
              }
              className="min-h-[50px] max-h-[120px] pr-12 resize-none bg-secondary/50 border-border focus:border-primary/50 text-foreground placeholder:text-muted-foreground text-sm"
              disabled={isStreaming}
            />
            <Button
              size="icon"
              onClick={() => handleSubmit(input)}
              disabled={!input.trim() || isStreaming}
              className="absolute right-2 bottom-2 h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {analyzedReports.length > 0
              ? `Powered by AI • ${analyzedReports.length} report${analyzedReports.length !== 1 ? 's' : ''} in context`
              : 'Powered by FFIEC • FRED • CFPB • NIC • SEC'}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
