import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert max-w-none prose-headings:text-text-primary prose-p:text-text-primary prose-li:text-text-primary prose-strong:text-text-primary prose-a:text-accent-cyan">
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            
            // Check if it's an inline code or block
            const isInline = !match && !codeString.includes('\n');
            
            if (isInline) {
              return (
                <code className="bg-bg-raised px-1.5 py-0.5 rounded text-accent-cyan font-mono text-sm" {...props}>
                  {children}
                </code>
              );
            }
            
            return match ? (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
              >
                {codeString}
              </SyntaxHighlighter>
            ) : (
              <pre className="bg-bg-raised rounded-lg p-4 overflow-x-auto">
                <code className="font-mono text-sm text-text-primary" {...props}>
                  {children}
                </code>
              </pre>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
