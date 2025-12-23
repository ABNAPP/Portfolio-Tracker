import React, { memo } from 'react';
import { Pencil, Trash2, Banknote, Layers, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { COUNTRY_ISO } from '../utils/constants';

/**
 * Holdings table component with full sorting capabilities
 */
const HoldingsTable = memo(({
  holdings,
  apiStatus,
  sort,
  setSort,
  onPriceClick,
  onSellClick,
  onEditClick,
  onDeleteClick,
  t,
  lang,
  baseCurr,
  privacyMode,
  theme
}) => {
  const fmt = (val, curr = baseCurr) => {
    if (privacyMode) return '***';
    return formatCurrency(val, curr, lang);
  };
  
  const handleSort = (key) => {
    setSort(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc'
    }));
  };
  
  // Sort indicator component
  const SortIndicator = ({ columnKey }) => {
    const isActive = sort.key === columnKey;
    
    if (!isActive) {
      return (
        <ChevronsUpDown 
          size={14} 
          className="inline-block ml-1 opacity-30 group-hover:opacity-60 transition-opacity" 
        />
      );
    }
    
    return sort.dir === 'asc' ? (
      <ChevronUp size={14} className="inline-block ml-1 text-blue-500" />
    ) : (
      <ChevronDown size={14} className="inline-block ml-1 text-blue-500" />
    );
  };
  
  // Sortable header cell component
  const SortableHeader = ({ columnKey, children, align = 'left', className = '' }) => (
    <th 
      className={`p-3 font-semibold cursor-pointer select-none group transition-colors hover:text-blue-500 ${
        sort.key === columnKey ? 'text-blue-500' : ''
      } ${align === 'right' ? 'text-right' : ''} ${className}`}
      onClick={() => handleSort(columnKey)}
    >
      <span className="inline-flex items-center">
        {align === 'right' && <SortIndicator columnKey={columnKey} />}
        {children}
        {align !== 'right' && <SortIndicator columnKey={columnKey} />}
      </span>
    </th>
  );
  
  if (!holdings || holdings.length === 0) {
    return (
      <div className="text-center py-12 opacity-50">
        Inga innehav att visa
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
            {/* Flag - not sortable */}
            <th className="p-3 w-10 text-center">🏳️</th>
            
            {/* Symbol/Holding */}
            <SortableHeader columnKey="symbol">
              {t.holdings_header}
            </SortableHeader>
            
            {/* Quantity */}
            <SortableHeader columnKey="shares" align="right">
              {t.qty_header}
            </SortableHeader>
            
            {/* GAV (Purchase Price) */}
            <SortableHeader columnKey="purchasePrice" align="right">
              {t.gav_header}
            </SortableHeader>
            
            {/* Current Price */}
            <SortableHeader columnKey="currentPrice" align="right">
              {t.price_header}
            </SortableHeader>
            
            {/* Market Value */}
            <SortableHeader columnKey="marketValueBase" align="right">
              {t.value_header}
            </SortableHeader>
            
            {/* Market Weight */}
            <SortableHeader columnKey="mWeight" align="right" className="hidden sm:table-cell">
              {t.m_weight_header}
            </SortableHeader>
            
            {/* Investment Weight */}
            <SortableHeader columnKey="iWeight" align="right" className="hidden sm:table-cell">
              {t.i_weight_header}
            </SortableHeader>
            
            {/* Gain/Loss % */}
            <SortableHeader columnKey="gainPercent" align="right">
              {t.dev_header}
            </SortableHeader>
            
            {/* Actions - not sortable */}
            <th className="p-3 w-28"></th>
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-slate-800">
          {holdings.filter(h => !h.isWatchlist).map(h => (
            <tr key={h.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              {/* Country Flag */}
              <td className="p-3 text-center">
                {COUNTRY_ISO[h.country] ? (
                  <img 
                    src={`https://flagcdn.com/w40/${COUNTRY_ISO[h.country]}.png`} 
                    alt={h.country} 
                    className="w-6 h-auto inline-block rounded-sm shadow-sm" 
                  />
                ) : '🌍'}
              </td>
              
              {/* Symbol & Name */}
              <td className="p-3">
                <div className="font-bold flex items-center gap-2">
                  {h.symbol}
                  {apiStatus[h.id] === 'loading' && (
                    <div className="loader"></div>
                  )}
                  {h.sources?.length > 1 && (
                    <Layers size={12} className="text-slate-400" title="Flera mäklare" />
                  )}
                </div>
                <div className="text-xs opacity-60 truncate max-w-[150px]">{h.name}</div>
              </td>
              
              {/* Quantity */}
              <td className="p-3 text-right font-mono">{h.shares}</td>
              
              {/* GAV (Average Cost) */}
              <td className="p-3 text-right font-medium opacity-80">
                {formatCurrency(h.purchasePrice, h.currency, lang)}
              </td>
              
              {/* Current Price (clickable) */}
              <td className="p-3 text-right">
                <button 
                  onClick={() => onPriceClick(h)}
                  className="text-blue-500 hover:underline font-medium"
                >
                  {formatCurrency(h.currentPrice, h.currency, lang)}
                </button>
              </td>
              
              {/* Market Value */}
              <td className="p-3 text-right font-bold">
                {fmt(h.marketValueBase)}
              </td>
              
              {/* Market Weight */}
              <td className="p-3 text-right hidden sm:table-cell text-xs opacity-70">
                {h.mWeight?.toFixed(2)}%
              </td>
              
              {/* Investment Weight */}
              <td className="p-3 text-right hidden sm:table-cell text-xs opacity-70">
                {h.iWeight?.toFixed(2)}%
              </td>
              
              {/* Gain/Loss % */}
              <td className={`p-3 text-right font-bold ${
                h.gainPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {h.gainPercent >= 0 ? '+' : ''}{h.gainPercent?.toFixed(2)}%
              </td>
              
              {/* Actions */}
              <td className="p-3 text-right">
                <div className="flex justify-end gap-1">
                  <button 
                    onClick={() => onSellClick(h)}
                    className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors"
                    title="Sälj"
                  >
                    <Banknote size={16} />
                  </button>
                  <button 
                    onClick={() => onEditClick(h)}
                    className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                    title="Redigera"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={() => onDeleteClick(h)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Radera"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

HoldingsTable.displayName = 'HoldingsTable';

export default HoldingsTable;
