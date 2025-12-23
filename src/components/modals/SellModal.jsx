import React, { useState, useEffect, useMemo, memo } from 'react';
import { X, Banknote } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { CURRENCIES } from '../../utils/constants';

/**
 * Modal for registering a sale of holdings
 */
const SellModal = memo(({
  isOpen,
  onClose,
  onSell,
  stock,
  t,
  fx,
  theme = 'dark',
  baseCurr = 'SEK',
  privacyMode = false
}) => {
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [shares, setShares] = useState('');
  const [price, setPrice] = useState('');
  const [commission, setCommission] = useState('');
  const [commissionCurrency, setCommissionCurrency] = useState('SEK');
  const [destination, setDestination] = useState('cash'); // 'cash' or 'loan'
  
  // Get sources (different broker entries for same stock)
  // Handle null stock case to prevent errors
  const sources = useMemo(() => {
    if (!stock) return [];
    return stock.sources || [stock];
  }, [stock]);
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && stock && sources.length > 0) {
      const defaultSource = sources[0];
      setSelectedSourceId(defaultSource?.id?.toString() || '');
      setShares(defaultSource?.shares?.toString() || '');
      setPrice(stock.currentPrice?.toString() || '');
      setCommission('');
      setCommissionCurrency('SEK');
      setDestination('cash');
    }
  }, [isOpen, stock, sources]);
  
  // Update shares when source changes
  useEffect(() => {
    const currentSource = sources.find(src => src.id === Number(selectedSourceId));
    if (currentSource) {
      setShares(currentSource.shares.toString());
    }
  }, [selectedSourceId, sources]);
  
  if (!isOpen || !stock || sources.length === 0) return null;
  
  const currentSource = sources.find(src => src?.id === Number(selectedSourceId)) || sources[0];
  const maxShares = currentSource?.shares || 0;
  
  // Calculate estimated total
  const estTotal = useMemo(() => {
    const qty = parseFloat(shares) || 0;
    const prc = parseFloat(price) || 0;
    const comm = parseFloat(commission) || 0;
    
    const stockFx = fx[stock.currency] || 1;
    const commFx = fx[commissionCurrency] || 1;
    
    return (qty * prc * stockFx) - (comm * commFx);
  }, [shares, price, commission, commissionCurrency, stock, fx]);
  
  const handleSell = () => {
    const qty = parseFloat(shares);
    const prc = parseFloat(price);
    const comm = parseFloat(commission) || 0;
    
    if (qty > 0 && prc > 0 && qty <= maxShares) {
      onSell(Number(selectedSourceId), qty, prc, comm, commissionCurrency, destination);
      onClose();
    }
  };
  
  const inputClass = `w-full p-2 rounded border outline-none transition-colors ${
    theme === 'dark'
      ? 'bg-slate-750 border-slate-600 text-white focus:border-blue-500'
      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
  }`;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
    >
      <div 
        className={`rounded-xl border shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto ${
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
          <Banknote className="text-emerald-500" size={20} />
          {t.modal_sell_title}
        </h3>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-bold">
          {stock.symbol}
        </p>
        
        <div className="space-y-4">
          {/* Source selection (if multiple brokers) */}
          {sources.length > 1 && (
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 font-bold block mb-1">
                {t.sell_broker_label}
              </label>
              <select 
                value={selectedSourceId} 
                onChange={(e) => setSelectedSourceId(e.target.value)}
                className={inputClass}
              >
                {sources.filter(Boolean).map(src => (
                  <option key={src.id} value={src.id}>
                    {src.broker || 'Övrigt'} ({src.shares} st)
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Single broker info */}
          {sources.length === 1 && sources[0] && (
            <p className="text-xs text-slate-500 mb-2">
              {t.lbl_broker}: <span className="font-bold text-slate-700 dark:text-slate-300">
                {sources[0].broker || 'Övrigt'}
              </span>
            </p>
          )}
          
          {/* Shares input */}
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              {t.lbl_shares} (Max: {maxShares})
            </label>
            <input 
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              max={maxShares}
              min={0}
              className={inputClass}
            />
          </div>
          
          {/* Price input */}
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              {t.lbl_current_price} ({stock.currency})
            </label>
            <input 
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
            />
          </div>
          
          {/* Commission */}
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
              {t.lbl_commission}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input 
                type="number"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className={`col-span-2 ${inputClass}`}
                placeholder="39"
              />
              <select 
                value={commissionCurrency}
                onChange={(e) => setCommissionCurrency(e.target.value)}
                className={inputClass}
              >
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          
          {/* Destination selection */}
          <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'}`}>
            <label className="text-xs text-slate-500 dark:text-slate-400 block mb-2">
              {t.sell_dest_label}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-500 transition-colors">
                <input 
                  type="radio" 
                  name="destination" 
                  value="cash"
                  checked={destination === 'cash'}
                  onChange={() => setDestination('cash')}
                  className="accent-emerald-500 w-4 h-4"
                />
                {t.sell_dest_cash}
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-500 transition-colors">
                <input 
                  type="radio" 
                  name="destination" 
                  value="loan"
                  checked={destination === 'loan'}
                  onChange={() => setDestination('loan')}
                  className="accent-emerald-500 w-4 h-4"
                />
                {t.sell_dest_loan}
              </label>
            </div>
          </div>
          
          {/* Estimated total */}
          <div className={`text-right text-sm font-bold pt-2 border-t ${
            theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
          } ${estTotal >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            Netto: {estTotal >= 0 ? '+' : ''} 
            {privacyMode ? '***' : formatCurrency(estTotal, baseCurr)}
          </div>
        </div>
        
        {/* Action button */}
        <button 
          onClick={handleSell}
          disabled={!shares || !price || parseFloat(shares) > maxShares}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg mt-4 shadow-lg transition-all"
        >
          {t.btn_sell}
        </button>
      </div>
    </div>
  );
});

SellModal.displayName = 'SellModal';

export default SellModal;


