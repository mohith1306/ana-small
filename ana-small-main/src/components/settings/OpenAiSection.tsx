import React from 'react';

interface OpenAiSectionProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

const OpenAiSection: React.FC<OpenAiSectionProps> = ({ 
  apiKey, 
  onApiKeyChange
}) => {
  return (
    <div>
      <h3 className="font-bold mb-2">OpenAI API Key</h3>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => onApiKeyChange(e.target.value)}
        placeholder="Enter your OpenAI API key"
        className="w-full p-2 border border-black"
        autoComplete="off"
        spellCheck="false"
      />
    </div>
  );
};

export default OpenAiSection;