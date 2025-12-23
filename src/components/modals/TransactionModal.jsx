import React, { memo, useState, useEffect } from 'react';
import { X, Plus, Pencil, Search } from 'lucide-react';
import { CURRENCIES, INDUSTRIES, ALL_COUNTRIES, BROKERS } from '../../utils/constants';

/**
 * Modal for adding/editing transactions (holdings)
 */
const TransactionModal = memo(({
  isOpen,
  onClose,
  form,
  setForm,
  editId,
  onSave,
  onSearch,
  searchResults,
  onSelectResult,
  isSearching,
  t,
  fx,
  baseCurr,
  theme
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchQuery.length > 1) {
        onSearch(searchQuery);
      }
    }, 800);
    return () => clearTimeout(delay);
  }, [searchQuery, onSearch]);
  
  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);
  
  const handleFormChange = (field, val) => {
    setForm(prev => {
      const updated = { ...prev, [field]: val };
      
      if (field === 'currency') {
        updated.fxRate = fx[val] || 1;
      }
      
      // Auto-calculate total cost
      const shares = Number(updated.shares) || 0;
      const price = Number(updated.purchasePrice) || 0;
      const commission = Number(updated.commission) || 0;
      
      if (['shares', 'purchasePrice', 'commission', 'commissionCurrency', 'currency', 'totalCostCurrency'].includes(field)) {
        const stockRate = (fx[updated.currency] || 1) / (fx[baseCurr] || 1);
        const commRate = (fx[updated.commissionCurrency] || 1) / (fx[baseCurr] || 1);
        const totalRate = (fx[updated.totalCostCurrency] || 1) / (fx[baseCurr] || 1);
        
        if (field !== 'totalCost') {
          const totalBase = (shares * price * stockRate) + (commission * commRate);
          const newTotal = totalRate > 0 ? (totalBase / totalRate).toFixed(2) : '';
          updated.totalCost = newTotal;
        }
      }
      
      return updated;
    });
  };
  
  const handleTotalChange = (val) => {
    setForm(prev => {
      const total = Number(val);
      const s = Number(prev.shares);
      const c = Number(prev.commission) || 0;
      const stockRate = (fx[prev.currency] || 1) / (fx[baseCurr] || 1);
      const commRate = (fx[prev.commissionCurrency] || 1) / (fx[baseCurr] || 1);
      const totalRate = (fx[prev.totalCostCurrency] || 1) / (fx[baseCurr] || 1);
      
      let p = prev.purchasePrice;
      if (s > 0 && stockRate > 0) {
        const numerator = (total * totalRate) - (c * commRate);
        p = (numerator / (s * stockRate)).toFixed(2);
      }
      
      return { ...prev, totalCost: val, purchasePrice: p };
    });
  };
  
  const handleSelectSearch = (result) => {
    setSearchQuery('');
    onSelectResult(result);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(e);
    onClose();
  };
  
  if (!isOpen) return null;
  
  const inputClass = `w-full p-2.5 rounded-lg border outline-none transition-colors text-sm ${
    theme === 'dark'
      ? 'bg-slate-800 border-slate-600 text-white focus:border-blue-500'
      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
  }`;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
    >
      <div 
        className={`rounded-xl border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative ${
          theme === 'dark' 
            ? 'bg-slate-900 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between ${
          theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <h3 className={`font-bold flex items-center gap-2 text-lg ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            {editId ? <Pencil className="text-blue-500" size={20} /> : <Plus className="text-blue-500" size={20} />}
            {editId ? t.form_title_edit : 'Transaktion'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Search (only when not editing) */}
          {!editId && (
            <div className="mb-5 relative z-20">
              <label className="text-xs opacity-70 font-medium block mb-1.5">Sök aktie eller krypto</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder={t.search_ph}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="loader"></div>
                  </div>
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <ul className={`absolute z-30 top-full mt-1 left-0 right-0 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
                  theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  {searchResults.map((r, i) => (
                    <li
                      key={i}
                      onClick={() => handleSelectSearch(r)}
                      className={`p-3 cursor-pointer border-b text-sm ${
                        theme === 'dark' 
                          ? 'border-slate-700 hover:bg-slate-700' 
                          : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <b>{r.symbol}</b> - {r.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Symbol & Name Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs opacity-70 font-medium block mb-1.5">{t.lbl_symbol}</label>
                <input
                  value={form.symbol}
                  onChange={e => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                  className={inputClass}
                  placeholder="T.ex. VOLV-B.ST"
                  required
                />
              </div>
              <div>
                <label className="text-xs opacity-70 font-medium block mb-1.5">Namn</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  placeholder="Volvo AB"
                />
              </div>
            </div>
            
            {/* Shares & Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs opacity-70 font-medium block mb-1.5">{t.lbl_shares}</label>
                <input
                  type="number"
                  value={form.shares}
                  onChange={e => handleFormChange('shares', e.target.value)}
                  className={inputClass}
                  placeholder="100"
                />
              </div>
              <div>
                <label className="text-xs opacity-70 font-medium block mb-1.5">{t.lbl_currency}</label>
                <select
                  value={form.currency}
                  onChange={e => handleFormChange('currency', e.target.value)}
                  className={inputClass}
                >
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            
            {/* Purchase Price & Current Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-blue-500 block mb-1.5">
                  {t.lbl_purchase_price}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.purchasePrice}
                  onChange={e => handleFormChange('purchasePrice', e.target.value)}
                  className={inputClass}
                  placeholder="150.00"
                />
              </div>
              <div>
                <label className="text-xs opacity-70 font-medium block mb-1.5">{t.lbl_current_price}</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.currentPrice}
                  onChange={e => setForm({ ...form, currentPrice: e.target.value })}
                  className={inputClass}
                  placeholder="155.00"
                />
              </div>
            </div>
            
            {/* Broker */}
            <div>
              <label className="text-xs opacity-70 font-medium block mb-1.5">{t.lbl_broker}</label>
              <select
                value={form.broker}
                onChange={e => setForm({ ...form, broker: e.target.value })}
                className={inputClass}
              >
                {BROKERS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            
            {/* Commission - FIXED PROPORTIONS */}
            <div>
              <label className="text-xs opacity-70 font-medium block mb-1.5">{t.lbl_commission}</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  step="1"
                  value={form.commission}
                  onChange={e => handleFormChange('commission', e.target.value)}
                  className={`col-span-2 ${inputClass}`}
                  placeholder="39"
                />
                <select
                  value={form.commissionCurrency}
                  onChange={e => setForm({ ...form, commissionCurrency: e.target.value })}
                  className={inputClass}
                >
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            
            {/* Total Cost */}
            <div className={`p-3 rounded-lg border ${
              theme === 'dark' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'
            }`}>
              <label className="text-xs font-bold text-blue-500 block mb-1.5">{t.lbl_total_cost}</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  step="1"
                  value={form.totalCost}
                  onChange={e => handleTotalChange(e.target.value)}
                  className={`col-span-2 bg-transparent font-bold text-lg outline-none border-b-2 border-blue-400 dark:border-blue-600 p-1 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}
                  placeholder="15 000"
                />
                <select
                  value={form.totalCostCurrency}
                  onChange={e => setForm({ ...form, totalCostCurrency: e.target.value })}
                  className={`${inputClass} font-bold`}
                >
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            
            {/* Industry & Country */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs opacity-70 block mb-1.5">{t.lbl_industry}</label>
                <select
                  value={form.industry}
                  onChange={e => setForm({ ...form, industry: e.target.value })}
                  className={inputClass}
                >
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs opacity-70 block mb-1.5">{t.lbl_country}</label>
                <select
                  value={form.country}
                  onChange={e => setForm({ ...form, country: e.target.value })}
                  className={inputClass}
                >
                  {ALL_COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            
            {/* Dividend & Beta */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs opacity-70 block mb-1.5">{t.lbl_dividend}</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.dividend}
                  onChange={e => setForm({ ...form, dividend: e.target.value })}
                  className={inputClass}
                  placeholder="5.00"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-orange-500 block mb-1.5">{t.lbl_beta}</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.beta}
                  onChange={e => setForm({ ...form, beta: e.target.value })}
                  className={inputClass}
                  placeholder="1.20"
                />
              </div>
            </div>
            
            {/* Next Dividend Date */}
            <div>
              <label className="text-xs opacity-70 block mb-1.5">{t.lbl_next_div}</label>
              <input
                type="date"
                value={form.nextDivDate}
                onChange={e => setForm({ ...form, nextDivDate: e.target.value })}
                className={inputClass}
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Avbryt
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-md transition-colors"
              >
                {editId ? t.btn_save : t.btn_add}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

TransactionModal.displayName = 'TransactionModal';

export default TransactionModal;

