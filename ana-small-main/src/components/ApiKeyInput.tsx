import React from 'react';

interface ApiKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ apiKey, setApiKey }) => {
  return (
    <div className="p-4 border-b border-black">
      <label htmlFor="apiKey" className="block mb-2 font-bold">OpenAI API Key:</label>
      <input
        type="password"
        id="apiKey"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Enter your OpenAI API key here"
        className="w-full p-2 border border-black"
      />
    </div>
  );
};

export default ApiKeyInput;