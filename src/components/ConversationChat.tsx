import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage } from './ChatMessage';
import {
  ChatMessage as ChatMessageType,
  exampleQuestions,
  sampleResponses,
} from '@/data/dataSources';

export function ConversationChat() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getResponse = (question: string) => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('tier 1') || lowerQuestion.includes('capital ratio')) {
      return sampleResponses['tier1'];
    }
    if (lowerQuestion.includes('nim') || lowerQuestion.includes('net interest margin')) {
      return sampleResponses['nim'];
    }
    if (lowerQuestion.includes('fry-9c') || lowerQuestion.includes('risk indicator')) {
      return sampleResponses['fry9c'];
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

    // Simulate AI response delay
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
    <div className="flex flex-col h-[calc(100vh-240px)] min-h-[600px] animate-fade-in">
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 animate-pulse-glow">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Financial Intelligence Assistant
            </h3>
            <p className="text-muted-foreground max-w-md mb-8">
              Ask questions about regulatory filings, financial metrics, and market data.
              I'll provide insights sourced from federal regulatory databases.
            </p>

            {/* Example Questions */}
            <div className="w-full max-w-2xl">
              <div className="flex items-center gap-2 justify-center mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  Would you like to know...
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exampleQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSubmit(question)}
                    className="glass-card text-left p-4 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-200 group"
                  >
                    <span className="group-hover:text-primary transition-colors">
                      {question}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isTyping && (
              <div className="flex gap-4 animate-fade-in">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
                <div className="chat-bubble-assistant rounded-xl px-5 py-4">
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
      <div className="border-t border-border p-4 bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about regulatory filings, financial metrics, or market data..."
              className="min-h-[60px] max-h-[200px] pr-14 resize-none bg-secondary/50 border-border focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
              disabled={isTyping}
            />
            <Button
              size="icon"
              onClick={() => handleSubmit(input)}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 bottom-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Powered by FFIEC, FRED, CFPB, NIC, and SEC data feeds
          </p>
        </div>
      </div>
    </div>
  );
}
