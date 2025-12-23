import React, { memo } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';

/**
 * Modal for selecting which source to delete or deleting all
 */
const DeleteSourceModal = memo(({
  isOpen,
  onClose,
  stock,
  onDelete,
  onDeleteAll,
  t,
  theme = 'dark'
}) => {
  if (!isOpen || !stock) return null;
  
  const handleDeleteAll = () => {
    if (window.confirm(t.delete_confirm_all)) {
      onDeleteAll(stock.symbol);
    }
  };
  
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
        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 text-rose-500`}>
          <Trash2 size={20} />
          {t.select_holding_delete}
        </h3>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-bold">
          {stock.symbol}
        </p>
        
        {/* Warning */}
        <div className={`flex items-start gap-2 p-3 rounded-lg mb-4 ${
          theme === 'dark' ? 'bg-rose-900/20' : 'bg-rose-50'
        }`}>
          <AlertTriangle className="text-rose-500 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-xs text-rose-600 dark:text-rose-400">
            Denna åtgärd kan inte ångras. Välj vilken post du vill radera.
          </p>
        </div>
        
        {/* Source list */}
        <div className="space-y-2 mb-4">
          {stock.sources?.map(src => (
            <button 
              key={src.id}
              onClick={() => onDelete(src.id)}
              className={`w-full text-left p-3 rounded border transition-colors flex justify-between items-center group ${
                theme === 'dark'
                  ? 'border-rose-900/30 hover:bg-rose-900/20 hover:border-rose-500'
                  : 'border-rose-100 hover:bg-rose-50 hover:border-rose-300'
              }`}
            >
              <span className="font-bold group-hover:text-rose-600 transition-colors">
                {src.broker || 'Övrigt'}
              </span>
              <span className="text-sm opacity-70">{src.shares} st</span>
            </button>
          ))}
        </div>
        
        {/* Delete all button */}
        <button 
          onClick={handleDeleteAll}
          className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Trash2 size={16} />
          {t.btn_delete_all}
        </button>
      </div>
    </div>
  );
});

DeleteSourceModal.displayName = 'DeleteSourceModal';

export default DeleteSourceModal;












