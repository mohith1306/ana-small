import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { Chat, Message } from '../types';

// Default empty chat
const createNewChat = (connectorId: string): Chat => ({
  id: nanoid(),
  title: 'New Chat',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [],
  connectorId
});

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadChats = () => {
      try {
        const savedChats = localStorage.getItem('chats');
        const parsedChats: Chat[] = savedChats ? JSON.parse(savedChats) : [];
        const lastSelectedWarehouse = localStorage.getItem('lastSelectedWarehouse') || 'SAMPLE-1';
        
        if (parsedChats.length === 0) {
          const newChat = createNewChat(lastSelectedWarehouse);
          setChats([newChat]);
          setActiveChat(newChat);
        } else {
          // Add connectorId if missing (for backward compatibility)
          const updatedChats = parsedChats.map(chat => ({
            ...chat,
            connectorId: chat.connectorId || lastSelectedWarehouse
          }));
          setChats(updatedChats);
          
          const lastActiveId = localStorage.getItem('activeChat');
          const lastActive = lastActiveId ? updatedChats.find(chat => chat.id === lastActiveId) : null;
          
          setActiveChat(lastActive || updatedChats[0]);
        }
      } catch (error) {
        console.error('Error loading chats:', error);
        const lastSelectedWarehouse = localStorage.getItem('lastSelectedWarehouse') || 'SAMPLE-1';
        const newChat = createNewChat(lastSelectedWarehouse);
        setChats([newChat]);
        setActiveChat(newChat);
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadChats();
  }, []);

  useEffect(() => {
    if (isLoaded && chats.length > 0) {
      localStorage.setItem('chats', JSON.stringify(chats));
      
      if (activeChat) {
        localStorage.setItem('activeChat', activeChat.id);
        localStorage.setItem('lastSelectedWarehouse', activeChat.connectorId);
      }
    }
  }, [chats, activeChat, isLoaded]);

  const createChat = (connectorId: string = localStorage.getItem('lastSelectedWarehouse') || 'SAMPLE-1') => {
    const newChat = createNewChat(connectorId);
    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChat);
    return newChat;
  };

  const deleteChat = (chatId: string) => {
    setChats(prev => {
      const updatedChats = prev.filter(chat => chat.id !== chatId);
      
      if (activeChat && activeChat.id === chatId) {
        if (updatedChats.length > 0) {
          setActiveChat(updatedChats[0]);
        } else {
          const lastSelectedWarehouse = localStorage.getItem('lastSelectedWarehouse') || 'SAMPLE-1';
          const newChat = createNewChat(lastSelectedWarehouse);
          setActiveChat(newChat);
          return [newChat];
        }
      }
      
      return updatedChats;
    });
  };

  const switchChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setActiveChat(chat);
    }
  };

  const updateMessages = (messages: Message[]) => {
    if (!activeChat) return;
    
    const updatedChat: Chat = {
      ...activeChat,
      messages,
      updatedAt: new Date().toISOString(),
      title: activeChat.title === 'New Chat' && messages.length > 0 && messages[0].role === 'user'
        ? messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? '...' : '')
        : activeChat.title
    };
    
    setActiveChat(updatedChat);
    setChats(prev => prev.map(chat => 
      chat.id === updatedChat.id ? updatedChat : chat
    ));
  };

  const updateChatTitle = (chatId: string, title: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, title, updatedAt: new Date().toISOString() } : chat
    ));
    
    if (activeChat && activeChat.id === chatId) {
      setActiveChat(prev => prev ? { ...prev, title, updatedAt: new Date().toISOString() } : null);
    }
  };

  const updateChatConnector = (chatId: string, connectorId: string) => {
    localStorage.setItem('lastSelectedWarehouse', connectorId);
    
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, connectorId, updatedAt: new Date().toISOString() } : chat
    ));
    
    if (activeChat && activeChat.id === chatId) {
      setActiveChat(prev => prev ? { ...prev, connectorId, updatedAt: new Date().toISOString() } : null);
    }
  };

  return {
    chats,
    activeChat,
    isLoaded,
    createChat,
    deleteChat,
    switchChat,
    updateMessages,
    updateChatTitle,
    updateChatConnector
  };
}