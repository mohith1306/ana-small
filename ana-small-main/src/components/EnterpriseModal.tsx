import React, { useRef } from 'react';
import { X } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';
import EnterpriseFeatureComparison from './EnterpriseFeatureComparison';

interface EnterpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EnterpriseModal: React.FC<EnterpriseModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useClickOutside(modalRef, () => {
    if (isOpen) onClose();
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-8">
          <div className="flex-grow text-center">
            <h2 className="font-system text-[2.5em] leading-[1.3] font-light">Compare</h2>
            <h1 className="font-system text-[3.25em] leading-[1.3] font-regular">Ana For Enterprise</h1>
            <hr className="w-144 mx-auto mt-4 border-t-2 border-gray-300" />
          </div>
          <button 
            onClick={onClose} 
            className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <EnterpriseFeatureComparison />
          
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Ready to upgrade?</h3>
            <p className="text-gray-600 mb-4">
              Learn more about how Ana Enterprise can help your organization by booking a demo with us—it's quick and easy.
            </p>
            <a 
              href="https://textql.com/demo" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Book a Demo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseModal;