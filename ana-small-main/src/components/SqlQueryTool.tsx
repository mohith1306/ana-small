import React, { useState, useEffect } from 'react';
import { RedshiftCredentials, SqlQueryResult } from '../types';
import { executeSqlQuery } from '../services/redshift';
import { Database, AlertCircle } from 'lucide-react';

interface SqlQueryToolProps {
  credentials: RedshiftCredentials;
  onQueryResult: (result: SqlQueryResult) => void;
}

const SqlQueryTool: React.FC<SqlQueryToolProps> = ({ credentials, onQueryResult }) => {
  const [query, setQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<SqlQueryResult | null>(null);
  const [awsCredentialsPresent, setAwsCredentialsPresent] = useState(false);

  // Check if AWS credentials are available in localStorage
  useEffect(() => {
    const accessKeyId = localStorage.getItem('AWS_ACCESS_KEY_ID');
    const secretAccessKey = localStorage.getItem('AWS_SECRET_ACCESS_KEY');
    setAwsCredentialsPresent(!!(accessKeyId && secretAccessKey));
  }, []);

  const executeQuery = async () => {
    if (!query.trim()) return;
    
    setIsExecuting(true);
    try {
      // Check if AWS credentials are available
      if (!awsCredentialsPresent) {
        const errorResult = {
          columns: [],
          rows: [],
          error: 'AWS credentials are required. Please add them in Settings.'
        };
        setResult(errorResult);
        onQueryResult(errorResult);
        return;
      }
      
      // Execute the query
      const queryResult = await executeSqlQuery(credentials, query);
      setResult(queryResult);
      
      // Pass the actual query text with the result
      const resultWithQuery = {
        ...queryResult,
        query: query // Include the actual SQL query text
      };
      
      onQueryResult(resultWithQuery);
    } catch (error) {
      console.error('Error executing query:', error);
      const errorResult: SqlQueryResult = {
        columns: [],
        rows: [],
        error: error instanceof Error ? error.message : 'Failed to execute query',
        query: query // Include the query even on error
      };
      setResult(errorResult);
      onQueryResult(errorResult);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="border border-black p-4 mb-4">
      <div className="flex items-center mb-2">
        <Database size={20} className="mr-2" />
        <h3 className="font-bold">SQL Query Tool</h3>
      </div>
      
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter SQL query..."
        className="w-full p-2 border border-black resize-none mb-2"
        rows={4}
      />
      
      <div className="flex justify-end mb-4">
        <button
          onClick={executeQuery}
          disabled={isExecuting || !query.trim() || !awsCredentialsPresent}
          className="px-4 py-2 bg-black text-white border border-black disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isExecuting ? 'Executing...' : 'Execute Query'}
        </button>
      </div>
      
      {!awsCredentialsPresent && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-300 flex items-start">
          <AlertCircle size={16} className="text-yellow-500 mr-2 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">AWS credentials required</p>
            <p>Please add your AWS credentials in Settings to execute queries.</p>
          </div>
        </div>
      )}
      
      {!credentials.host && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-300 flex items-start">
          <AlertCircle size={16} className="text-yellow-500 mr-2 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">No Redshift credentials provided</p>
            <p>Please add your Redshift credentials in Settings.</p>
          </div>
        </div>
      )}
      
      {result && (
        <div className="border border-black p-2">
          <h4 className="font-bold mb-2">Result:</h4>
          {result.error ? (
            <div className="text-red-500">{result.error}</div>
          ) : (
            <div className="overflow-x-auto">
              {result.rows.length === 0 ? (
                <p>No results returned</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {result.columns.map((col, i) => (
                        <th key={i} className="border border-black p-1 text-left">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i}>
                        {result.columns.map((col, j) => (
                          <td key={j} className="border border-black p-1">{row[col]?.toString() || 'null'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SqlQueryTool;