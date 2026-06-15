import React, { useState, useEffect, useRef } from 'react';
import { AppSettings } from '../types';
import { X } from 'lucide-react';
import OpenAiSection from './settings/OpenAiSection';
import SettingsFooter from './settings/SettingsFooter';
import { useClickOutside } from '../hooks/useClickOutside';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdateSettings 
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const modalRef = useRef<HTMLDivElement>(null);

  useClickOutside(modalRef, () => {
    if (isOpen) onClose();
  });

  // Update local settings when props change
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white p-6 rounded w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Settings</h2>
          <button onClick={onClose} className="p-1">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* OpenAI Section */}
          <OpenAiSection 
            apiKey={localSettings.openaiApiKey || ''}
            onApiKeyChange={(key) => setLocalSettings(prev => ({ ...prev, openaiApiKey: key }))}
          />
        </div>

        {/* Footer with action buttons */}
        <SettingsFooter 
          onCancel={onClose}
          onSave={handleSave}
        />

        {/* Storage Information Note */}
        <p className="mt-6 text-sm text-gray-500">
          All configuration data, including API keys and preferences, is securely stored in your browser's local storage.
        </p>
      </div>
    </div>
  );
};

export default SettingsModal;