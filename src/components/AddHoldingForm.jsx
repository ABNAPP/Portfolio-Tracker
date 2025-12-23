import React, { memo, useState, useEffect } from 'react';
import { Plus, Pencil, Search } from 'lucide-react';
import { CURRENCIES, INDUSTRIES, ALL_COUNTRIES, BROKERS, CRYPTO_SYMBOLS } from '../utils/constants';

/**
 * Form for adding or editing holdings
 */
const AddHoldingForm = memo(({
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
      const t = Number(val);
      const s = Number(prev.shares);
      const c = Number(prev.commission) || 0;
      const stockRate = (fx[prev.currency] || 1) / (fx[baseCurr] || 1);
      const commRate = (fx[prev.commissionCurrency] || 1) / (fx[baseCurr] || 1);
      const totalRate = (fx[prev.totalCostCurrency] || 1) / (fx[baseCurr] || 1);
      
      let p = prev.purchasePrice;
      if (s > 0 && stockRate > 0) {
        const numerator = (t * totalRate) - (c * commRate);
        p = (numerator / (s * stockRate)).toFixed(2);
      }
      
      return { ...prev, totalCost: val, purchasePrice: p };
    });
  };
  
  const handleSelectSearch = (result) => {
    setSearchQuery('');
    onSelectResult(result);
  };
  
  const inputClass = `w-full p-2 rounded border outline-none transition-colors ${
    theme === 'dark'
      ? 'bg-slate-750 border-slate-600 text-white focus:border-blue-500'
      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
  }`;
  
  return (
    <div className={`rounded-xl border shadow-sm p-5 h-fit sticky top-24 ${
      theme === 'dark' ? 'bg-slate-850 border-slate-700' : 'bg-white border-slate-200'
    }`}>
      <h3 className={`font-bold mb-4 flex items-center gap-2 text-lg ${
        theme === 'dark' ? 'text-white' : 'text-slate-900'
      }`}>
        {editId ? <Pencil className="text-blue-500" size={20} /> : <Plus className="text-blue-500" size={20} />}
        {editId ? t.form_title_edit : t.form_title_add}
      </h3>
      
      {/* Search (only when not editing) */}
      {!editId && (
        <div className="mb-4 relative z-20">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`${inputClass} pl-9`}
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
            <ul className={`absolute z-30 top-12 left-0 right-0 border rounded shadow-lg max-h-60 overflow-y-auto ${
              theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              {searchResults.map((r, i) => (
                <li
                  key={i}
                  onClick={() => handleSelectSearch(r)}
                  className={`p-2 cursor-pointer border-b text-sm ${
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
      <form onSubmit={onSave} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Symbol */}
          <div className="col-span-2">
            <label className="text-xs opacity-70 font-medium block mb-1">{t.lbl_symbol}</label>
            <input
              value={form.symbol}
              onChange={e => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
              className={inputClass}
              placeholder="Symbol"
              required
            />
          </div>
          
          {/* Name */}
          <div className="col-span-2">
            <label className="text-xs opacity-70 font-medium block mb-1">Namn</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="Namn"
            />
          </div>
          
          {/* Shares */}
          <div>
            <label className="text-xs opacity-70 font-medium block mb-1">{t.lbl_shares}</label>
            <input
              type="number"
              value={form.shares}
              onChange={e => handleFormChange('shares', e.target.value)}
              className={inputClass}
              placeholder={t.lbl_shares}
            />
          </div>
          
          {/* Currency */}
          <div>
            <label className="text-xs opacity-70 font-medium block mb-1">{t.lbl_currency}</label>
            <select
              value={form.currency}
              onChange={e => handleFormChange('currency', e.target.value)}
              className={inputClass}
            >
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          
          {/* Purchase Price (GAV) */}
          <div>
            <label className="text-xs opacity-70 font-bold text-blue-500 block mb-1">
              {t.lbl_purchase_price}
            </label>
            <input
              type="number"
              step="0.01"
              value={form.purchasePrice}
              onChange={e => handleFormChange('purchasePrice', e.target.value)}
              className={inputClass}
              placeholder="GAV"
            />
          </div>
          
          {/* Current Price */}
          <div>
            <label className="text-xs opacity-70 font-bold block mb-1">{t.lbl_current_price}</label>
            <input
              type="number"
              step="0.01"
              value={form.currentPrice}
              onChange={e => setForm({ ...form, currentPrice: e.target.value })}
              className={inputClass}
              placeholder="Pris"
            />
          </div>
          
          {/* Broker */}
          <div className="col-span-2">
            <label className="text-xs opacity-70 font-medium block mb-1">{t.lbl_broker}</label>
            <select
              value={form.broker}
              onChange={e => setForm({ ...form, broker: e.target.value })}
              className={inputClass}
            >
              {BROKERS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          
          {/* Commission */}
          <div className="col-span-2">
            <label className="text-xs opacity-70 font-medium block mb-1">{t.lbl_commission}</label>
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
          <div className={`col-span-2 p-2 rounded border ${
            theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
          }`}>
            <label className="text-xs font-bold text-blue-500 block mb-1">{t.lbl_total_cost}</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="1"
                value={form.totalCost}
                onChange={e => handleTotalChange(e.target.value)}
                className="w-full bg-transparent font-bold outline-none border-b border-blue-300 dark:border-blue-700"
              />
              <select
                value={form.totalCostCurrency}
                onChange={e => setForm({ ...form, totalCostCurrency: e.target.value })}
                className="bg-transparent text-xs font-bold outline-none cursor-pointer"
              >
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          
          {/* Industry */}
          <div>
            <label className="text-xs opacity-70 block mb-1">{t.lbl_industry}</label>
            <select
              value={form.industry}
              onChange={e => setForm({ ...form, industry: e.target.value })}
              className={inputClass}
            >
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          
          {/* Country */}
          <div>
            <label className="text-xs opacity-70 block mb-1">{t.lbl_country}</label>
            <select
              value={form.country}
              onChange={e => setForm({ ...form, country: e.target.value })}
              className={inputClass}
            >
              {ALL_COUNTRIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          
          {/* Dividend */}
          <div>
            <label className="text-xs opacity-70 block mb-1">{t.lbl_dividend}</label>
            <input
              type="number"
              step="0.01"
              value={form.dividend}
              onChange={e => setForm({ ...form, dividend: e.target.value })}
              className={inputClass}
            />
          </div>
          
          {/* Beta */}
          <div>
            <label className="text-xs opacity-70 font-bold text-orange-500 block mb-1">{t.lbl_beta}</label>
            <input
              type="number"
              step="0.01"
              value={form.beta}
              onChange={e => setForm({ ...form, beta: e.target.value })}
              className={inputClass}
            />
          </div>
          
          {/* Next Dividend Date */}
          <div className="col-span-2">
            <label className="text-xs opacity-70 block mb-1">{t.lbl_next_div}</label>
            <input
              type="date"
              value={form.nextDivDate}
              onChange={e => setForm({ ...form, nextDivDate: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded mt-2 shadow-md transition-colors"
        >
          {editId ? t.btn_save : t.btn_add}
        </button>
      </form>
    </div>
  );
});

AddHoldingForm.displayName = 'AddHoldingForm';

export default AddHoldingForm;


