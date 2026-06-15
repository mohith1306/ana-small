import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { RedshiftCredentials } from '../types';
import RedshiftCredentialsSection from './settings/RedshiftCredentialsSection';
import { useClickOutside } from '../hooks/useClickOutside';
import { testRedshiftConnection } from '../services/redshift';

interface RedshiftConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (credentials: RedshiftCredentials) => void;
  initialCredentials?: RedshiftCredentials | null;
}

const DEFAULT_CREDENTIALS: RedshiftCredentials = {
  host: '',
  port: 3306,
  database: '',
  user: '',
  password: '',
  schema: '',
  name: '',
  description: ''
};

const RedshiftConnectorModal: React.FC<RedshiftConnectorModalProps> = ({ 
  isOpen, 
  onClose,
  onSave,
  initialCredentials = null
}) => {
  const [credentials, setCredentials] = useState<RedshiftCredentials>(DEFAULT_CREDENTIALS);
  
  // Reset form when modal opens/closes or initialCredentials changes
  useEffect(() => {
    if (isOpen) {
      setCredentials(initialCredentials || DEFAULT_CREDENTIALS);
      setError('');
    }
  }, [isOpen, initialCredentials]);
  
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  useClickOutside(modalRef, () => {
    if (isOpen && !isLoading) onClose();
  });

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!credentials.name?.trim()) {
      setError('Please provide a nickname for this warehouse');
      return;
    }

    if (!credentials.description?.trim()) {
      setError('Please provide a description for this warehouse');
      return;
    }

    const engine = credentials.engine || 'mysql';

    if (!credentials.host?.trim()) {
      setError(
        engine === 'snowflake'
          ? 'Please provide an account identifier'
          : engine === 'databricks'
          ? 'Please provide a server hostname'
          : engine === 'bigquery'
          ? 'Please provide a project ID'
          : 'Please provide a host address'
      );
      return;
    }

    if (engine === 'databricks' && !credentials.httpPath?.trim()) {
      setError('Please provide the SQL warehouse HTTP path');
      return;
    }

    if (engine === 'snowflake' && !credentials.warehouse?.trim()) {
      setError('Please provide a warehouse name');
      return;
    }

    // BigQuery has no database field; ClickHouse defaults the database, so both are optional there.
    const databaseRequired = ['mysql', 'postgres', 'databricks', 'snowflake'].includes(engine);
    if (databaseRequired && !credentials.database?.trim()) {
      setError(engine === 'databricks' ? 'Please provide a catalog name' : 'Please provide a database name');
      return;
    }

    // Databricks (token) and BigQuery (key/ADC) don't use a username; ClickHouse defaults it.
    const usernameRequired = ['mysql', 'postgres', 'snowflake'].includes(engine);
    if (usernameRequired && !credentials.user?.trim()) {
      setError('Please provide a username');
      return;
    }

    // BigQuery may use local gcloud credentials (blank key); ClickHouse may have an empty password.
    const passwordRequired = ['mysql', 'postgres', 'snowflake', 'databricks'].includes(engine);
    if (passwordRequired && !credentials.password?.trim()) {
      setError(engine === 'databricks' ? 'Please provide an access token' : 'Please provide a password');
      return;
    }

    if (!credentials.schema?.trim()) {
      setError(engine === 'bigquery' ? 'Please provide a dataset name' : 'Please provide a schema name');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await testRedshiftConnection(credentials);
      
      if (result.error) {
        setError('Connection to warehouse failed. Verify your inputted credentials.');
        setIsLoading(false);
        return;
      }

      if (!result.rows || result.rows.length === 0) {
        setError(`Connection successful, but no tables were found with schema ${credentials.schema}. Verify your schema name.`);
        setIsLoading(false);
        return;
      }

      onSave({
        ...credentials,
        name: credentials.name.trim(),
        description: credentials.description.trim(),
        schema: credentials.schema.trim()
      });
    } catch (err) {
      setError('Connection to warehouse failed. Verify your inputted credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white p-6 rounded w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{initialCredentials ? 'Edit Data Warehouse' : 'Add Data Warehouse'}</h2>
          <button onClick={onClose} className="p-1" disabled={isLoading}>
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Warehouse Details */}
          <div>
            <h3 className="font-bold mb-2">Warehouse Details</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm mb-1">Nickname</label>
                <input
                  type="text"
                  value={credentials.name}
                  onChange={(e) => setCredentials(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Production Warehouse"
                  className="w-full p-2 border border-black"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Description</label>
                <textarea
                  value={credentials.description}
                  onChange={(e) => setCredentials(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Production data warehouse containing customer and sales data"
                  className="w-full p-2 border border-black resize-none"
                  rows={2}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Connection Details */}
          <RedshiftCredentialsSection 
            credentials={credentials}
            onChange={setCredentials}
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-500 text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-black hover:bg-gray-100"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-black text-white border border-black hover:bg-gray-800 disabled:bg-gray-400 disabled:border-gray-400"
          >
           {isLoading ? 'Testing Connection...' : initialCredentials ? 'Save Changes' : 'Add Warehouse'}
          </button>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          The credentials to your data warehouse are securely stored in your browser's local storage.
        </p>
      </div>
    </div>
  );
};

export default RedshiftConnectorModal;