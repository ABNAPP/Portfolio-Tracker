import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Navigation,
  DashboardCards,
  HoldingsTable,
  ErrorBoundary,
  Notification,
  useNotification,
  PriceModal,
  SellModal,
  EditSourceModal,
  DeleteSourceModal,
  TransactionModal,
  PerformanceChart,
  DonutChart,
  DividendBarChart,
  Heatmap
} from './components';
import { useLocalStorage, useApi, useBenchmark } from './hooks';
import { TRANSLATIONS } from './utils/translations';
import { 
  CURRENCIES, 
  DEFAULT_FX_RATES, 
  DEFAULT_DATA, 
  TIME_RANGES,
  MARKET_INDICES,
  CRYPTO_SYMBOLS,
  BROKERS
} from './utils/constants';
import { formatCurrency, formatPercent, formatDateShort } from './utils/formatters';
import { 
  calculateSharpeRatio, 
  calculateMaxDrawdown, 
  calculateVolatility,
  calculateReturns,
  calculateTradingStats
} from './utils/calculations';
import { exportToExcel, exportBackupJSON, importBackupJSON, parseHistoryCSV } from './utils/exportUtils';
import {
  Map, AlertTriangle, AlertCircle, CheckCircle, Activity, Zap, Globe, TrendingDown,
  History, ChevronDown, ChevronRight, Trash, Plus, Download, Upload, Wallet, CreditCard,
  FileSpreadsheet, Calendar, Briefcase, X, BarChart2, Crosshair, Settings, Calculator,
  TrendingUp, DollarSign
} from 'lucide-react';

// Default form state
const DEFAULT_FORM = {
  symbol: '', name: '', shares: '', purchasePrice: '', currentPrice: '', 
  dividend: '', currency: 'SEK', industry: 'Övrigt', country: 'Sverige',
  fxRate: 1, totalCost: '', commission: '', commissionCurrency: 'SEK',
  nextDivDate: '', broker: 'Avanza', totalCostCurrency: 'SEK', beta: ''
};

