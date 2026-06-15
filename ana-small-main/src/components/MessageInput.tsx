import React, { useState, useRef, useEffect } from 'react';
import { Send, StopCircle } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onStopChat: () => void;
  variant?: 'default' | 'landing';
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading,
  onStopChat,
  variant = 'default'
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    const container = containerRef.current;
    if (!textarea || !container) return;

    textarea.style.height = 'auto';

    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const maxHeight = variant === 'landing' ? lineHeight * 6 : lineHeight * 10;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  if (variant === 'landing') {
    return (
      <div
        ref={containerRef}
        className="w-full bg-white"
      >
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question about this dataset..."
            className="flex-grow px-4 py-3 border border-black resize-none min-h-[48px] overflow-y-auto focus:outline-none focus:ring-1 focus:ring-black transition-colors font-system scrollbar-hide"
            style={{ lineHeight: '1.5' }}
            disabled={isLoading}
            rows={1}
          />
          <button
            onClick={isLoading ? onStopChat : handleSend}
            disabled={isLoading ? false : !input.trim()}
            className={`w-[48px] h-[48px] flex-shrink-0 flex items-center justify-center ${
              isLoading
                ? 'bg-red-500 text-white border border-red-500'
                : 'bg-black text-white border border-black disabled:bg-gray-300 disabled:border-gray-300'
            } disabled:cursor-not-allowed transition-colors`}
          >
            {isLoading ? <StopCircle size={24} /> : <Send size={24} />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-black"
    >
      <div className="container mx-auto max-w-4xl px-4">
        <div className="flex gap-2 py-4">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            className="flex-grow px-3 py-1.5 border border-black resize-none min-h-[40px] max-h-[300px] overflow-y-auto font-system scrollbar-hide"
            style={{ lineHeight: '1.5' }}
            disabled={isLoading}
            rows={1}
          />
          <button
            onClick={isLoading ? onStopChat : handleSend}
            disabled={isLoading ? false : !input.trim()}
            className={`w-[40px] h-[40px] flex-shrink-0 flex items-center justify-center ${
              isLoading
                ? 'bg-red-500 text-white border border-red-500'
                : 'bg-black text-white border border-black disabled:bg-gray-300 disabled:border-gray-300'
            } disabled:cursor-not-allowed transition-colors`}
          >
            {isLoading ? <StopCircle size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
