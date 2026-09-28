import { type Message } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;
  const isError = message.isError;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gw-animate-fade-in`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
        isError ? 'border' : ''
      }`} style={{
        background: isUser
          ? 'var(--gw-gradient-primary)'
          : isError
            ? 'var(--gw-error-dim)'
            : 'var(--gw-bg-elevated)',
        color: isUser ? 'var(--gw-text-inverse)' : isError ? 'var(--gw-error)' : 'var(--gw-text-primary)',
        border: isError ? '1px solid rgba(248,113,113,0.3)' : isUser ? 'none' : '1px solid var(--gw-border-subtle)',
      }}>
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                code: (props: any) => <CodeBlock {...props} />,
                pre: ({ children }) => <>{children}</>,
              }}
            >
              {message.content || (isStreaming ? '...' : '')}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CodeBlock(props: any) {
  const [copied, setCopied] = useState(false);
  const { className, children } = props;
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');
  const isInline = !match && !codeString.includes('\n');

  if (isInline) {
    return <code style={{ background: 'var(--gw-bg-void)', padding: '0.15em 0.4em', borderRadius: '4px', fontSize: '0.875em', color: 'var(--gw-accent-300)', border: '1px solid var(--gw-border-subtle)' }}>{children}</code>;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="relative group my-3">
      <div className="flex items-center justify-between bg-gray-900 px-4 py-2 rounded-t-lg border-b border-gray-700">
        <span className="text-xs text-gray-400">{match?.[1] || 'code'}</span>
        <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre className="bg-gray-900 p-4 rounded-b-lg overflow-x-auto">
        <code className={`text-sm ${className || ''}`}>{codeString}</code>
      </pre>
    </div>
  );
}
