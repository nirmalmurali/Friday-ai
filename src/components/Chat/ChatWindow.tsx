import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import type { Message } from '../../types';
import { MessageItem } from './MessageItem';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
}

const QUICK_PROMPTS = [
  '🔍 Find trending pet products in Australia with demand & growth metrics',
  '💰 Calculate real margins for a $69.95 memory foam dog bed',
  '🛡️ Stage a draft product listing for the orthopedic dog bed',
  '🚀 Generate optimized SEO metadata and JSON-LD schema',
  '📢 Create compliant high-converting Meta ad copy angles',
];

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickPromptClick = (prompt: string) => {
    // Strip leading emoji
    const cleanPrompt = prompt.replace(/^[^\w\s]+\s*/, '');
    onSendMessage(cleanPrompt);
  };

  return (
    <div className="chat-window-container" id="chat-window">
      {/* Messages Scroll Area */}
      <div className="messages-viewport" id="messages-viewport">
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="agent-thinking-indicator">
            <div className="thinking-avatar">
              <Sparkles size={16} className="pulsing-sparkle" />
            </div>
            <div className="thinking-bubble">
              <span className="thinking-text">Friday is analyzing data & orchestrating tools...</span>
              <div className="thinking-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="quick-prompts-bar">
        <div className="quick-prompts-scroll">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              className="quick-prompt-chip"
              onClick={() => handleQuickPromptClick(prompt)}
              disabled={isLoading}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input Bar */}
      <div className="chat-input-wrapper">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <textarea
            ref={inputRef}
            id="chat-input-textarea"
            className="chat-textarea"
            placeholder="Instruct Friday (e.g., 'Find breakout fitness products with under 10 days shipping to AU')..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={isLoading}
          />

          <div className="chat-input-actions">
            <span className="input-hint">Shift + Enter for new line</span>
            <button
              type="submit"
              id="btn-send-message"
              className="btn btn-primary btn-send"
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? <Loader2 size={16} className="spinner" /> : <Send size={16} />}
              <span>Send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
