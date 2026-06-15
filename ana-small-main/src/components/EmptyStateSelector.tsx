import React, { useState, useMemo, useRef } from 'react';
import { RedshiftCredentials, UserWarehouse } from '../types';
import { SAMPLE_WAREHOUSES } from '../constants/sampleWarehouses';
import { SUGGESTED_QUERIES } from '../constants/suggestedQueries';
import { Database, ChevronDown, Send, Plus, Edit2, Trash2 } from 'lucide-react';
import MessageInput from './MessageInput';
import RedshiftConnectorModal from './RedshiftConnectorModal';
import { useClickOutside } from '../hooks/useClickOutside';

interface EmptyStateSelectorProps {
  onQuerySelect: (content: string) => void;
  userWarehouses: UserWarehouse[];
  selectedWarehouseId: string;
  onWarehouseSelect: (id: string, credentials?: RedshiftCredentials) => void;
  onWarehouseUpdate: (id: string, updates: Partial<RedshiftCredentials>) => void;
  onWarehouseDelete: (id: string) => void;
  isLoading: boolean;
  onStopChat: () => void;
}

const EmptyStateSelector: React.FC<EmptyStateSelectorProps> = ({
  onQuerySelect,
  userWarehouses,
  selectedWarehouseId,
  onWarehouseSelect,
  onWarehouseUpdate,
  onWarehouseDelete,
  isLoading,
  onStopChat,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isConnectorModalOpen, setIsConnectorModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<UserWarehouse | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useClickOutside(dropdownRef, () => {
    setIsDropdownOpen(false);
  });
  
  const suggestedQueries = useMemo(() => {
    const warehouseQueries = SUGGESTED_QUERIES.filter(
      query => query.warehouseId === selectedWarehouseId
    );
    
    return [...warehouseQueries]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  }, [selectedWarehouseId]);

  const selectedWarehouse = SAMPLE_WAREHOUSES.find(w => w.id === selectedWarehouseId) ||
    userWarehouses.find(w => w.id === selectedWarehouseId);
  const isSampleWarehouse = selectedWarehouseId.startsWith('SAMPLE-');

  const handleAddConnector = (credentials: RedshiftCredentials) => {
    onWarehouseSelect('USER-1', credentials);
    setIsConnectorModalOpen(false);
  };

  const handleEditWarehouse = (warehouse: UserWarehouse) => {
    setEditingWarehouse(warehouse);
    setIsConnectorModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleUpdateWarehouse = (credentials: RedshiftCredentials) => {
    if (editingWarehouse) {
      onWarehouseUpdate(editingWarehouse.id, credentials);
    }
    setEditingWarehouse(null);
    setIsConnectorModalOpen(false);
  };

  const handleDeleteWarehouse = (id: string) => {
    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      onWarehouseDelete(id);
      if (selectedWarehouseId === id) {
        onWarehouseSelect('SAMPLE-1');
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-xl px-4">
        <div className="mb-8">
          <h1 className="font-system text-sm text-gray-500 mb-2">
            Data Warehouse
          </h1>
          
          <div className="flex gap-2">
            <div className="relative flex-1" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between p-3 border border-black bg-white hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Database size={20} className="text-gray-700" />
                  <span className="font-system text-base font-normal text-black">
                    {selectedWarehouse?.name}
                  </span>
                  {isSampleWarehouse && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-normal">Sample</span>
                  )}
                </div>
                <ChevronDown size={20} className={`text-gray-700 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 border border-black bg-white z-10 divide-y divide-black">
                  {SAMPLE_WAREHOUSES.map((warehouse) => (
                    <button
                      key={warehouse.id}
                      onClick={() => {
                        onWarehouseSelect(warehouse.id);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full p-4 text-left hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-system text-base font-normal text-black">{warehouse.name}</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-normal">Sample</span>
                      </div>
                      <div className="font-system text-sm font-normal text-gray-500">{warehouse.description}</div>
                    </button>
                  ))}
                  {userWarehouses.map((warehouse) => (
                    <div key={warehouse.id} className="p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <button
                          onClick={() => {
                            onWarehouseSelect(warehouse.id);
                            setIsDropdownOpen(false);
                          }}
                          className="flex-grow text-left"
                        >
                          <span className="font-system text-base font-normal text-black">{warehouse.name}</span>
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditWarehouse(warehouse)}
                            className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                            title="Edit warehouse"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteWarehouse(warehouse.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete warehouse"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="font-system text-sm font-normal text-gray-500">{warehouse.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setEditingWarehouse(null);
                setIsConnectorModalOpen(true);
              }}
              className="p-3 border border-black hover:bg-gray-100 transition-colors flex items-center justify-center"
              title="Add Data Warehouse"
            >
              <Plus size={20} className="text-black" />
            </button>
          </div>
        </div>

        {isSampleWarehouse && suggestedQueries.length > 0 && (
          <div className="mb-8">
            <h2 className="font-system text-sm text-gray-500 mb-2">
              Suggested Analyses
            </h2>
            <div className="space-y-2">
              {suggestedQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => onQuerySelect(query.content)}
                  className="w-full text-left p-3 border border-black hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <div className="font-system text-base font-normal text-black mb-1">{query.description}</div>
                      <div className="font-system text-sm font-normal text-gray-500 line-clamp-2">{query.content}</div>
                    </div>
                    <div className="flex-shrink-0">
                      <Send size={20} className="text-gray-400 group-hover:text-black transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <MessageInput
          onSendMessage={onQuerySelect}
          isLoading={isLoading}
          onStopChat={onStopChat}
          variant="landing"
        />
      </div>

      <RedshiftConnectorModal
        isOpen={isConnectorModalOpen}
        onClose={() => {
          setIsConnectorModalOpen(false);
          setEditingWarehouse(null);
        }}
        onSave={editingWarehouse ? handleUpdateWarehouse : handleAddConnector}
        initialCredentials={editingWarehouse || undefined}
      />
    </div>
  );
};

export default EmptyStateSelector;