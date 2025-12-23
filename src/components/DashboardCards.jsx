import React, { memo } from 'react';
import { Wallet, Coins, TrendingUp, Scale, Activity, BarChart2, Percent } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/formatters';

/**
 * Dashboard KPI cards with icons
 */
const DashboardCards = memo(({
  stats,
  baseCurr,
  lang,
  privacyMode,
  t,
  theme
}) => {
  const fmt = (val, curr = baseCurr) => {
    if (privacyMode) return '***';
    return formatCurrency(val, curr, lang);
  };
  
  const cardClass = `
    rounded-xl border shadow-sm p-5 transition-all hover:shadow-md
    ${theme === 'dark' ? 'bg-slate-850 border-slate-700' : 'bg-white border-slate-200'}
  `;
  
  const iconClass = `w-5 h-5 mb-2 ${
    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
  }`;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {/* Net Worth */}
      <div className={`${cardClass} relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <Wallet className={`${iconClass} text-blue-500`} strokeWidth={2} />
        <p className="text-xs font-medium opacity-70 mb-1">
          {t.net_worth} ({baseCurr})
        </p>
        <h2 className="text-2xl font-bold">{fmt(stats.netWorth)}</h2>
      </div>
      
      {/* Dividend Yield */}
      <div className={cardClass}>
        <Coins className={`${iconClass} text-emerald-500`} strokeWidth={2} />
        <p className="text-xs font-medium opacity-70 mb-1">
          {t.dividend_yield} ({baseCurr})
        </p>
        <h2 className="text-xl font-bold">{fmt(stats.divTotal)}</h2>
      </div>
      
      {/* Direct Yield */}
      <div className={cardClass}>
        <Percent className={`${iconClass} text-emerald-500`} strokeWidth={2} />
        <p className="text-xs font-medium opacity-70 mb-1">{t.yield_label}</p>
        <span className="text-xl font-bold text-emerald-500">
          {stats.yieldPct?.toFixed(2)}%
        </span>
      </div>
      
      {/* Loan to Value */}
      <div className={cardClass}>
        <Scale className={`${iconClass} ${
          stats.loanPct > 10 ? 'text-rose-500' : 'text-emerald-500'
        }`} strokeWidth={2} />
        <p className="text-xs font-medium opacity-70 mb-1">{t.loan_pct}</p>
        <span className={`text-xl font-bold ${
          stats.loanPct > 10 ? 'text-rose-500' : 'text-emerald-500'
        }`}>
          {stats.loanPct?.toFixed(1)}%
        </span>
      </div>
      
      {/* Sharpe Ratio */}
      <div className={cardClass}>
        <Activity className={`${iconClass} ${
          stats.sharpe < 1 ? 'text-rose-500' : 'text-emerald-500'
        }`} strokeWidth={2} />
        <p className="text-xs font-medium opacity-70 mb-1">{t.sharpe_ratio}</p>
        <span className={`text-xl font-bold ${
          stats.sharpe < 1 ? 'text-rose-500' : 'text-emerald-500'
        }`}>
          {stats.sharpe?.toFixed(2)}
        </span>
        <p className="text-[10px] opacity-50 mt-1">{t.sharpe_info}</p>
      </div>
      
      {/* Portfolio Beta */}
      <div className={cardClass}>
        <BarChart2 className={`${iconClass} ${
          stats.portfolioBeta > 1.2 ? 'text-orange-500' : 'text-blue-500'
        }`} strokeWidth={2} />
        <p className="text-xs font-medium opacity-70 mb-1">{t.portfolio_beta}</p>
        <span className={`text-xl font-bold ${
          stats.portfolioBeta > 1.2 ? 'text-orange-500' : 'text-blue-500'
        }`}>
          {stats.portfolioBeta?.toFixed(2)}
        </span>
        <p className="text-[10px] opacity-50 mt-1">{t.beta_info}</p>
      </div>
    </div>
  );
});

DashboardCards.displayName = 'DashboardCards';

export default DashboardCards;




