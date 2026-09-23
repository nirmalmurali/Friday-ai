import React from 'react';
import { User, Bot, Copy, Check } from 'lucide-react';
import type { Message } from '../../types';
import { ToolCallCard } from './ToolCallCard';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let parsedToolCalls: any[] = [];
  if (message.tool_calls) {
    try {
      parsedToolCalls = JSON.parse(message.tool_calls);
    } catch (e) {
      console.error('Failed to parse tool calls', e);
    }
  }

  // Simple, elegant custom markdown renderer
  const renderFormattedContent = (text: string) => {
    // Process markdown line-by-line
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let tableBuffer: string[] = [];
    let inTable = false;

    const flushTable = (keyPrefix: number) => {
      if (tableBuffer.length < 2) {
        tableBuffer = [];
        inTable = false;
        return;
      }

      const headerCells = tableBuffer[0]
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      // tableBuffer[1] is separator line like | :--- | :--- |
      const bodyRows = tableBuffer.slice(2).map((row) =>
        row
          .split('|')
          .map((c) => c.trim())
          .filter((c) => c.length > 0)
      );

      elements.push(
        <div className="table-responsive-wrapper" key={`table-${keyPrefix}`}>
          <table className="custom-table">
            <thead>
              <tr>
                {headerCells.map((h, i) => (
                  <th key={i}>{formatInline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx}>{formatInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableBuffer = [];
      inTable = false;
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Check for table lines
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        tableBuffer.push(trimmed);
        return;
      } else if (inTable) {
        flushTable(idx);
      }

      // Blockquotes / Alerts
      if (trimmed.startsWith('>')) {
        const quoteContent = trimmed.replace(/^>\s*/, '');
        elements.push(
          <blockquote className="custom-blockquote" key={idx}>
            {formatInline(quoteContent)}
          </blockquote>
        );
        return;
      }

      // Headings
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 className="custom-h3" key={idx}>
            {formatInline(trimmed.replace('### ', ''))}
          </h3>
        );
        return;
      }
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 className="custom-h2" key={idx}>
            {formatInline(trimmed.replace('## ', ''))}
          </h2>
        );
        return;
      }
      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 className="custom-h1" key={idx}>
            {formatInline(trimmed.replace('# ', ''))}
          </h1>
        );
        return;
      }

      // Bullet lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <div className="custom-list-item" key={idx}>
            <span className="bullet-dot">•</span>
            <span>{formatInline(trimmed.slice(2))}</span>
          </div>
        );
        return;
      }

      // Numbered lists
      if (/^\d+\.\s/.test(trimmed)) {
        const number = trimmed.match(/^(\d+)\.\s/)?.[1];
        elements.push(
          <div className="custom-list-item" key={idx}>
            <span className="number-badge">{number}.</span>
            <span>{formatInline(trimmed.replace(/^\d+\.\s/, ''))}</span>
          </div>
        );
        return;
      }

      // Horizontal separator
      if (trimmed === '---') {
        elements.push(<hr className="custom-hr" key={idx} />);
        return;
      }

      // Standard paragraphs
      if (trimmed.length > 0) {
        elements.push(
          <p className="custom-paragraph" key={idx}>
            {formatInline(trimmed)}
          </p>
        );
      }
    });

    if (inTable) {
      flushTable(lines.length);
    }

    return elements;
  };

  const formatInline = (text: string): React.ReactNode => {
    // Process inline bold, inline code, links
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(<code className="inline-code" key={match.index}>{token.slice(1, -1)}</code>);
      } else if (token.startsWith('[') && token.includes('](')) {
        const linkText = token.slice(1, token.indexOf(']('));
        const linkUrl = token.slice(token.indexOf('](') + 2, -1);
        parts.push(
          <a
            key={match.index}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="custom-link"
          >
            {linkText}
          </a>
        );
      }
      lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className={`message-item-wrapper ${isUser ? 'user-wrapper' : 'assistant-wrapper'}`}>
      <div className="message-avatar">
        {isUser ? (
          <div className="avatar user-avatar">
            <User size={16} />
          </div>
        ) : (
          <div className="avatar assistant-avatar">
            <Bot size={16} />
          </div>
        )}
      </div>

      <div className="message-content-container">
        <div className="message-meta">
          <span className="sender-name">{isUser ? 'You (Store Owner)' : 'Friday (AI Assistant)'}</span>
          <span className="timestamp">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>

          {!isUser && (
            <button
              className="copy-btn"
              onClick={handleCopy}
              title="Copy response text"
              aria-label="Copy response text"
            >
              {copied ? <Check size={12} className="copied-icon" /> : <Copy size={12} />}
            </button>
          )}
        </div>

        {/* Display executed tool calls */}
        {parsedToolCalls.length > 0 && (
          <div className="message-tool-calls">
            {parsedToolCalls.map((tc, idx) => (
              <ToolCallCard
                key={idx}
                name={tc.name}
                args={tc.args}
                result={tc.result}
              />
            ))}
          </div>
        )}

        <div className="message-bubble">{renderFormattedContent(message.content)}</div>
      </div>
    </div>
  );
};