function App() {
  // Theme & Language
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [lang, setLang] = useLocalStorage('lang', 'sv');
  const t = TRANSLATIONS[lang] || TRANSLATIONS.sv;
  
  // UI State
  const [tab, setTab] = useState('overview');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [sort, setSort] = useState({ key: null, dir: 'desc' }); // No default sorting
  const [timeRange, setTimeRange] = useState('3M');
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [chartSource, setChartSource] = useState('TOTAL');
  const [selectedBrokerFilter, setSelectedBrokerFilter] = useState('ALL'); // 'ALL' or broker name
  
  // Reset broker filter when leaving perf tab
  useEffect(() => {
    if (tab !== 'perf') {
      setSelectedBrokerFilter('ALL');
    }
  }, [tab]);
  
  // Stress Test State
  const [slrRate, setSlrRate] = useLocalStorage('pf_slr_rate', 2.62); // Statslåneränta
  const [stressIndex, setStressIndex] = useState('OMXS30');
  const [stressIndexChange, setStressIndexChange] = useState(-20);
  const [stressFxFrom, setStressFxFrom] = useState('SEK');
  const [stressFxTo, setStressFxTo] = useState('USD');
  const [stressFxChange, setStressFxChange] = useState(10);
  
  // Modal State
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [editSourceModalOpen, setEditSourceModalOpen] = useState(false);
  const [deleteSourceModalOpen, setDeleteSourceModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockToEdit, setStockToEdit] = useState(null);
  
  // Form State
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editId, setEditId] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Data State
  const [data, setData] = useLocalStorage('pf_data_v24', DEFAULT_DATA);
  const [transactions, setTransactions] = useLocalStorage('pf_trans_v24', []);
  const [chartData, setChartData] = useLocalStorage('pf_chart_v24', []);
  const [historyProfiles, setHistoryProfiles] = useLocalStorage('pf_hist_v25', []);
  const [fx, setFx] = useLocalStorage('pf_fx_rates_v24', DEFAULT_FX_RATES);
  const [baseCurr, setBaseCurr] = useLocalStorage('base_curr', 'SEK');
  
  // API Keys - Read from localStorage, fallback to environment variables
  const getApiKeysFromEnv = () => ({
    eodhd: import.meta.env.VITE_EODHD_API_KEY || '',
    marketstack: import.meta.env.VITE_MARKETSTACK_API_KEY || '',
    finnhub: import.meta.env.VITE_FINNHUB_API_KEY || '',
    alphaVantage: import.meta.env.VITE_ALPHAVANTAGE_API_KEY || '',
    extra: ''
  });

  const [apiKeys, setApiKeys] = useLocalStorage('pf_api_keys', getApiKeysFromEnv());
  
  // Merge environment variables with localStorage (env vars take precedence if set)
  const effectiveApiKeys = useMemo(() => {
    const envKeys = getApiKeysFromEnv();
    return {
      eodhd: envKeys.eodhd || apiKeys.eodhd,
      marketstack: envKeys.marketstack || apiKeys.marketstack,
      finnhub: envKeys.finnhub || apiKeys.finnhub,
      alphaVantage: envKeys.alphaVantage || apiKeys.alphaVantage,
      extra: apiKeys.extra || ''
    };
  }, [apiKeys]);
  
  // Hooks
  const { showNotification, hideNotification, NotificationComponent } = useNotification();
  const { status: apiStatus, getPrice, searchSymbols, getBeta, fetchFxRates, updateAllPrices } = useApi();
  const { benchmarkData, selectedBenchmark, setSelectedBenchmark, fetchBenchmarkData, alignWithPortfolio, generateSimulatedData } = useBenchmark();
  
  // Refs
  const fileRef = useRef(null);
  
  // Apply theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  // Fetch FX rates on mount
  useEffect(() => {
    fetchFxRates(baseCurr, CURRENCIES).then(rates => {
      if (rates) setFx(prev => ({ ...prev, ...rates }));
    });
  }, [baseCurr]);
  
  // Fetch benchmark data when showBenchmark is enabled
  useEffect(() => {
    if (showBenchmark && selectedBenchmark && effectiveApiKeys) {
      const stored = benchmarkData[selectedBenchmark];
      // Only fetch if we don't have recent data (older than 1 day)
      const shouldFetch = !stored?.data || 
        !stored?.lastFetched || 
        (new Date() - new Date(stored.lastFetched)) > 24 * 60 * 60 * 1000;
      
      if (shouldFetch) {
        fetchBenchmarkData(selectedBenchmark, effectiveApiKeys);
      }
    }
  }, [showBenchmark, selectedBenchmark, effectiveApiKeys, benchmarkData, fetchBenchmarkData]);
  
  // Generate initial chart data if empty
  useEffect(() => {
    if (chartData.length === 0) {
      const h = [];
      let v = 100000;
      const d = new Date();
      for (let i = 30; i >= 0; i--) {
        v = v * (1 + (Math.random() * 0.03 - 0.012));
        const nd = new Date(d);
        nd.setDate(d.getDate() - i);
        h.push({ date: nd.toISOString().split('T')[0], value: v });
      }
      setChartData(h);
    }
  }, []);
  
  // Migrate accounts to include broker field
  useEffect(() => {
    setData(d => {
      let updated = false;
      const newCash = (d.cashAccounts || []).map(acc => {
        if (!acc.broker) {
          updated = true;
          return { ...acc, broker: BROKERS[0] || 'Avanza' };
        }
        return acc;
      });
      const newLoan = (d.loanAccounts || []).map(acc => {
        if (!acc.broker) {
          updated = true;
          return { ...acc, broker: BROKERS[0] || 'Avanza' };
        }
        return acc;
      });
      
      if (updated) {
        return { ...d, cashAccounts: newCash, loanAccounts: newLoan };
      }
      return d;
    });
  }, [setData]);

  // Calculate statistics
  const stats = useMemo(() => {
    let valBase = 0, costBase = 0, divTotal = 0;
    
    // Enrich holdings
    const enriched = data.holdings.map(h => {
      const r = (fx[h.currency] || 1) / (fx[baseCurr] || 1);
      const shares = Number(h.shares) || 0;
      const price = Number(h.currentPrice) || 0;
      const purchasePrice = Number(h.purchasePrice) || 0;
      
      const cur = shares * price * r;
      const cost = shares * purchasePrice * r;
      
      valBase += cur;
      costBase += cost;
      divTotal += (Number(h.dividend) || 0) * shares * r;
      
      return {
        ...h,
        shares,
        currentPrice: price,
        purchasePrice,
        marketValueBase: cur,
        gainPercent: cost > 0 ? ((cur - cost) / cost) * 100 : 0,
        isWatchlist: shares === 0,
        beta: h.beta || 1
      };
    });
    
    // Aggregate by symbol
    const aggMap = {};
    enriched.forEach(h => {
      if (h.isWatchlist) return;
      const sym = h.symbol.trim().toUpperCase();
      if (!aggMap[sym]) {
        aggMap[sym] = {
          ...h,
          symbol: sym,
          sources: [h],
          realShares: h.shares,
          realCostBase: h.shares * h.purchasePrice * ((fx[h.currency] || 1) / (fx[baseCurr] || 1)),
          realMarketVal: h.marketValueBase
        };
      } else {
        const p = aggMap[sym];
        p.sources.push(h);
        p.realShares += h.shares;
        p.realCostBase += h.shares * h.purchasePrice * ((fx[h.currency] || 1) / (fx[baseCurr] || 1));
        p.realMarketVal += h.marketValueBase;
        p.shares = p.realShares;
        p.marketValueBase = p.realMarketVal;
        if (h.currency === p.currency) {
          const totalNativeCost = p.sources.reduce((sum, s) => sum + s.shares * s.purchasePrice, 0);
          p.purchasePrice = totalNativeCost / p.realShares;
        }
      }
    });
    
    const aggregated = Object.values(aggMap);
    aggregated.forEach(h => {
      h.mWeight = valBase > 0 ? (h.marketValueBase / valBase) * 100 : 0;
      h.iWeight = costBase > 0 ? (h.realCostBase / costBase) * 100 : 0;
      h.gainPercent = h.realCostBase > 0 ? ((h.marketValueBase - h.realCostBase) / h.realCostBase) * 100 : 0;
    });
    
    // Sort - handles strings and numbers properly
    if (sort.key) {
      aggregated.sort((a, b) => {
        let valA = a[sort.key];
        let valB = b[sort.key];
        
        // Handle null/undefined values
        if (valA == null) valA = sort.key === 'symbol' ? '' : 0;
        if (valB == null) valB = sort.key === 'symbol' ? '' : 0;
        
        // String comparison for symbol
        if (sort.key === 'symbol') {
          const comparison = String(valA).localeCompare(String(valB), 'sv');
          return sort.dir === 'asc' ? comparison : -comparison;
        }
        
        // Numeric comparison for all other fields
        const numA = Number(valA) || 0;
        const numB = Number(valB) || 0;
        return sort.dir === 'asc' ? numA - numB : numB - numA;
      });
    }
    
    // Cash & Loans
    let cashVal = 0;
    data.cashAccounts?.forEach(c => {
      cashVal += (Number(c.value) || 0) * (fx[c.currency] || 1) / (fx[baseCurr] || 1);
    });
    let loanVal = 0;
    data.loanAccounts?.forEach(l => {
      loanVal += (Number(l.value) || 0) * (fx[l.currency] || 1) / (fx[baseCurr] || 1);
    });
    
    const netWorth = valBase + cashVal - loanVal;
    
    // Chart calculations
    const values = chartData.map(d => d.value);
    const returns = calculateReturns(values);
    const sharpe = calculateSharpeRatio(returns);
    const { maxDrawdown, maxDrawdownValue, peakValue } = calculateMaxDrawdown(values);
    const vol30 = calculateVolatility(returns, 30);
    const vol90 = calculateVolatility(returns, 90);
    const vol252 = calculateVolatility(returns, 252);
    
    // Portfolio beta
    let wBetaSum = 0, wSum = 0;
    aggregated.forEach(h => {
      const weight = valBase > 0 ? h.marketValueBase / valBase : 0;
      wBetaSum += h.beta * weight;
      wSum += weight;
    });
    const portfolioBeta = wSum > 0 ? wBetaSum / wSum : 1;
    
    // Industry/Region data
    const sec = {}, reg = {}, holdingData = [], byBroker = {};
    aggregated.forEach(h => {
      sec[h.industry] = (sec[h.industry] || 0) + h.marketValueBase;
      reg[h.country] = (reg[h.country] || 0) + h.marketValueBase;
      holdingData.push({ name: h.symbol, value: h.marketValueBase });
    });
    
    enriched.forEach(h => {
      if (!h.isWatchlist) {
        const b = h.broker || 'Övrigt';
        if (!byBroker[b]) byBroker[b] = [];
        byBroker[b].push(h);
      }
    });
    
    // Trading stats
    const tradingStats = calculateTradingStats(transactions);
    
    // Monthly dividends
    const divMonths = Array(12).fill(0);
    enriched.forEach(h => {
      if (h.dividend && h.nextDivDate) {
        const month = new Date(h.nextDivDate).getMonth();
        const amount = h.shares * h.dividend * ((fx[h.currency] || 1) / (fx[baseCurr] || 1));
        divMonths[month] += amount;
      }
    });
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    const monthlyDivData = monthLabels.map((label, i) => ({ label, value: divMonths[i] }));
    
    // Total gain
    const realizedPnL = tradingStats.totalProfit;
    const totalGain = (valBase - costBase) + realizedPnL;
    const totalGainPct = costBase > 0 ? (totalGain / costBase) * 100 : 0;
    
    return {
      netWorth,
      valBase,
      costBase,
      divTotal,
      yieldPct: valBase > 0 ? (divTotal / valBase) * 100 : 0,
      loanPct: (valBase + cashVal) > 0 ? (loanVal / (valBase + cashVal)) * 100 : 0,
      enriched: aggregated,
      rawEnriched: enriched,
      byBroker,
      secData: Object.entries(sec).map(([name, value]) => ({ name, value })),
      regData: Object.entries(reg).map(([name, value]) => ({ name, value })),
      holdingData,
      sharpe,
      maxDrawdown,
      maxDrawdownValue,
      peakValue,
      totalGain,
      totalGainPct,
      vol30,
      vol90,
      vol252,
      portfolioBeta,
      monthlyDivData,
      ...tradingStats
    };
  }, [data, fx, baseCurr, chartData, transactions, sort]);

  // ISK Tax Calculation
  const taxCalculation = useMemo(() => {
    const taxBase = stats.valBase || 0; // Skatteunderlag = portföljvärde
    const effectiveRate = (slrRate + 1) / 100; // SLR + 1%
    const taxRate = 0.30; // 30% skatt
    const estimatedTax = taxBase * effectiveRate * taxRate;
    
    return {
      taxBase,
      effectiveRate: effectiveRate * 100,
      estimatedTax
    };
  }, [stats.valBase, slrRate]);

  // Stress Test Calculations
  const stressTest = useMemo(() => {
    const totalVal = stats.netWorth || 0;
    const absTotalVal = Math.abs(totalVal);
    
    // Market Scenario (based on Beta)
    // Expected return = index change * beta
    const expectedReturnPct = stressIndexChange * (stats.portfolioBeta || 1);
    // Impact value = portfolio * expected return
    const marketImpactVal = totalVal * (expectedReturnPct / 100);
    // New portfolio value
    const marketNewVal = totalVal + marketImpactVal;
    // For display: percentage should have same sign as value change
    // Use absolute portfolio value as denominator to ensure consistent sign
    const marketImpactPct = absTotalVal > 0 
      ? (marketImpactVal / absTotalVal) * 100 
      : expectedReturnPct;
    
    // Currency Scenario
    // Find holdings in the target currency
    let holdingsInTargetCurr = 0;
    stats.rawEnriched?.forEach(h => {
      const hCurr = (h.currency || '').trim().toUpperCase();
      const tCurr = (stressFxTo || '').trim().toUpperCase();
      if (hCurr === tCurr && !h.isWatchlist) {
        holdingsInTargetCurr += (Number(h.marketValueBase) || 0);
      }
    });
    
    // FX impact on holdings in that currency
    const fxImpactVal = holdingsInTargetCurr * (stressFxChange / 100);
    // Percentage of total portfolio (use absolute value for consistent sign)
    const fxImpactPct = absTotalVal > 0 
      ? (fxImpactVal / absTotalVal) * 100 
      : 0;
    const fxNewVal = totalVal + fxImpactVal;
    
    return {
      // Market scenario
      marketImpactPct,
      marketImpactVal,
      marketNewVal,
      expectedReturnPct, // Original beta-adjusted return
      // FX scenario
      holdingsInTargetCurr,
      fxImpactVal,
      fxImpactPct,
      fxNewVal
    };
  }, [stats.netWorth, stats.portfolioBeta, stats.rawEnriched, stressIndexChange, stressFxTo, stressFxChange]);

  // Get available brokers from holdings
  const availableBrokers = useMemo(() => {
    const brokers = new Set(['ALL']);
    data.holdings.forEach(h => {
      if (h.broker) brokers.add(h.broker);
    });
    return Array.from(brokers).sort();
  }, [data.holdings]);

  // Filtered stats based on selected broker
  const filteredStats = useMemo(() => {
    if (selectedBrokerFilter === 'ALL' || tab !== 'perf') {
      return stats;
    }

    // Filter holdings by broker
    const filteredHoldings = stats.rawEnriched.filter(h => 
      !h.isWatchlist && (h.broker || 'Övrigt') === selectedBrokerFilter
    );

    // Recalculate stats for filtered holdings
    let valBase = 0, costBase = 0, divTotal = 0;
    
    filteredHoldings.forEach(h => {
      valBase += h.marketValueBase;
      costBase += h.shares * h.purchasePrice * ((fx[h.currency] || 1) / (fx[baseCurr] || 1));
      divTotal += (Number(h.dividend) || 0) * h.shares * ((fx[h.currency] || 1) / (fx[baseCurr] || 1));
    });

    // Filter cash and loans for this broker
    let cashVal = 0;
    data.cashAccounts?.forEach(c => {
      if ((c.broker || BROKERS[0]) === selectedBrokerFilter) {
        cashVal += (Number(c.value) || 0) * (fx[c.currency] || 1) / (fx[baseCurr] || 1);
      }
    });
    let loanVal = 0;
    data.loanAccounts?.forEach(l => {
      if ((l.broker || BROKERS[0]) === selectedBrokerFilter) {
        loanVal += (Number(l.value) || 0) * (fx[l.currency] || 1) / (fx[baseCurr] || 1);
      }
    });

    const netWorth = valBase + cashVal - loanVal;

    // Aggregate by symbol for filtered holdings
    const aggMap = {};
    filteredHoldings.forEach(h => {
      const sym = h.symbol.trim().toUpperCase();
      if (!aggMap[sym]) {
        aggMap[sym] = {
          ...h,
          symbol: sym,
          sources: [h],
          realShares: h.shares,
          realCostBase: h.shares * h.purchasePrice * ((fx[h.currency] || 1) / (fx[baseCurr] || 1)),
          realMarketVal: h.marketValueBase
        };
      } else {
        const p = aggMap[sym];
        p.sources.push(h);
        p.realShares += h.shares;
        p.realCostBase += h.shares * h.purchasePrice * ((fx[h.currency] || 1) / (fx[baseCurr] || 1));
        p.realMarketVal += h.marketValueBase;
        p.shares = p.realShares;
        p.marketValueBase = p.realMarketVal;
      }
    });

    const aggregated = Object.values(aggMap);
    aggregated.forEach(h => {
      h.mWeight = valBase > 0 ? (h.marketValueBase / valBase) * 100 : 0;
      h.iWeight = costBase > 0 ? (h.realCostBase / costBase) * 100 : 0;
      h.gainPercent = h.realCostBase > 0 ? ((h.marketValueBase - h.realCostBase) / h.realCostBase) * 100 : 0;
    });

    // Calculate portfolio beta for filtered holdings
    let wBetaSum = 0, wSum = 0;
    aggregated.forEach(h => {
      const weight = valBase > 0 ? h.marketValueBase / valBase : 0;
      wBetaSum += h.beta * weight;
      wSum += weight;
    });
    const portfolioBeta = wSum > 0 ? wBetaSum / wSum : 1;

    // Calculate chart data for filtered broker (simplified - based on current value)
    // For historical accuracy, we'd need to track broker in chartData, but for now
    // we'll show a proportional chart based on current holdings
    const currentValue = netWorth;
    const filteredChartData = chartData.map(d => {
      // Calculate proportion of this broker's value to total
      const proportion = stats.netWorth > 0 ? currentValue / stats.netWorth : 0;
      return {
        ...d,
        value: d.value * proportion
      };
    });

    const values = filteredChartData.map(d => d.value);
    const returns = calculateReturns(values);
    const sharpe = calculateSharpeRatio(returns);
    const { maxDrawdown, maxDrawdownValue, peakValue } = calculateMaxDrawdown(values);
    const vol30 = calculateVolatility(returns, 30);
    const vol90 = calculateVolatility(returns, 90);
    const vol252 = calculateVolatility(returns, 252);

    // Trading stats filtered by broker
    const filteredTransactions = transactions.filter(t => 
      t.broker === selectedBrokerFilter || (!t.broker && selectedBrokerFilter === 'Övrigt')
    );
    const tradingStats = calculateTradingStats(filteredTransactions);

    const totalGain = (valBase - costBase) + tradingStats.totalProfit;
    const totalGainPct = costBase > 0 ? (totalGain / costBase) * 100 : 0;

    return {
      ...stats,
      netWorth,
      valBase,
      costBase,
      divTotal,
      yieldPct: valBase > 0 ? (divTotal / valBase) * 100 : 0,
      loanPct: (valBase + cashVal) > 0 ? (loanVal / (valBase + cashVal)) * 100 : 0,
      enriched: aggregated,
      rawEnriched: filteredHoldings,
      sharpe,
      maxDrawdown,
      maxDrawdownValue,
      peakValue,
      totalGain,
      totalGainPct,
      vol30,
      vol90,
      vol252,
      portfolioBeta,
      filteredChartData,
      ...tradingStats
    };
  }, [stats, selectedBrokerFilter, data, fx, baseCurr, chartData, transactions, tab]);

  // Filtered chart data
  const filteredChart = useMemo(() => {
    // Use filtered chart data if broker filter is active
    const chartToUse = (selectedBrokerFilter !== 'ALL' && tab === 'perf' && filteredStats.filteredChartData) 
      ? filteredStats.filteredChartData 
      : chartData;
    
    if (chartToUse.length === 0) return [];
    const cutoff = new Date();
    switch (timeRange) {
      case '1W': cutoff.setDate(cutoff.getDate() - 7); break;
      case '1M': cutoff.setMonth(cutoff.getMonth() - 1); break;
      case '3M': cutoff.setMonth(cutoff.getMonth() - 3); break;
      case '6M': cutoff.setMonth(cutoff.getMonth() - 6); break;
      case 'YTD': cutoff.setMonth(0, 1); break;
      case '1Y': cutoff.setFullYear(cutoff.getFullYear() - 1); break;
      case '3Y': cutoff.setFullYear(cutoff.getFullYear() - 3); break;
      case 'ALL': return chartToUse;
    }
    return chartToUse.filter(d => new Date(d.date) >= cutoff);
  }, [chartData, timeRange, selectedBrokerFilter, filteredStats, tab]);

  // Benchmark data for chart
  const benchmarkChartData = useMemo(() => {
    if (!showBenchmark) return null;
    const stored = benchmarkData[selectedBenchmark];
    if (stored?.data && stored.data.length > 0) {
      const aligned = alignWithPortfolio(filteredChart, selectedBenchmark);
      return aligned && aligned.length > 0 ? aligned : null;
    }
    // Generate simulated data matching portfolio dates
    return generateSimulatedData(selectedBenchmark, filteredChart);
  }, [showBenchmark, selectedBenchmark, benchmarkData, filteredChart, alignWithPortfolio, generateSimulatedData]);

  // Update chart with current portfolio value
  const updateChart = useCallback((holdings, cashAccounts, loanAccounts) => {
    let val = 0;
    cashAccounts?.forEach(c => val += (Number(c.value) || 0) * (fx[c.currency] || 1));
    loanAccounts?.forEach(l => val -= (Number(l.value) || 0) * (fx[l.currency] || 1));
    holdings.forEach(h => val += h.shares * h.currentPrice * (fx[h.currency] || 1));
    
    const dateStr = new Date().toISOString().split('T')[0];
    setChartData(c => {
      const existing = c.find(x => x.date.startsWith(dateStr));
      if (existing) {
        return c.map(x => x.date.startsWith(dateStr) ? { ...x, value: val } : x);
      }
      return [...c, { date: dateStr, value: val }];
    });
  }, [fx, setChartData]);

  // Price update handler
  const updatePrice = useCallback((id, p) => {
    setData(d => {
      const holding = d.holdings.find(x => x.id === id);
      if (!holding) return d;
      
      const nh = d.holdings.map(h => 
        h.symbol === holding.symbol 
          ? { ...h, currentPrice: Number(p), lastPriceUpdate: new Date().toISOString() }
          : h
      );
      updateChart(nh, d.cashAccounts, d.loanAccounts);
      return { ...d, holdings: nh };
    });
  }, [setData, updateChart]);

  // Update all prices
  const handleUpdateAll = useCallback(async () => {
    if (!effectiveApiKeys.finnhub && !effectiveApiKeys.eodhd) {
      showNotification('Lägg till API-nycklar i inställningarna', 'warning');
      return;
    }
    await updateAllPrices(data.holdings, effectiveApiKeys, updatePrice);
    showNotification('Kurser uppdaterade!', 'success');
  }, [data.holdings, effectiveApiKeys, updatePrice, updateAllPrices, showNotification]);

  // Search handler
  const handleSearch = useCallback(async (query) => {
    setIsSearching(true);
    const results = await searchSymbols(query, effectiveApiKeys.finnhub);
    setSearchResults(results);
    setIsSearching(false);
  }, [effectiveApiKeys.finnhub, searchSymbols]);

  // Select search result
  const handleSelectResult = useCallback(async (result) => {
    let curr = 'USD', ind = 'Övrigt', cnt = 'USA';
    const s = result.symbol;
    
    if (s.includes('.ST')) { curr = 'SEK'; cnt = 'Sverige'; }
    else if (s.includes('.CO')) { curr = 'DKK'; cnt = 'Danmark'; }
    else if (s.includes('.OL')) { curr = 'NOK'; cnt = 'Norge'; }
    else if (s.includes('.HE')) { curr = 'EUR'; cnt = 'Finland'; }
    else if (s.includes('.DE')) { curr = 'EUR'; cnt = 'Tyskland'; }
    
    const isCrypto = CRYPTO_SYMBOLS.some(c => s.includes(c)) && !s.includes('.');
    if (isCrypto) { curr = 'USD'; ind = 'Krypto'; cnt = 'Global'; }
    
    setForm(prev => ({
      ...prev,
      symbol: result.symbol,
      name: result.description,
      currency: curr,
      industry: ind,
      country: cnt,
      fxRate: fx[curr] || 1,
      purchasePrice: '',
      beta: ''
    }));
    setSearchResults([]);
    
    // Fetch price and beta
    const [price, beta] = await Promise.all([
      getPrice(result.symbol, effectiveApiKeys),
      getBeta(result.symbol, effectiveApiKeys)
    ]);
    
    setForm(prev => ({
      ...prev,
      purchasePrice: price || '',
      currentPrice: price || '',
      beta: beta || (Math.random() * 0.5 + 0.8).toFixed(2)
    }));
  }, [fx, effectiveApiKeys, getPrice, getBeta]);

  // Save holding
  const handleSave = useCallback((e) => {
    e.preventDefault();
    if (!form.symbol) return;
    
    const s = Number(form.shares);
    const p = Number(form.purchasePrice);
    const c = Number(form.commission) || 0;
    const cp = Number(form.currentPrice) || p;
    
    // Add transaction
    if (s > 0 && !editId) {
      setTransactions(tr => [{
        id: Date.now(),
        date: new Date().toISOString(),
        type: 'KÖP',
        symbol: form.symbol,
        shares: s,
        price: p,
        commission: c,
        commissionCurrency: form.commissionCurrency,
        broker: form.broker
      }, ...tr]);
    }
    
    setData(d => {
      let lst = [...d.holdings];
      
      const itm = {
        symbol: form.symbol.toUpperCase(),
        name: form.name,
        currency: form.currency,
        industry: form.industry,
        country: form.country,
        shares: s,
        purchasePrice: p,
        dividend: Number(form.dividend) || 0,
        currentPrice: cp,
        lastPriceUpdate: new Date().toISOString(),
        nextDivDate: form.nextDivDate,
        broker: form.broker,
        id: editId || Date.now(),
        beta: Number(form.beta) || 1
      };
      
      if (editId) {
        const idx = lst.findIndex(x => x.id === editId);
        if (idx !== -1) lst[idx] = { ...lst[idx], ...itm };
      } else {
        const idx = lst.findIndex(x => x.symbol === itm.symbol && x.broker === itm.broker);
        if (idx >= 0) {
          const o = lst[idx];
          const tot = o.shares + s;
          const avgP = ((o.shares * o.purchasePrice) + (s * p)) / tot;
          lst[idx] = {
            ...o,
            shares: tot,
            purchasePrice: avgP,
            currentPrice: cp,
            industry: itm.industry,
            country: itm.country,
            dividend: itm.dividend,
            beta: Number(form.beta) || o.beta || 1
          };
        } else {
          lst.push(itm);
        }
      }
      
      updateChart(lst, d.cashAccounts, d.loanAccounts);
      return { ...d, holdings: lst };
    });
    
    setEditId(null);
    setForm(DEFAULT_FORM);
    showNotification(editId ? t.holding_updated : t.holding_added, 'success');
  }, [form, editId, setData, setTransactions, updateChart, showNotification]);

  // Sell handler
  const handleSell = useCallback((id, qty, pr, com, cc, dest) => {
    const holding = data.holdings.find(x => x.id === id);
    if (!holding) return;
    
    const r = fx[holding.currency] || 1;
    const commissionBase = com * (fx[cc] || 1);
    const proceedsBase = qty * pr * r;
    const costBasisBase = qty * holding.purchasePrice * r;
    const realizedPnL = proceedsBase - commissionBase - costBasisBase;
    
    // Calculate hold time
    const buys = transactions.filter(t => t.type === 'KÖP' && t.symbol === holding.symbol);
    let holdTimeDays = 0;
    if (buys.length > 0) {
      const firstBuyDate = new Date(buys[buys.length - 1].date);
      holdTimeDays = Math.ceil((new Date() - firstBuyDate) / (1000 * 60 * 60 * 24));
    }
    
    // Add sell transaction
    setTransactions(tr => [{
      id: Date.now(),
      date: new Date().toISOString(),
      type: 'SÄLJ',
      symbol: holding.symbol,
      shares: qty,
      price: pr,
      totalSEK: proceedsBase,
      commissionSEK: commissionBase,
      broker: holding.broker,
      profit: realizedPnL,
      holdTime: holdTimeDays
    }, ...tr]);
    
    setData(d => {
      let lst = [...d.holdings];
      const idx = lst.findIndex(x => x.id === id);
      
      if (idx !== -1) {
        const rem = lst[idx].shares - qty;
        if (rem <= 0) {
          lst = lst.filter(x => x.id !== id);
        } else {
          lst[idx] = { ...lst[idx], shares: rem };
        }
      }
      
      let newCash = [...d.cashAccounts];
      let newLoan = [...d.loanAccounts];
      const val = proceedsBase - commissionBase;
      
      if (dest === 'cash') {
        if (newCash.length > 0) {
          newCash[0] = {
            ...newCash[0],
            value: newCash[0].value + (val / (fx[newCash[0].currency] || 1))
          };
        } else {
          newCash.push({ id: Date.now(), name: 'Likviditet', value: val, currency: baseCurr });
        }
      } else {
        if (newLoan.length > 0) {
          const newVal = newLoan[0].value - (val / (fx[newLoan[0].currency] || 1));
          newLoan[0] = { ...newLoan[0], value: Math.max(0, newVal) };
        }
      }
      
      updateChart(lst, newCash, newLoan);
      return { ...d, holdings: lst, cashAccounts: newCash, loanAccounts: newLoan };
    });
    
    showNotification(`Sålt ${qty} ${holding.symbol}`, 'success');
  }, [data.holdings, transactions, fx, baseCurr, setData, setTransactions, updateChart, showNotification]);

  // Delete handlers
  const handleDelete = useCallback((id) => {
    setData(d => {
      const lst = d.holdings.filter(x => x.id !== id);
      updateChart(lst, d.cashAccounts, d.loanAccounts);
      return { ...d, holdings: lst };
    });
    setDeleteSourceModalOpen(false);
    showNotification(t.holding_deleted, 'success');
  }, [setData, updateChart, showNotification]);

  const handleDeleteAll = useCallback((symbol) => {
    setData(d => {
      const lst = d.holdings.filter(x => x.symbol !== symbol);
      updateChart(lst, d.cashAccounts, d.loanAccounts);
      return { ...d, holdings: lst };
    });
    setDeleteSourceModalOpen(false);
    showNotification(t.all_holdings_deleted, 'success');
  }, [setData, updateChart, showNotification]);

  // Edit source select
  const handleEditSourceSelect = useCallback((src) => {
    setEditSourceModalOpen(false);
    setEditId(src.id);
    setForm({
      ...src,
      dividend: src.dividend || '',
      totalCost: '',
      commission: '',
      commissionCurrency: 'SEK',
      nextDivDate: src.nextDivDate || '',
      broker: src.broker || 'Avanza',
      totalCostCurrency: src.currency,
      beta: src.beta || ''
    });
    setTransactionModalOpen(true);
  }, []);

  // Account management
  const addAccount = useCallback((type) => {
    const newAcc = { id: Date.now(), name: '', value: 0, currency: 'SEK', broker: BROKERS[0] || 'Avanza' };
    setData(d => {
      const key = type === 'cash' ? 'cashAccounts' : 'loanAccounts';
      const newState = { ...d, [key]: [...(d[key] || []), newAcc] };
      updateChart(d.holdings, newState.cashAccounts, newState.loanAccounts);
      return newState;
    });
  }, [setData, updateChart]);

  const updateAccount = useCallback((type, id, field, val) => {
    setData(d => {
      const key = type === 'cash' ? 'cashAccounts' : 'loanAccounts';
      const newAccs = d[key].map(a => 
        a.id === id ? { ...a, [field]: field === 'value' ? Number(val) : val } : a
      );
      const newState = { ...d, [key]: newAccs };
      updateChart(d.holdings, newState.cashAccounts, newState.loanAccounts);
      return newState;
    });
  }, [setData, updateChart]);

  const removeAccount = useCallback((type, id) => {
    setData(d => {
      const key = type === 'cash' ? 'cashAccounts' : 'loanAccounts';
      const newAccs = d[key].filter(a => a.id !== id);
      const newState = { ...d, [key]: newAccs };
      updateChart(d.holdings, newState.cashAccounts, newState.loanAccounts);
      return newState;
    });
  }, [setData, updateChart]);

  // Export/Import
  const handleExportExcel = useCallback(() => {
    exportToExcel(data, stats, transactions, baseCurr, lang);
    showNotification('Excel-fil exporterad!', 'success');
  }, [data, stats, transactions, baseCurr, lang, showNotification]);

  const handleBackup = useCallback(() => {
    const backupData = {
      version: 'v2.0',
      exportDate: new Date().toISOString(),
      data,
      transactions,
      chartData,
      historyProfiles,
      settings: {
        theme,
        lang,
        baseCurr,
        fx,
        apiKeys: effectiveApiKeys
      }
    };
    exportBackupJSON(backupData);
    showNotification('Backup sparad!', 'success');
  }, [data, transactions, chartData, historyProfiles, theme, lang, baseCurr, fx, effectiveApiKeys, showNotification]);

  const handleRestore = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const backup = await importBackupJSON(file);
      if (backup.data) setData(backup.data);
      if (backup.transactions) setTransactions(backup.transactions);
      if (backup.chartData) setChartData(backup.chartData);
      if (backup.historyProfiles) setHistoryProfiles(backup.historyProfiles);
      if (backup.settings) {
        // Support both old (themePreference) and new (theme) format
        if (backup.settings.theme) {
          setTheme(backup.settings.theme);
        } else if (backup.settings.themePreference) {
          // Migrate old themePreference to theme
          setTheme(backup.settings.themePreference === 'system' ? 'light' : backup.settings.themePreference);
        }
        setBaseCurr(backup.settings.baseCurr || 'SEK');
        if (backup.settings.fx) setFx(backup.settings.fx);
        if (backup.settings.apiKeys) setApiKeys(backup.settings.apiKeys);
      }
      showNotification(t.msg_restore_ok, 'success');
    } catch (err) {
      showNotification(t.msg_restore_err, 'error');
    }
    e.target.value = '';
  }, [setData, setTransactions, setChartData, setHistoryProfiles, setTheme, setBaseCurr, setFx, setApiKeys, showNotification, t]);

  // Card styles
  const cardClass = `rounded-xl border shadow-sm transition-all hover:shadow-md ${
    theme === 'dark' ? 'bg-slate-850 border-slate-700' : 'bg-white border-slate-200'
  }`;

  const inputClass = `w-full p-2 rounded border outline-none transition-colors ${
    theme === 'dark'
      ? 'bg-slate-750 border-slate-600 text-white focus:border-blue-500'
      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
  }`;

  return (
    <ErrorBoundary t={t}>
      <div className={`min-h-screen font-sans pb-20 transition-colors ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'
      }`}>
        {NotificationComponent}
        
        {/* Modals */}
        <PriceModal
          isOpen={priceModalOpen}
          onClose={() => setPriceModalOpen(false)}
          onSave={updatePrice}
          stock={selectedStock}
          t={t}
          theme={theme}
        />
        
        <SellModal
          isOpen={sellModalOpen}
          onClose={() => setSellModalOpen(false)}
          onSell={handleSell}
          stock={selectedStock}
          t={t}
          fx={fx}
          theme={theme}
          baseCurr={baseCurr}
          privacyMode={privacyMode}
        />
        
        <EditSourceModal
          isOpen={editSourceModalOpen}
          onClose={() => setEditSourceModalOpen(false)}
          stock={stockToEdit}
          onSelect={handleEditSourceSelect}
          t={t}
          theme={theme}
        />
        
        <DeleteSourceModal
          isOpen={deleteSourceModalOpen}
          onClose={() => setDeleteSourceModalOpen(false)}
          stock={stockToEdit}
          onDelete={handleDelete}
          onDeleteAll={handleDeleteAll}
          t={t}
          theme={theme}
        />
        
        <TransactionModal
          isOpen={transactionModalOpen}
          onClose={() => {
            setTransactionModalOpen(false);
            setEditId(null);
            setForm(DEFAULT_FORM);
          }}
          form={form}
          setForm={setForm}
          editId={editId}
          onSave={handleSave}
          onSearch={handleSearch}
          searchResults={searchResults}
          onSelectResult={handleSelectResult}
          isSearching={isSearching}
          t={t}
          fx={fx}
          baseCurr={baseCurr}
          theme={theme}
        />
        
        {/* Navigation */}
        <Navigation
          tab={tab}
          setTab={setTab}
          theme={theme}
          setTheme={setTheme}
          lang={lang}
          setLang={setLang}
          privacyMode={privacyMode}
          setPrivacyMode={setPrivacyMode}
          onUpdateAll={handleUpdateAll}
          isUpdating={Object.values(apiStatus).includes('loading')}
          t={t}
        />
        
        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-4 space-y-6 animate-fade-in">
          {/* Dashboard Cards */}
          <DashboardCards
            stats={stats}
            baseCurr={baseCurr}
            lang={lang}
            privacyMode={privacyMode}
            t={t}
            theme={theme}
          />
          
          {/* Tab Content */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Transaction Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setTransactionModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-lg shadow-md transition-all flex items-center gap-2"
                >
                  <Plus size={18} />
                  Transaktion
                </button>
              </div>
              
              {/* Heatmap */}
              <div className={`${cardClass} p-4`}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-sm flex gap-2 items-center text-slate-500 uppercase tracking-wider">
                    <Map size={14} /> {t.heatmap_title}
                  </h3>
                </div>
                <Heatmap items={stats.enriched} theme={theme} baseCurr={baseCurr} />
              </div>
              
              {/* Holdings Table */}
              <div className={`${cardClass} overflow-hidden`}>
                <HoldingsTable
                  holdings={stats.enriched}
                  apiStatus={apiStatus}
                  sort={sort}
                  setSort={setSort}
                  onPriceClick={(h) => { setSelectedStock(h); setPriceModalOpen(true); }}
                  onSellClick={(h) => { setSelectedStock(h); setSellModalOpen(true); }}
                  onEditClick={(h) => {
                    if (h.sources?.length > 1) {
                      setStockToEdit(h);
                      setEditSourceModalOpen(true);
                    } else {
                      handleEditSourceSelect(h.sources?.[0] || h);
                    }
                  }}
                  onDeleteClick={(h) => { setStockToEdit(h); setDeleteSourceModalOpen(true); }}
                  t={t}
                  lang={lang}
                  baseCurr={baseCurr}
                  privacyMode={privacyMode}
                />
              </div>
            </div>
          )}
          
          {tab === 'perf' && (
            <div className="space-y-6">
              {/* Chart */}
              <div className={`${cardClass} p-6`}>
                <div className="flex flex-col md:flex-row justify-between mb-4 items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold">{t.sim_title}</h3>
                    <div className="mt-2 flex gap-4 items-center flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold opacity-60 uppercase">{t.broker_label}</span>
                        <select
                          value={selectedBrokerFilter}
                          onChange={e => setSelectedBrokerFilter(e.target.value)}
                          className="text-sm p-1 rounded bg-slate-100 dark:bg-slate-700 border-none outline-none font-bold cursor-pointer"
                        >
                          <option value="ALL">{t.all_brokers}</option>
                          {availableBrokers.filter(b => b !== 'ALL').map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold opacity-60 uppercase">{t.index_label}</span>
                        <select
                          value={selectedBenchmark}
                          onChange={e => setSelectedBenchmark(e.target.value)}
                          className="text-sm p-1 rounded bg-slate-100 dark:bg-slate-700 border-none outline-none font-bold cursor-pointer"
                        >
                          {MARKET_INDICES.map(i => (
                            <option key={i.name} value={i.name}>{i.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setShowBenchmark(!showBenchmark)}
                      className={`px-3 py-1 text-xs rounded border transition-colors ${
                        showBenchmark 
                          ? 'bg-blue-100 text-blue-600 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700' 
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {t.btn_benchmark}
                    </button>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded">
                      {TIME_RANGES.map(p => (
                        <button
                          key={p}
                          onClick={() => setTimeRange(p)}
                          className={`px-2 py-1 text-xs rounded transition-all ${
                            timeRange === p
                              ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-white font-bold'
                              : 'text-slate-500'
                          }`}
                        >
                          {t[`time_${p.toLowerCase()}`] || p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <PerformanceChart
                  data={filteredChart}
                  benchmarkData={benchmarkChartData}
                  showBenchmark={showBenchmark}
                  theme={theme}
                  baseCurr={baseCurr}
                />
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`${cardClass} p-4 text-center`}>
                  <p className="text-xs font-bold opacity-60 uppercase">{t.max_drawdown}</p>
                  <span className="text-lg font-bold text-rose-500">
                    {privacyMode ? '***' : formatCurrency(filteredStats.maxDrawdownValue, baseCurr)}
                  </span>
                  <span className="text-xs block opacity-70 text-rose-500">
                    {filteredStats.maxDrawdown?.toFixed(1)}%
                  </span>
                </div>
                <div className={`${cardClass} p-4 text-center`}>
                  <p className="text-xs font-bold opacity-60 uppercase">{t.max_gain}</p>
                  <span className={`text-lg font-bold ${filteredStats.totalGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {privacyMode ? '***' : formatCurrency(filteredStats.totalGain, baseCurr)}
                  </span>
                  <span className={`text-xs block opacity-70 ${filteredStats.totalGainPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {filteredStats.totalGainPct?.toFixed(1)}%
                  </span>
                </div>
                <div className={`${cardClass} p-4 text-center`}>
                  <p className="text-xs font-bold opacity-60 uppercase">{t.volatility}</p>
                  <span className="text-lg font-bold">{filteredStats.vol90?.toFixed(1)}%</span>
                  <span className="text-xs block opacity-50">(90d)</span>
                </div>
                <div className={`${cardClass} p-4 text-center`}>
                  <p className="text-xs font-bold opacity-60 uppercase">{t.stats_hit_rate}</p>
                  <span className={`text-lg font-bold ${filteredStats.hitRate > 50 ? 'text-emerald-500' : 'text-orange-500'}`}>
                    {filteredStats.hitRate?.toFixed(1)}%
                  </span>
                  <span className="text-xs block opacity-50">({filteredStats.totalTrades} {t.trades_label})</span>
                </div>
              </div>
            </div>
          )}
          
          {tab === 'analysis' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Donut Charts Row */}
              <div className={`${cardClass} p-6`}>
                <h3 className="font-bold mb-4">{t.chart_industry_title}</h3>
                <DonutChart
                  data={stats.secData}
                  theme={theme}
                  centerValue={stats.netWorth}
                  centerLabel={t.total_value}
                  baseCurr={baseCurr}
                  masked={privacyMode}
                />
              </div>
              <div className={`${cardClass} p-6`}>
                <h3 className="font-bold mb-4">{t.chart_region_title}</h3>
                <DonutChart
                  data={stats.regData}
                  theme={theme}
                  centerValue={stats.netWorth}
                  centerLabel={t.total_value}
                  baseCurr={baseCurr}
                  masked={privacyMode}
                />
              </div>
              <div className={`${cardClass} p-6`}>
                <h3 className="font-bold mb-4">{t.chart_holding_title}</h3>
                <DonutChart
                  data={stats.holdingData}
                  theme={theme}
                  centerValue={stats.netWorth}
                  centerLabel={t.total_value}
                  baseCurr={baseCurr}
                  masked={privacyMode}
                />
              </div>
              
              {/* Risk Analysis */}
              <div className={`${cardClass} p-6 lg:col-span-2`}>
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-orange-500" />
                  {t.risk_analysis}
                </h3>
                <div className="space-y-2">
                  {stats.enriched.filter(h => h.mWeight > 20).map(h => (
                    <div
                      key={h.symbol}
                      className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 p-3 rounded border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>{t.risk_high_conc}: <b>{h.symbol}</b> ({h.mWeight.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                  {stats.enriched.every(h => h.mWeight <= 20) && (
                    <div className="text-emerald-500 flex items-center gap-2">
                      <CheckCircle size={16} /> {t.risk_diversification} OK.
                    </div>
                  )}
                </div>
              </div>
              
              {/* Volatility */}
              <div className={`${cardClass} p-6`}>
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <Activity size={16} /> {t.volatility}
                </h4>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-xs uppercase font-bold opacity-60 mb-1">{t.vol_30}</p>
                    <p className="text-lg font-bold">{stats.vol30?.toFixed(1)}%</p>
                  </div>
                  <div className="text-center border-t dark:border-slate-700 pt-4">
                    <p className="text-xs uppercase font-bold opacity-60 mb-1">{t.vol_90}</p>
                    <p className="text-lg font-bold">{stats.vol90?.toFixed(1)}%</p>
                  </div>
                  <div className="text-center border-t dark:border-slate-700 pt-4">
                    <p className="text-xs uppercase font-bold opacity-60 mb-1">{t.vol_252}</p>
                    <p className="text-lg font-bold">{stats.vol252?.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
              
              {/* ISK Tax Calculation - NEW */}
              <div className={`${cardClass} p-6 lg:col-span-2 border-2 border-emerald-500/30`}>
                <h3 className="font-bold mb-2 flex items-center gap-2 text-emerald-500">
                  <Calculator size={18} />
                  {t.estimated_tax_title}
                </h3>
                <p className="text-xs opacity-60 mb-4">
                  {t.tax_desc}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs uppercase font-bold opacity-60 mb-1">{t.tax_base_label}</p>
                    <p className="text-lg font-bold">
                      {privacyMode ? '***' : formatCurrency(taxCalculation.taxBase, baseCurr)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs uppercase font-bold opacity-60 mb-1">{t.slr_label}</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={slrRate}
                        onChange={(e) => setSlrRate(parseFloat(e.target.value) || 0)}
                        className={`w-20 p-2 rounded border text-center font-bold ${
                          theme === 'dark'
                            ? 'bg-slate-750 border-slate-600 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                      <span className="text-lg font-bold">%</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs uppercase font-bold opacity-60 mb-1">{t.estimated_tax_label}</p>
                    <p className="text-2xl font-bold text-rose-500">
                      {privacyMode ? '***' : formatCurrency(taxCalculation.estimatedTax, baseCurr)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Placeholder for layout */}
              <div className="hidden lg:block"></div>
              
              {/* Stress & Scenario Tests - NEW */}
              <div className={`${cardClass} p-6 lg:col-span-3 border-2 border-rose-500/30`}>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-rose-500">
                  <Zap size={20} />
                  Stress- & Scenariotester
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Market Scenario */}
                  <div className={`p-4 rounded-xl border ${
                    theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                      <TrendingDown size={16} />
                      {t.market_scenario}
                    </h4>
                    <p className="text-xs opacity-60 mb-4">
                      {t.stress_market_desc}
                    </p>
                    
                    <div className="flex flex-col gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm flex-wrap">
                        <span>Om</span>
                        <select
                          value={stressIndex}
                          onChange={(e) => setStressIndex(e.target.value)}
                          className={`font-bold px-2 py-1 rounded border outline-none ${
                            theme === 'dark' ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'
                          }`}
                        >
                          {MARKET_INDICES.map(i => (
                            <option key={i.name} value={i.name}>{i.name}</option>
                          ))}
                        </select>
                        <span>ändras med</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={stressIndexChange}
                          onChange={(e) => setStressIndexChange(Number(e.target.value))}
                          className="flex-1 accent-rose-500"
                        />
                        <span className={`font-bold w-16 text-right ${
                          stressIndexChange < 0 ? 'text-rose-500' : 'text-emerald-500'
                        }`}>
                          {stressIndexChange > 0 ? '+' : ''}{stressIndexChange}%
                        </span>
                      </div>
                    </div>
                    
                    <div className={`pt-4 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold opacity-70">{t.impact_label}</span>
                        <div className="text-right">
                          <span className={`font-bold mr-2 ${
                            stressTest.marketImpactVal >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}>
                            {stressTest.marketImpactVal > 0 ? '+' : ''}
                            {privacyMode ? '***' : formatCurrency(stressTest.marketImpactVal, baseCurr)}
                          </span>
                          <span className={`text-xs ${
                            stressTest.marketImpactVal >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}>
                            ({stressTest.marketImpactPct > 0 ? '+' : ''}{stressTest.marketImpactPct.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold opacity-70">{t.new_value_label}</span>
                        <span className="font-bold text-lg">
                          {privacyMode ? '***' : formatCurrency(stressTest.marketNewVal, baseCurr)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Currency Scenario */}
                  <div className={`p-4 rounded-xl border ${
                    theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                      <Globe size={16} />
                      {t.currency_scenario}
                    </h4>
                    <p className="text-xs opacity-60 mb-4">
                      {t.stress_fx_desc}
                    </p>
                    
                    <div className="flex flex-col gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm flex-wrap">
                        <span>Om</span>
                        <select
                          value={stressFxTo}
                          onChange={(e) => setStressFxTo(e.target.value)}
                          className={`font-bold px-2 py-1 rounded border outline-none ${
                            theme === 'dark' ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'
                          }`}
                        >
                          {CURRENCIES.filter(c => c !== 'SEK').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <span>{stressFxChange >= 0 ? 'stärks' : 'försvagas'} {Math.abs(stressFxChange)}% mot</span>
                        <select
                          value={stressFxFrom}
                          onChange={(e) => setStressFxFrom(e.target.value)}
                          className={`font-bold px-2 py-1 rounded border outline-none ${
                            theme === 'dark' ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'
                          }`}
                        >
                          {CURRENCIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="-30"
                          max="30"
                          value={stressFxChange}
                          onChange={(e) => setStressFxChange(Number(e.target.value))}
                          className="flex-1 accent-blue-500"
                        />
                        <span className={`font-bold w-16 text-right ${
                          stressFxChange > 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {stressFxChange > 0 ? '+' : ''}{stressFxChange}%
                        </span>
                      </div>
                    </div>
                    
                    <div className={`pt-4 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold opacity-70">{t.holdings_in} {stressFxTo}</span>
                        <span className="font-bold">
                          {privacyMode ? '***' : formatCurrency(stressTest.holdingsInTargetCurr, baseCurr)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold opacity-70">{t.impact_label}</span>
                        <div className="text-right">
                          <span className={`font-bold mr-2 ${
                            stressTest.fxImpactVal >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}>
                            {stressTest.fxImpactVal > 0 ? '+' : ''}
                            {privacyMode ? '***' : formatCurrency(stressTest.fxImpactVal, baseCurr)}
                          </span>
                          <span className={`text-xs ${
                            stressTest.fxImpactVal >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}>
                            ({stressTest.fxImpactPct > 0 ? '+' : ''}{stressTest.fxImpactPct.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold opacity-70">{t.new_value_total}</span>
                        <span className="font-bold text-lg">
                          {privacyMode ? '***' : formatCurrency(stressTest.fxNewVal, baseCurr)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Beta Analysis Table - NEW */}
              <div className={`${cardClass} p-6 lg:col-span-3`}>
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <BarChart2 size={18} />
                  Beta-analys
                </h3>
                <div className={`overflow-x-auto rounded border ${
                  theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
                }`}>
                  <table className="w-full text-sm">
                    <thead className={`text-xs uppercase ${
                      theme === 'dark' ? 'bg-slate-900 text-slate-500' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <tr>
                        <th className="p-3 text-left">{t.holdings_label}</th>
                        <th className="p-3 text-right">Vikt %</th>
                        <th className="p-3 text-right">Beta</th>
                        <th className="p-3 text-right">Riskbidrag</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700' : 'divide-slate-200'}`}>
                      {stats.enriched.sort((a, b) => (b.beta || 1) - (a.beta || 1)).map(h => (
                        <tr key={h.symbol} className={`${
                          theme === 'dark' ? 'hover:bg-slate-750' : 'hover:bg-slate-50'
                        }`}>
                          <td className="p-3 font-bold">{h.symbol}</td>
                          <td className="p-3 text-right">{h.mWeight?.toFixed(2)}%</td>
                          <td className={`p-3 text-right font-bold ${
                            (h.beta || 1) > 1.3 ? 'text-orange-500' : (h.beta || 1) < 0.7 ? 'text-blue-500' : ''
                          }`}>
                            {Number(h.beta || 1).toFixed(2)}
                          </td>
                          <td className="p-3 text-right opacity-70">
                            {((h.beta || 1) * (h.mWeight || 0) / 100).toFixed(3)}
                          </td>
                        </tr>
                      ))}
                      {stats.enriched.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-6 text-center opacity-50">
                            {t.no_holdings}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className={`font-bold ${
                      theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100'
                    }`}>
                      <tr>
                        <td className="p-3">{t.total_label}</td>
                        <td className="p-3 text-right">100%</td>
                        <td className="p-3 text-right text-blue-500">{stats.portfolioBeta?.toFixed(2)}</td>
                        <td className="p-3 text-right">{stats.portfolioBeta?.toFixed(3)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {tab === 'calendar' && (
            <div className="space-y-6">
              <div className={`${cardClass} p-6`}>
                <h3 className="font-bold mb-4">{t.estimated_monthly_dividend}</h3>
                <DividendBarChart
                  data={stats.monthlyDivData}
                  theme={theme}
                  baseCurr={baseCurr}
                />
              </div>
              <div className={`${cardClass} p-6`}>
                <h3 className="text-xl font-bold mb-4">{t.cal_title}</h3>
                <div className="space-y-4">
                  {stats.enriched
                    .filter(h => h.nextDivDate)
                    .sort((a, b) => new Date(a.nextDivDate) - new Date(b.nextDivDate))
                    .map(h => (
                      <div
                        key={h.symbol}
                        className="flex items-center justify-between p-3 border-b dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 p-2 rounded-lg text-center min-w-[50px]">
                            <span className="text-xs block font-bold">
                              {new Date(h.nextDivDate).toLocaleString('default', { month: 'short' }).toUpperCase()}
                            </span>
                            <span className="text-xl font-bold block leading-none">
                              {new Date(h.nextDivDate).getDate()}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold">{h.symbol}</p>
                            <p className="text-xs opacity-60">{h.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-500">
                            +{privacyMode ? '***' : formatCurrency(h.shares * h.dividend, h.currency, lang)}
                          </p>
                          <p className="text-xs opacity-60">{t.est_label}</p>
                        </div>
                      </div>
                    ))}
                  {stats.enriched.filter(h => h.nextDivDate).length === 0 && (
                    <div className="text-center opacity-50 py-10 flex flex-col items-center gap-2">
                      <Calendar size={32} />
                      {t.cal_empty}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {tab === 'brokers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.keys(stats.byBroker).map(broker => {
                // Calculate cash and loans for this broker
                let brokerCash = 0;
                data.cashAccounts?.forEach(c => {
                  if ((c.broker || BROKERS[0]) === broker) {
                    brokerCash += (Number(c.value) || 0) * (fx[c.currency] || 1) / (fx[baseCurr] || 1);
                  }
                });
                let brokerLoan = 0;
                data.loanAccounts?.forEach(l => {
                  if ((l.broker || BROKERS[0]) === broker) {
                    brokerLoan += (Number(l.value) || 0) * (fx[l.currency] || 1) / (fx[baseCurr] || 1);
                  }
                });
                
                const holdingsTotal = stats.byBroker[broker].reduce((sum, h) => sum + h.marketValueBase, 0);
                const brokerTotal = holdingsTotal + brokerCash - brokerLoan;
                
                return (
                  <div key={broker} className={`${cardClass} p-4`}>
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <Briefcase size={16} /> {broker}
                    </h3>
                    <div className="space-y-3">
                      {/* Holdings */}
                      <div>
                        <h4 className="text-xs font-bold uppercase opacity-60 mb-2">{t.holdings_label}</h4>
                        <div className="space-y-2">
                          {stats.byBroker[broker].map(h => (
                            <div key={h.id} className="flex justify-between text-sm border-b dark:border-slate-700 pb-1 last:border-0">
                              <span>{h.symbol}</span>
                              <span className="font-bold">
                                {privacyMode ? '***' : formatCurrency(h.marketValueBase, baseCurr)}
                              </span>
                            </div>
                          ))}
                          <div className="pt-2 border-t dark:border-slate-600 flex justify-between font-bold">
                            <span>{t.holdings_total}</span>
                            <span>
                              {privacyMode ? '***' : formatCurrency(holdingsTotal, baseCurr)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Cash */}
                      <div className="pt-2 border-t dark:border-slate-700">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold opacity-70">{t.liquidity_label}</span>
                          <span className={`font-bold ${brokerCash >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {privacyMode ? '***' : formatCurrency(brokerCash, baseCurr)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Loans */}
                      <div className="pt-2 border-t dark:border-slate-700">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold opacity-70">{t.loan_label}</span>
                          <span className={`font-bold ${brokerLoan > 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                            {privacyMode ? '***' : formatCurrency(brokerLoan, baseCurr)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Total */}
                      <div className="pt-2 border-t-2 dark:border-slate-600 flex justify-between font-bold text-lg">
                        <span>{t.total_label}</span>
                        <span className={brokerTotal >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                          {privacyMode ? '***' : formatCurrency(brokerTotal, baseCurr)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {tab === 'settings' && (
            <div className={`${cardClass} max-w-2xl mx-auto p-8`}>
              <h3 className="text-xl font-bold mb-6 flex justify-center gap-2 items-center">
                <Settings size={20} /> {t.nav_settings}
              </h3>
              
              {/* Cash & Loans */}
              <div className="space-y-6 mb-8">
                {/* Cash Accounts */}
                <div className={`p-4 rounded-lg border ${
                  theme === 'dark' ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-emerald-50/50 border-emerald-100'
                }`}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <Wallet size={16} /> {t.settings_deposit}
                    </h4>
                    <button
                      onClick={() => addAccount('cash')}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded flex items-center gap-1"
                    >
                      <Plus size={12} /> {t.btn_add_account}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {data.cashAccounts?.map(acc => (
                      <div key={acc.id} className="grid grid-cols-12 gap-2 items-center">
                        <select
                          value={acc.broker || BROKERS[0]}
                          onChange={e => updateAccount('cash', acc.id, 'broker', e.target.value)}
                          className={`col-span-4 ${inputClass} text-sm`}
                        >
                          {BROKERS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <input
                          type="number"
                          value={acc.value || 0}
                          onChange={e => updateAccount('cash', acc.id, 'value', e.target.value)}
                          className={`col-span-4 ${inputClass} text-sm font-mono`}
                        />
                        <select
                          value={acc.currency || 'SEK'}
                          onChange={e => updateAccount('cash', acc.id, 'currency', e.target.value)}
                          className={`col-span-3 ${inputClass} text-sm`}
                        >
                          {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <button
                          onClick={() => removeAccount('cash', acc.id)}
                          className="col-span-1 text-slate-400 hover:text-rose-500 p-1 flex items-center justify-center"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    ))}
                    {(!data.cashAccounts || data.cashAccounts.length === 0) && (
                      <p className="text-xs opacity-50 italic text-center">{t.no_liquidity_accounts}</p>
                    )}
                  </div>
                </div>
                
                {/* Loan Accounts */}
                <div className={`p-4 rounded-lg border ${
                  theme === 'dark' ? 'bg-rose-900/10 border-rose-900/30' : 'bg-rose-50/50 border-rose-100'
                }`}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <CreditCard size={16} /> {t.settings_loan}
                    </h4>
                    <button
                      onClick={() => addAccount('loan')}
                      className="text-xs bg-rose-600 hover:bg-rose-500 text-white px-2 py-1 rounded flex items-center gap-1"
                    >
                      <Plus size={12} /> {t.btn_add_account}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {data.loanAccounts?.map(acc => (
                      <div key={acc.id} className="grid grid-cols-12 gap-2 items-center">
                        <select
                          value={acc.broker || BROKERS[0]}
                          onChange={e => updateAccount('loan', acc.id, 'broker', e.target.value)}
                          className={`col-span-4 ${inputClass} text-sm`}
                        >
                          {BROKERS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <input
                          type="number"
                          value={acc.value || 0}
                          onChange={e => updateAccount('loan', acc.id, 'value', e.target.value)}
                          className={`col-span-4 ${inputClass} text-sm font-mono`}
                        />
                        <select
                          value={acc.currency || 'SEK'}
                          onChange={e => updateAccount('loan', acc.id, 'currency', e.target.value)}
                          className={`col-span-3 ${inputClass} text-sm`}
                        >
                          {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <button
                          onClick={() => removeAccount('loan', acc.id)}
                          className="col-span-1 text-slate-400 hover:text-rose-500 p-1 flex items-center justify-center"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    ))}
                    {(!data.loanAccounts || data.loanAccounts.length === 0) && (
                      <p className="text-xs opacity-50 italic text-center">{t.no_loans}</p>
                    )}
                  </div>
                </div>
                
                {/* Base Currency */}
                <div>
                  <label className="text-xs font-bold mb-1 block text-blue-500">{t.settings_base_curr}</label>
                  <select
                    value={baseCurr}
                    onChange={e => setBaseCurr(e.target.value)}
                    className={inputClass}
                  >
                    {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              
              {/* API Keys */}
              <div className="space-y-4 mb-8">
                <h4 className="font-bold">{t.api_settings}</h4>
                <div>
                  <label className="text-xs font-bold block mb-1 text-emerald-500">{t.api_prio_eodhd}</label>
                  <input
                    value={apiKeys.eodhd}
                    onChange={e => setApiKeys(k => ({ ...k, eodhd: e.target.value }))}
                    className={inputClass}
                    type="password"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">{t.api_prio_1}</label>
                  <input
                    value={apiKeys.finnhub}
                    onChange={e => setApiKeys(k => ({ ...k, finnhub: e.target.value }))}
                    className={inputClass}
                    type="password"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">{t.api_prio_2}</label>
                  <input
                    value={apiKeys.alphaVantage}
                    onChange={e => setApiKeys(k => ({ ...k, alphaVantage: e.target.value }))}
                    className={inputClass}
                    type="password"
                  />
                </div>
              </div>
              
              {/* Export/Import */}
              <div className="pt-6 border-t dark:border-slate-700 space-y-4">
                <h4 className="font-bold">{t.backup_title}</h4>
                <div className="flex gap-3">
                  <button
                    onClick={handleExportExcel}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    <FileSpreadsheet size={16} /> {t.btn_export_excel}
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleBackup}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    <Download size={16} /> {t.btn_backup_save}
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="file"
                      ref={fileRef}
                      className="hidden"
                      onChange={handleRestore}
                      accept=".json"
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full bg-slate-600 hover:bg-slate-500 text-white px-4 py-3 rounded font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      <Upload size={16} /> {t.btn_backup_load}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;


