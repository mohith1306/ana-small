import React from 'react';

interface SettingsFooterProps {
  onCancel: () => void;
  onSave: () => void;
}

const SettingsFooter: React.FC<SettingsFooterProps> = ({ onCancel, onSave }) => {
  return (
    <div className="mt-6 flex justify-end space-x-2">
      <button
        onClick={onCancel}
        className="px-4 py-2 border border-black hover:bg-gray-100"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        className="px-4 py-2 bg-black text-white border border-black hover:bg-gray-800"
      >
        Save Settings
      </button>
    </div>
  );
};

export default SettingsFooter;