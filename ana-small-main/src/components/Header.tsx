import React, { useState } from 'react';
import { MessageSquare, Home, MoreVertical, X, Settings } from 'lucide-react';
import { logo } from '../constants/logo';
import EnterpriseModal from './EnterpriseModal';

interface HeaderProps {
  onOpenChatHistory: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenChatHistory, onNewChat, onOpenSettings }) => {
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-10 p-4 border-b border-ana-gray-border-light flex justify-between items-center bg-white">
        <button 
          onClick={onNewChat}
          className="flex items-center hover:opacity-80 transition-opacity"
        >
          <img src={logo} alt="Ana Logo" className="w-8 h-8" />
          <div className="flex flex-col ml-3">
            <h1 className="font-system text-2xl font-bold text-gray-700">Ana</h1>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-normal">Small</span>
          </div>
        </button>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-2">
          <button
            onClick={() => setIsEnterpriseModalOpen(true)}
            className="ana-button-enterprise"
          >
            <span className="font-system text-base font-normal">Compare Ana for Enterprise</span>
          </button>
          <button
            onClick={onOpenChatHistory}
            className="p-2 border border-gray-300 hover:border-black transition-colors"
            title="Chat History"
          >
            <MessageSquare size={20} className="text-gray-700" />
          </button>
          <button
            onClick={onNewChat}
            className="p-2 border border-gray-300 hover:border-black transition-colors"
            title="New Chat"
          >
            <Home size={20} className="text-gray-700" />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 border border-gray-300 hover:border-black transition-colors"
            title="Settings"
          >
            <Settings size={20} className="text-gray-700" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-2 border border-gray-300 hover:border-black transition-colors"
        >
          <MoreVertical size={20} className="text-gray-700" />
        </button>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
            <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-lg">
              <div className="p-4 border-b border-ana-gray-border-light flex justify-end">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} className="text-gray-700" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <button
                  onClick={() => {
                    onOpenChatHistory();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full p-3 border border-gray-300 hover:border-black transition-colors flex items-center space-x-2"
                >
                  <MessageSquare size={20} className="text-gray-700" />
                  <span className="font-system">Chat History</span>
                </button>
                <button
                  onClick={() => {
                    onNewChat();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full p-3 border border-gray-300 hover:border-black transition-colors flex items-center space-x-2"
                >
                  <Home size={20} className="text-gray-700" />
                  <span className="font-system">New Chat</span>
                </button>
                <button
                  onClick={() => {
                    onOpenSettings();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full p-3 border border-gray-300 hover:border-black transition-colors flex items-center space-x-2"
                >
                  <Settings size={20} className="text-gray-700" />
                  <span className="font-system">Settings</span>
                </button>
                <button
                  onClick={() => {
                    setIsEnterpriseModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="ana-button-enterprise w-full flex items-center justify-center"
                >
                  <span className="font-system text-base font-normal">Compare Ana for Enterprise</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <EnterpriseModal 
        isOpen={isEnterpriseModalOpen}
        onClose={() => setIsEnterpriseModalOpen(false)}
      />
    </>
  );
};

export default Header;