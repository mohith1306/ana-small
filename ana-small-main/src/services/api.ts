import { RedshiftCredentials, SqlQueryResult, Message } from '../types';

const API_URL = import.meta.env.VITE_BACKEND_API_URL || 'https://ana-small-worker.ahaym.workers.dev';

// Tool configuration
const TOOLS_CONFIG = {
  'exec-sql': {
    enabled: true,
    definition: {
      type: "function",
      function: {
        name: "exec-sql",
        description: "Execute a SQL query against a Redshift PostgreSQL database",
        parameters: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The SQL query to execute"
            }
          },
          required: ["code"]
        }
      }
    }
  },
  'exec-js': {
    enabled: false,
    definition: {
      type: "function",
      function: {
        name: "exec-js",
        description: "Execute JavaScript code to analyze data and create visualizations",
        parameters: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The JavaScript code to execute"
            },
            data: {
              type: "string",
              description: "JSON string of data to analyze"
            }
          },
          required: ["code"]
        }
      }
    }
  }
};

export async function executeQuery(
  code: string,
  credentials: RedshiftCredentials | { id: string } | null,
  signal?: AbortSignal
): Promise<SqlQueryResult> {
  try {
    const response = await fetch(`${API_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redshiftCredentials: credentials
      }),
      signal
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to execute query');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Query execution error:', error);
    return {
      columns: [],
      rows: [],
      error: error instanceof Error ? error.message : 'Failed to execute query',
      query: code
    };
  }
}

interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
      refusal: null | string;
      tool_calls?: {
        id: string;
        type: string;
        function: {
          name: string;
          arguments: string;
        };
      }[];
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function sendChatRequest(
  messages: Message[],
  signal?: AbortSignal,
  openaiApiKey?: string | null
): Promise<Message> {
  try {
    const enabledTools = Object.values(TOOLS_CONFIG)
      .filter(config => config.enabled)
      .map(config => config.definition);

    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        openaiApiKey: openaiApiKey || null,
        model: "o3-mini",
        messages,
        tools: enabledTools,
        tool_choice: "auto"
      }),
      signal
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to send chat request');
    }

    const data: ChatResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response choices available');
    }

    const choice = data.choices[0];
    if (!choice.message) {
      throw new Error('No message in response choice');
    }

    return {
      role: choice.message.role as Message['role'],
      content: choice.message.content,
      tool_calls: choice.message.tool_calls
    };
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to send chat request');
  }
}