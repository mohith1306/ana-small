import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { UserWarehouse, RedshiftCredentials } from '../types';

export function useUserWarehouses() {
  const [warehouses, setWarehouses] = useState<UserWarehouse[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load warehouses from localStorage
  useEffect(() => {
    const loadWarehouses = () => {
      try {
        // Check for legacy credentials in settings
        const legacySettings = localStorage.getItem('appSettings');
        const parsedLegacySettings = legacySettings ? JSON.parse(legacySettings) : null;
        
        if (parsedLegacySettings?.redshiftCredentials?.host) {
          const legacyCredentials = parsedLegacySettings.redshiftCredentials;
          if (legacyCredentials.host && legacyCredentials.database) {
            // Migrate legacy credentials to new format
            const migratedWarehouse: UserWarehouse = {
              ...legacyCredentials,
              id: 'USER-1',
              name: legacyCredentials.name || 'My Data Warehouse',
              description: legacyCredentials.description || legacyCredentials.host,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('userWarehouses', JSON.stringify([migratedWarehouse]));
            
            // Remove legacy credentials
            delete parsedLegacySettings.redshiftCredentials;
            localStorage.setItem('appSettings', JSON.stringify(parsedLegacySettings));
            
            setWarehouses([migratedWarehouse]);
          }
        } else {
          // Load warehouses from new storage
          const savedWarehouses = localStorage.getItem('userWarehouses');
          const parsedWarehouses = savedWarehouses ? JSON.parse(savedWarehouses) : [];
          setWarehouses(parsedWarehouses);
        }
      } catch (error) {
        console.error('Error loading warehouses:', error);
        setWarehouses([]);
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadWarehouses();
  }, []);

  // Save warehouses to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('userWarehouses', JSON.stringify(warehouses));
    }
  }, [warehouses, isLoaded]);

  const addWarehouse = (credentials: RedshiftCredentials): UserWarehouse => {
    const newWarehouse: UserWarehouse = {
      ...credentials,
      id: `USER-${nanoid()}`,
      name: credentials.name || 'My Data Warehouse',
      description: credentials.description || credentials.host,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setWarehouses(prev => [...prev, newWarehouse]);
    return newWarehouse;
  };

  const updateWarehouse = (id: string, updates: Partial<RedshiftCredentials>) => {
    setWarehouses(prev => prev.map(w => 
      w.id === id 
        ? { 
            ...w, 
            ...updates, 
            name: updates.name || w.name,
            description: updates.description || w.description,
            updatedAt: new Date().toISOString() 
          }
        : w
    ));
  };

  const deleteWarehouse = (id: string) => {
    setWarehouses(prev => prev.filter(w => w.id !== id));
  };

  const getWarehouse = (id: string): UserWarehouse | undefined => {
    return warehouses.find(w => w.id === id);
  };

  return {
    warehouses,
    isLoaded,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getWarehouse
  };
}