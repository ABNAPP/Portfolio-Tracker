import React, { memo } from 'react';
import { X, Layers } from 'lucide-react';

/**
 * Modal for selecting which source/broker to edit when a holding has multiple sources
 */
const EditSourceModal = memo(({
  isOpen,
  onClose,
  stock,
  onSelect,
  t,
  theme = 'dark'
}) => {
  if (!isOpen || !stock) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
    >
      <div 
        className={`rounded-xl border shadow-2xl w-full max-w-sm p-6 relative ${
          theme === 'dark' 
            ? 'bg-slate-900 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X size={20} />
        </button>
        
        {/* Header */}
        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          <Layers size={20} className="text-blue-500" />
          {t.select_holding_edit}
        </h3>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-bold">
          {stock.symbol}
        </p>
        
        {/* Source list */}
        <div className="space-y-2">
          {stock.sources?.map(src => (
            <button 
              key={src.id}
              onClick={() => onSelect(src)}
              className={`w-full text-left p-3 rounded border transition-colors flex justify-between items-center ${
                theme === 'dark'
                  ? 'border-slate-700 hover:bg-slate-800 hover:border-blue-500'
                  : 'border-slate-200 hover:bg-slate-50 hover:border-blue-500'
              }`}
            >
              <span className="font-bold">{src.broker || 'Övrigt'}</span>
              <span className="text-sm opacity-70">{src.shares} st</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

EditSourceModal.displayName = 'EditSourceModal';

export default EditSourceModal;












