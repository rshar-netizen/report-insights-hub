import { ExternalLink, User, Bot } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/data/dataSources';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in`}>
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-primary/20' : 'bg-secondary'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary" />
        ) : (
          <Bot className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block rounded-xl px-5 py-4 ${
            isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'
          } ${isUser ? 'text-left' : ''}`}
        >
          {isUser ? (
            <p className="text-foreground">{message.content}</p>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="w-full text-sm border-collapse">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-border bg-secondary/50 px-3 py-2 text-left font-semibold text-foreground">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-border px-3 py-2 text-muted-foreground">
                      {children}
                    </td>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-semibold text-foreground mt-4 mb-2">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold text-foreground mt-3 mb-1.5">
                      {children}
                    </h3>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1 my-2 text-muted-foreground">
                      {children}
                    </ul>
                  ),
                  li: ({ children }) => (
                    <li className="text-muted-foreground">{children}</li>
                  ),
                  p: ({ children }) => (
                    <p className="text-muted-foreground my-2">{children}</p>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-secondary px-1.5 py-0.5 rounded text-primary font-mono text-sm">
                        {children}
                      </code>
                    ) : (
                      <code className={className}>{children}</code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 space-y-2">
            <span className="text-xs text-muted-foreground font-medium">
              Sources Referenced:
            </span>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-tag inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                >
                  <span>{source.name}</span>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="text-muted-foreground/80">{source.reportType}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-2">
          <span className="text-xs text-muted-foreground/60">
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
