import { JavaScriptExecutionResult, VisualizationResult } from '../types';
import { nanoid } from 'nanoid';

const MAX_CONTENT_LENGTH = 25000;
const TRIM_MESSAGE = '\n\n[Content has been trimmed due to length]';

function trimOutput(output: string | null | undefined): string {
  if (!output) {
    return '';
  }
  if (output.length <= MAX_CONTENT_LENGTH) {
    return output;
  }
  return output.substring(0, MAX_CONTENT_LENGTH) + TRIM_MESSAGE;
}

// This function will execute JavaScript code in a controlled environment
export async function executeJavaScript(
  code: string, 
  data?: string
): Promise<JavaScriptExecutionResult> {
  try {
    // Create a container for visualizations
    const visualizations: VisualizationResult[] = [];
    
    // Create a function to register visualizations
    const registerVisualization = (type: 'chart' | 'plotly', data: any, options?: any) => {
      const id = nanoid();
      visualizations.push({ type, data, options, id });
      return id;
    };
    
    // Parse the data if provided
    let parsedData = null;
    if (data) {
      try {
        parsedData = JSON.parse(data);
      } catch (error) {
        return {
          output: '',
          error: `Error parsing data: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
    
    // Create a function to capture console.log output
    let output = '';
    const log = (...args: any[]) => {
      output += args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ') + '\n';
    };
    
    // Create a safe execution environment with libraries
    const executionEnvironment = {
      // Libraries will be injected at runtime from the global scope
      Chart: window.Chart,
      dfd: window.dfd,
      math: window.math,
      ss: window.ss,
      _: window._,
      dateFns: window.dateFns,
      Plotly: window.Plotly,
      
      // Utilities
      console: { log },
      data: parsedData,
      registerVisualization,
      
      // Standard JavaScript objects
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      Date,
      Math,
      RegExp,
      Error,
      Map,
      Set,
      Promise,
      
      // Prevent access to sensitive browser APIs
      document: undefined,
      window: undefined,
      localStorage: undefined,
      sessionStorage: undefined,
      fetch: undefined,
      XMLHttpRequest: undefined
    };
    
    // Wrap the code in an async function to allow await
    const wrappedCode = `
      (async function() {
        try {
          // Explicitly warn about DOM manipulation attempts
          if (${code.includes('document.') || code.includes('window.') || code.includes('createElement') || code.includes('getElementById')}) {
            throw new Error('DOM manipulation is not allowed. Use registerVisualization() instead.');
          }
          
          // Log the data that's available to the script
          if (data) {
            console.log('Data available for visualization:', 
              Array.isArray(data) ? \`Array with \${data.length} items\` : 
              typeof data === 'object' ? \`Object with keys: \${Object.keys(data).join(', ')}\` : 
              \`\${typeof data}: \${JSON.stringify(data).substring(0, 100)}...\`
            );
          } else {
            console.log('No data provided for visualization');
          }
          
          ${code}
        } catch (error) {
          console.log('Execution error:', error.message);
        }
      })()
    `;
    
    // Execute the code in the controlled environment
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const fn = new AsyncFunction(...Object.keys(executionEnvironment), wrappedCode);
    await fn(...Object.values(executionEnvironment));
    
    return {
      output: trimOutput(output),
      visualizations: visualizations.length > 0 ? visualizations : undefined
    };
  } catch (error) {
    console.error('JavaScript execution error:', error);
    return {
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error during JavaScript execution'
    };
  }
}