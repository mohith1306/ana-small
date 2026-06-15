import React from 'react';

interface SystemPromptProps {
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
}

const SystemPrompt: React.FC<SystemPromptProps> = ({ systemPrompt, setSystemPrompt }) => {
  return (
    <div className="p-4 border-b border-black">
      <label htmlFor="systemPrompt" className="block mb-2 font-bold">System Prompt:</label>
      <div className="flex">
        <textarea
          id="systemPrompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="flex-grow p-2 border border-black resize-none"
          rows={2}
        />
      </div>
    </div>
  );
};

export default SystemPrompt;