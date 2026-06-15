import React, { useRef, useEffect } from 'react';
import { Message, RedshiftCredentials, UserWarehouse } from '../types';
import MarkdownTable from './MarkdownTable';
import VisualizationContainer from './visualizations/VisualizationContainer';
import EmptyStateSelector from './EmptyStateSelector';
import MessageInput from './MessageInput';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  userWarehouses: UserWarehouse[];
  selectedWarehouseId: string;
  onWarehouseSelect: (id: string, credentials?: RedshiftCredentials) => void;
  onWarehouseUpdate: (id: string, updates: Partial<RedshiftCredentials>) => void;
  onWarehouseDelete: (id: string) => void;
  onStopChat: () => void;
  showInput?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  onSendMessage,
  userWarehouses,
  selectedWarehouseId,
  onWarehouseSelect,
  onWarehouseUpdate,
  onWarehouseDelete,
  onStopChat,
  showInput = true
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-grow overflow-auto flex flex-col">
      {messages.length === 0 ? (
        <EmptyStateSelector
          onQuerySelect={onSendMessage}
          userWarehouses={userWarehouses}
          selectedWarehouseId={selectedWarehouseId}
          onWarehouseSelect={onWarehouseSelect}
          onWarehouseUpdate={onWarehouseUpdate}
          onWarehouseDelete={onWarehouseDelete}
          isLoading={isLoading}
          onStopChat={onStopChat}
        />
      ) : (
        <>
          <div className="p-4 pb-[80px] flex-1">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`mb-4 p-3 border border-black w-full ${
                  message.role === 'user' ? 'bg-gray-100' : 
                  message.role === 'system' ? 'bg-gray-50 border-dashed' : 
                  message.role === 'tool' ? (message.result?.error ? 'bg-red-100 border-dashed' : 'bg-blue-50 border-dashed') :
                  'bg-white'
                }`}
              >
                <div className="font-bold mb-1">
                  {message.role === 'user' ? 'You' : 
                   message.role === 'system' ? 'System' : 
                   message.role === 'tool' ? `Tool: ${message.name || 'exec-sql'}` :
                   'Ana'}
                </div>
                <div className="whitespace-pre-wrap">
                  {renderMessageContent(message.content)}
                </div>
                {message.tool_calls && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200">
                    <div className="font-bold text-sm text-blue-700">
                      Using tool: {message.tool_calls[0].function.name}
                    </div>
                    {message.tool_calls.map((toolCall, i) => (
                      <div key={i} className="mt-1">
                        {toolCall.function.name === 'exec-sql' && (
                          <div className="text-sm">
                            <pre className="bg-gray-800 text-white p-2 overflow-x-auto">
                              {formatSqlQuery(JSON.parse(toolCall.function.arguments).code)}
                            </pre>
                          </div>
                        )}
                        {toolCall.function.name === 'exec-js' && (
                          <div className="text-sm">
                            <pre className="bg-gray-800 text-white p-2 overflow-x-auto">
                              {formatJsCode(JSON.parse(toolCall.function.arguments).code)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {message.role === 'tool' && message.name === 'exec-js' && message.content && (
                  tryRenderVisualizations(message.content)
                )}
              </div>
            ))}
            {isLoading && (
              <div className="mb-4 p-3 border border-black w-full bg-white">
                <div className="font-bold mb-1">Ana</div>
                <div>Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {showInput && (
            <MessageInput 
              onSendMessage={onSendMessage} 
              isLoading={isLoading} 
              onStopChat={onStopChat}
            />
          )}
        </>
      )}
    </div>
  );
};

// Helper function to format SQL queries
function formatSqlQuery(sql: string): string {
  return sql.trim();
}

// Helper function to format JavaScript code
function formatJsCode(code: string): string {
  return code.trim();
}

// Helper function to try rendering visualizations from exec-js tool response
function tryRenderVisualizations(content: string): React.ReactNode {
  try {
    const jsonStartIndex = content.indexOf('{');
    if (jsonStartIndex >= 0) {
      const jsonPart = content.substring(jsonStartIndex);
      const result = JSON.parse(jsonPart);
      
      if (result.visualizations && Array.isArray(result.visualizations)) {
        return (
          <VisualizationContainer visualizations={result.visualizations} />
        );
      }
    }
    
    const result = JSON.parse(content);
    if (result.visualizations && Array.isArray(result.visualizations)) {
      return (
        <VisualizationContainer visualizations={result.visualizations} />
      );
    }
  } catch (e) {
    console.error("Error parsing visualization data:", e);
    return null;
  }
  
  return null;
}

// Helper function to render message content with code blocks and tables
function renderMessageContent(content: string): React.ReactNode {
  if (!content) return null;
  
  const codeBlockParts = content.split(/```([\s\S]*?)```/);
  
  return codeBlockParts.map((part, index) => {
    if (index % 2 === 0) {
      return processTextWithTables(part, index);
    } else {
      const [language, ...codeLines] = part.split('\n');
      const code = codeLines.join('\n');
      
      return (
        <pre key={`code-${index}`} className="bg-gray-100 p-2 overflow-x-auto my-2">
          <code>{code}</code>
        </pre>
      );
    }
  });
}

// Process text that might contain tables
function processTextWithTables(text: string, keyPrefix: number): React.ReactNode {
  if (!text.includes('|')) {
    return <span key={`text-${keyPrefix}`}>{text}</span>;
  }
  
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  
  let tableLines: string[] = [];
  let inTable = false;
  let textBuffer = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isTableRow = line.startsWith('|') && line.endsWith('|');
    
    const isSeparatorLine = isTableRow && 
                           line.includes('|-') && 
                           !line.match(/[A-Za-z0-9]/) && 
                           line.replace(/[^|]/g, '').length >= 3;
    
    const isPotentialTableHeader = isTableRow && 
                                  i < lines.length - 1 && 
                                  lines[i+1].trim().startsWith('|') && 
                                  lines[i+1].trim().endsWith('|') && 
                                  lines[i+1].trim().includes('|-');
    
    if (isPotentialTableHeader && !inTable) {
      if (textBuffer) {
        result.push(<span key={`text-${keyPrefix}-${result.length}`}>{textBuffer}</span>);
        textBuffer = '';
      }
      
      inTable = true;
      tableLines = [line];
    } else if (inTable) {
      tableLines.push(line);
      
      const nextLine = i < lines.length - 1 ? lines[i+1].trim() : '';
      const nextIsNotTableRow = !nextLine.startsWith('|') || !nextLine.endsWith('|');
      
      if ((nextIsNotTableRow || i === lines.length - 1) && tableLines.length >= 3) {
        result.push(
          <div key={`table-${keyPrefix}-${result.length}`} className="my-4">
            <MarkdownTable tableContent={tableLines.join('\n')} />
          </div>
        );
        
        inTable = false;
        tableLines = [];
      } else if (tableLines.length >= 2 && !isSeparatorLine && !isTableRow) {
        textBuffer += tableLines.join('\n') + '\n' + line + '\n';
        inTable = false;
        tableLines = [];
      }
    } else {
      textBuffer += line + '\n';
    }
  }
  
  if (inTable && tableLines.length >= 3) {
    result.push(
      <div key={`table-${keyPrefix}-${result.length}`} className="my-4">
        <MarkdownTable tableContent={tableLines.join('\n')} />
      </div>
    );
  } else if (tableLines.length > 0) {
    textBuffer += tableLines.join('\n');
  }
  
  if (textBuffer) {
    result.push(<span key={`text-${keyPrefix}-${result.length}`}>{textBuffer}</span>);
  }
  
  return <>{result}</>;
}

export default MessageList;