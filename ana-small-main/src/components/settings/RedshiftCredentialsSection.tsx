import React, { useState } from 'react';
import { RedshiftCredentials, SqlQueryResult } from '../../types';
import { testRedshiftConnection } from '../../services/redshift';
import { Database, Check, AlertCircle, Loader2 } from 'lucide-react';

interface RedshiftCredentialsSectionProps {
  credentials: RedshiftCredentials;
  onChange: (credentials: RedshiftCredentials) => void;
  disabled?: boolean;
}

const RedshiftCredentialsSection: React.FC<RedshiftCredentialsSectionProps> = ({ 
  credentials, 
  onChange,
  disabled = false
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<SqlQueryResult | null>(null);

  const updateField = (field: keyof RedshiftCredentials, value: string | number) => {
    onChange({
      ...credentials,
      [field]: field === 'port' ? Number(value) : value
    });
  };

  const engine = credentials.engine || 'mysql';
  // engines that connect with a plain host + port
  const showHostPort = engine === 'mysql' || engine === 'postgres' || engine === 'clickhouse';

  // Sensible default ports so the user doesn't have to type (and mistype) them.
  const DEFAULT_PORTS: Record<string, number> = { mysql: 3306, postgres: 5432, clickhouse: 8443 };

  const handleEngineChange = (newEngine: string) => {
    onChange({
      ...credentials,
      engine: newEngine as RedshiftCredentials['engine'],
      port: DEFAULT_PORTS[newEngine] ?? credentials.port,
    });
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Attempt real connection
      const result = await testRedshiftConnection(credentials);
      setTestResult(result);
    } catch (error) {
      console.error('Connection test failed:', error);
      setTestResult({
        columns: [],
        rows: [],
        error: error instanceof Error ? error.message : 'Connection test failed'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Connection</h3>
      </div>

      <div className="space-y-2">
        <div>
          <label className="block text-sm mb-1">Database Engine</label>
          <select
            value={engine}
            onChange={(e) => handleEngineChange(e.target.value)}
            className="w-full p-2 border border-black bg-white"
            disabled={disabled}
          >
            <option value="mysql">MySQL</option>
            <option value="postgres">PostgreSQL / Redshift</option>
            <option value="databricks">Databricks</option>
            <option value="snowflake">Snowflake</option>
            <option value="clickhouse">ClickHouse</option>
            <option value="bigquery">BigQuery</option>
          </select>
        </div>

        {/* Host / Server / Account */}
        <div>
          <label className="block text-sm mb-1">
            {engine === 'databricks'
              ? 'Server Hostname'
              : engine === 'snowflake'
              ? 'Account Identifier'
              : engine === 'bigquery'
              ? 'Project ID'
              : 'Host'}
          </label>
          <input
            type="text"
            value={credentials.host}
            onChange={(e) => updateField('host', e.target.value)}
            placeholder={
              engine === 'databricks'
                ? 'dbc-xxxxxxxx.cloud.databricks.com'
                : engine === 'snowflake'
                ? 'xy12345.us-east-1'
                : engine === 'bigquery'
                ? 'my-gcp-project'
                : 'localhost'
            }
            className="w-full p-2 border border-black"
            autoComplete="off"
            spellCheck="false"
            disabled={disabled}
          />
        </div>

        {/* Port (host/port engines only) */}
        {showHostPort && (
          <div>
            <label className="block text-sm mb-1">Port</label>
            <input
              type="number"
              value={credentials.port}
              onChange={(e) => updateField('port', e.target.value)}
              placeholder={engine === 'postgres' ? '5432' : engine === 'clickhouse' ? '8123' : '3306'}
              className="w-full p-2 border border-black"
              autoComplete="off"
              spellCheck="false"
              disabled={disabled}
            />
          </div>
        )}

        {/* Databricks: HTTP Path */}
        {engine === 'databricks' && (
          <div>
            <label className="block text-sm mb-1">HTTP Path</label>
            <input
              type="text"
              value={credentials.httpPath || ''}
              onChange={(e) => updateField('httpPath', e.target.value)}
              placeholder="/sql/1.0/warehouses/abc123def456"
              className="w-full p-2 border border-black"
              autoComplete="off"
              spellCheck="false"
              disabled={disabled}
            />
          </div>
        )}

        {/* Snowflake: Warehouse */}
        {engine === 'snowflake' && (
          <div>
            <label className="block text-sm mb-1">Warehouse</label>
            <input
              type="text"
              value={credentials.warehouse || ''}
              onChange={(e) => updateField('warehouse', e.target.value)}
              placeholder="COMPUTE_WH"
              className="w-full p-2 border border-black"
              autoComplete="off"
              spellCheck="false"
              disabled={disabled}
            />
          </div>
        )}

        {/* Database / Catalog (BigQuery uses project + dataset, no database field) */}
        {engine !== 'bigquery' && (
          <div>
            <label className="block text-sm mb-1">{engine === 'databricks' ? 'Catalog' : 'Database'}</label>
            <input
              type="text"
              value={credentials.database}
              onChange={(e) => updateField('database', e.target.value)}
              placeholder={
                engine === 'databricks'
                  ? 'main'
                  : engine === 'snowflake'
                  ? 'MY_DB'
                  : engine === 'clickhouse'
                  ? 'default'
                  : 'anasmall'
              }
              className="w-full p-2 border border-black"
              autoComplete="off"
              spellCheck="false"
              disabled={disabled}
            />
          </div>
        )}

        {/* Schema / Dataset (all engines) */}
        <div>
          <label className="block text-sm mb-1">{engine === 'bigquery' ? 'Dataset' : 'Schema'}</label>
          <input
            type="text"
            value={credentials.schema}
            onChange={(e) => updateField('schema', e.target.value)}
            placeholder={
              engine === 'snowflake'
                ? 'PUBLIC'
                : engine === 'mysql'
                ? 'anasmall'
                : engine === 'bigquery'
                ? 'my_dataset'
                : 'default'
            }
            className="w-full p-2 border border-black"
            autoComplete="off"
            spellCheck="false"
            disabled={disabled}
          />
        </div>

        {/* Snowflake: Role (optional) */}
        {engine === 'snowflake' && (
          <div>
            <label className="block text-sm mb-1">Role (optional)</label>
            <input
              type="text"
              value={credentials.role || ''}
              onChange={(e) => updateField('role', e.target.value)}
              placeholder="ACCOUNTADMIN"
              className="w-full p-2 border border-black"
              autoComplete="off"
              spellCheck="false"
              disabled={disabled}
            />
          </div>
        )}

        {/* Username (not used by Databricks token auth or BigQuery key auth) */}
        {engine !== 'databricks' && engine !== 'bigquery' && (
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input
              type="text"
              value={credentials.user}
              onChange={(e) => updateField('user', e.target.value)}
              placeholder={engine === 'snowflake' ? 'jdoe' : engine === 'clickhouse' ? 'default' : 'root'}
              className="w-full p-2 border border-black"
              autoComplete="off"
              spellCheck="false"
              disabled={disabled}
            />
          </div>
        )}

        {/* Password / Access Token / Service Account Key */}
        <div>
          <label className="block text-sm mb-1">
            {engine === 'databricks'
              ? 'Access Token'
              : engine === 'bigquery'
              ? 'Service Account JSON (leave blank to use local gcloud credentials)'
              : 'Password'}
          </label>
          {engine === 'bigquery' ? (
            <textarea
              value={credentials.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder='{ "type": "service_account", "project_id": "...", ... }'
              className="w-full p-2 border border-black font-mono text-xs resize-none"
              rows={4}
              autoComplete="off"
              spellCheck="false"
              disabled={disabled}
            />
          ) : (
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder={engine === 'databricks' ? 'dapi...' : '••••••••'}
              className="w-full p-2 border border-black"
              autoComplete="off"
              spellCheck="false"
              disabled={disabled}
            />
          )}
        </div>

        <div className="mt-2">
          <button
            onClick={testConnection}
            disabled={isTesting || !credentials.host || !credentials.schema || disabled}
            className="px-4 py-2 border border-black hover:bg-gray-100 flex items-center disabled:bg-gray-100 disabled:border-gray-300 disabled:cursor-not-allowed"
          >
            {isTesting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Database size={16} className="mr-2" />
                Test Connection
              </>
            )}
          </button>
        </div>
        
        {testResult && (
          <div className={`mt-2 p-3 border ${testResult.error ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
            <div className="flex items-center mb-2">
              {testResult.error ? (
                <>
                  <AlertCircle size={16} className="text-red-500 mr-2" />
                  <span className="font-bold text-red-500">Connection Failed</span>
                </>
              ) : (
                <>
                  <Check size={16} className="text-green-500 mr-2" />
                  <span className="font-bold text-green-500">Connection Successful</span>
                </>
              )}
            </div>
            
            {testResult.error ? (
              <div className="text-red-500">{testResult.error}</div>
            ) : (
              <div className="overflow-x-auto max-h-40">
                <p className="mb-1">Tables in schema <code>{credentials.schema}</code>:</p>
                {testResult.rows.length === 0 ? (
                  <p className="italic">No tables found in this schema</p>
                ) : (
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        {testResult.columns.map((col, i) => (
                          <th key={i} className="border border-black p-1 text-left">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {testResult.rows.map((row, i) => (
                        <tr key={i}>
                          {testResult.columns.map((col, j) => (
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
    </div>
  );
};

export default RedshiftCredentialsSection;