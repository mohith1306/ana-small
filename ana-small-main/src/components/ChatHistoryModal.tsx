import React, { useState } from 'react';
import { Chat } from '../types';
import { X, Plus, Trash2, Edit2, Check, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  activeChat: Chat | null;
  onCreateChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onSwitchChat: (chatId: string) => void;
  onUpdateChatTitle: (chatId: string, title: string) => void;
}

const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  isOpen,
  onClose,
  chats,
  activeChat,
  onCreateChat,
  onDeleteChat,
  onSwitchChat,
  onUpdateChatTitle
}) => {
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const startEditing = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const saveTitle = (chatId: string) => {
    if (editTitle.trim()) {
      onUpdateChatTitle(chatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  const cancelEditing = () => {
    setEditingChatId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, chatId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle(chatId);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // Filter out chats with no messages and apply search term
  const filteredChats = chats
    .filter(chat => chat.messages.length > 0)
    .filter(chat => 
      searchTerm.trim() === '' || 
      chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.messages.some(msg => 
        msg.role === 'user' && msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Chat History</h2>
          <button onClick={onClose} className="p-1">
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 border border-black"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <button
            onClick={onCreateChat}
            className="w-full p-2 border border-black hover:bg-gray-100 flex items-center justify-center"
          >
            <Plus size={16} className="mr-2" />
            New Chat
          </button>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              {searchTerm ? 'No chats match your search' : 'No chats yet'}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`p-3 border ${
                  activeChat?.id === chat.id ? 'border-blue-500 bg-blue-50' : 'border-black'
                } hover:bg-gray-50 cursor-pointer`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-grow" onClick={() => editingChatId !== chat.id && onSwitchChat(chat.id)}>
                    {editingChatId === chat.id ? (
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, chat.id)}
                          className="flex-grow p-1 border border-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={() => saveTitle(chat.id)}
                          className="ml-2 p-1 text-green-600 hover:bg-green-50"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="ml-1 p-1 text-red-600 hover:bg-red-50"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium flex items-center">
                          <MessageSquare size={16} className="mr-2 text-gray-600" />
                          {chat.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(chat.updatedAt), 'MMM d, yyyy h:mm a')}
                        </div>
                        {chat.messages.length > 0 && (
                          <div className="text-sm text-gray-600 mt-1 truncate">
                            {chat.messages[0].content.substring(0, 60)}
                            {chat.messages[0].content.length > 60 ? '...' : ''}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {editingChatId !== chat.id && (
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={() => startEditing(chat)}
                        className="p-1 text-gray-600 hover:bg-gray-100"
                        title="Edit title"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this chat?')) {
                            onDeleteChat(chat.id);
                          }
                        }}
                        className="p-1 text-red-600 hover:bg-red-50"
                        title="Delete chat"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHistoryModal;