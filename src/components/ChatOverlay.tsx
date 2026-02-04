import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  MessageSquare, 
  X, 
  Minimize2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChatMessage } from './ChatMessage';
import {
  ChatMessage as ChatMessageType,
  executiveSummaryQuestions,
  peerBenchmarkingQuestions,
  sampleResponses,
} from '@/data/dataSources';

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activeContext: 'executive' | 'peer' | 'ingestion';
}

export function ChatOverlay({ isOpen, onClose, activeContext }: ChatOverlayProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const contextQuestions = activeContext === 'executive' 
    ? executiveSummaryQuestions 
    : activeContext === 'peer'
    ? peerBenchmarkingQuestions
    : executiveSummaryQuestions;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getResponse = (question: string) => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('nim') || lowerQuestion.includes('net interest margin') || lowerQuestion.includes('compression')) {
      return sampleResponses['nim'];
    }
    if (lowerQuestion.includes('capital') || lowerQuestion.includes('tier 1') || lowerQuestion.includes('stress')) {
      return sampleResponses['capital'];
    }
    if (lowerQuestion.includes('cre') || lowerQuestion.includes('office') || lowerQuestion.includes('real estate')) {
      return sampleResponses['cre'];
    }
    if (lowerQuestion.includes('fry-9c') || lowerQuestion.includes('filing') || lowerQuestion.includes('fry9c')) {
      return sampleResponses['fry9c'];
    }
    if (lowerQuestion.includes('efficiency') || lowerQuestion.includes('cost')) {
      return sampleResponses['efficiency'];
    }
    if (lowerQuestion.includes('peer') || lowerQuestion.includes('compare') || lowerQuestion.includes('benchmark')) {
      return sampleResponses['peer'];
    }
    
    return sampleResponses['default'];
  };

  const handleSubmit = async (question: string) => {
    if (!question.trim()) return;

    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const response = getResponse(question);
    
    const assistantMessage: ChatMessageType = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      sources: response.sources,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
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
                <p className="text-xs text-muted-foreground">
                  {activeContext === 'executive' ? 'Executive Summary Context' : activeContext === 'peer' ? 'Peer Benchmarking Context' : 'Data Ingestion Context'}
                </p>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Example Questions */}
        <div className="border-b border-border px-4 py-3 bg-card/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              Suggested questions
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {contextQuestions.slice(0, 3).map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleSubmit(question)}
                disabled={isTyping}
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
                Ask About {activeContext === 'executive' ? 'Mizuho Metrics' : 'Peer Comparison'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Get insights from FFIEC, FRED, and other federal regulatory sources.
                Click a suggested question or type your own.
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isTyping && (
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
              placeholder="Ask about metrics, filings, or peer comparison..."
              className="min-h-[50px] max-h-[120px] pr-12 resize-none bg-secondary/50 border-border focus:border-primary/50 text-foreground placeholder:text-muted-foreground text-sm"
              disabled={isTyping}
            />
            <Button
              size="icon"
              onClick={() => handleSubmit(input)}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 bottom-2 h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Powered by FFIEC • FRED • CFPB • NIC • SEC
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
