import React, { useState, useEffect, memo } from 'react';
import { X } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

/**
 * Modal for updating the current price of a holding
 */
const PriceModal = memo(({
  isOpen,
  onClose,
  onSave,
  stock,
  t,
  theme = 'dark'
}) => {
  const [price, setPrice] = useState('');
  
  // Reset price when modal opens
  useEffect(() => {
    if (isOpen && stock) {
      setPrice(stock.currentPrice || '');
    }
  }, [isOpen, stock]);
  
  if (!isOpen || !stock) return null;
  
  const handleSave = () => {
    const numPrice = parseFloat(price);
    if (!isNaN(numPrice) && numPrice >= 0) {
      onSave(stock.id, numPrice);
      onClose();
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
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
        <h3 className={`text-lg font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          {t.modal_price_title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {stock.symbol} ({stock.currency})
        </p>
        
        {/* Current price info */}
        <div className="mb-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
          <span className="text-xs opacity-70">Nuvarande pris: </span>
          <span className="font-medium">{formatCurrency(stock.currentPrice, stock.currency)}</span>
        </div>
        
        {/* Price input */}
        <div className="mb-6">
          <label className="text-xs font-medium opacity-70 mb-1 block">Nytt pris</label>
          <input 
            type="number" 
            step="0.01"
            min="0"
            value={price} 
            onChange={(e) => setPrice(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full text-3xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none text-center py-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}
            autoFocus
          />
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {t.btn_cancel || 'Avbryt'}
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            {t.btn_save}
          </button>
        </div>
      </div>
    </div>
  );
});

PriceModal.displayName = 'PriceModal';

export default PriceModal;












