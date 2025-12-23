import { useState, useCallback, useEffect } from 'react';
import { MARKET_INDICES } from '../utils/constants';
import { useLocalStorage } from './useLocalStorage';

/**
 * Hook for fetching and managing benchmark/index data
 * 
 * Uses multiple APIs to fetch historical index data for comparison
 */
export function useBenchmark() {
  const [benchmarkData, setBenchmarkData] = useLocalStorage('pf_benchmark_data_v2', {});
  const [selectedBenchmark, setSelectedBenchmark] = useLocalStorage('pf_selected_benchmark', 'OMXS30');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useLocalStorage('pf_benchmark_last_update', null);
  
  /**
   * Fetch historical data from Alpha Vantage
   */
  const fetchFromAlphaVantage = useCallback(async (symbol, apiKey) => {
    if (!apiKey) return null;
    
    try {
      // Map internal symbols to Alpha Vantage symbols
      const avSymbolMap = {
        '^OMXS30': 'EWD', // ETF that tracks Sweden (approximation)
        '^GSPC': 'SPY',   // S&P 500 ETF
        '^NDX': 'QQQ',    // Nasdaq 100 ETF
        '^DJI': 'DIA',    // Dow Jones ETF
        '^GDAXI': 'EWG',  // Germany ETF
        '^FTSE': 'EWU',   // UK ETF
        '^N225': 'EWJ',   // Japan ETF
        'URTH': 'URTH'    // MSCI World ETF
      };
      
      const avSymbol = avSymbolMap[symbol] || symbol;
      
      const response = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${avSymbol}&outputsize=full&apikey=${apiKey}`
      );
      const data = await response.json();
      
      if (data['Time Series (Daily)']) {
        const timeSeries = data['Time Series (Daily)'];
        const points = Object.entries(timeSeries).map(([date, values]) => ({
          date,
          value: parseFloat(values['4. close'])
        })).reverse(); // Oldest first
        
        return points;
      }
      
      return null;
    } catch (error) {
      console.warn('Alpha Vantage benchmark fetch error:', error);
      return null;
    }
  }, []);
  
  /**
   * Fetch historical data from EODHD
   */
  const fetchFromEODHD = useCallback(async (symbol, apiKey) => {
    if (!apiKey) return null;
    
    try {
      // Map symbols for EODHD
      const eodhSymbolMap = {
        '^OMXS30': 'OMXS30.INDX',
        '^GSPC': 'GSPC.INDX',
        '^NDX': 'NDX.INDX',
        '^DJI': 'DJI.INDX',
        '^GDAXI': 'GDAXI.INDX',
        '^FTSE': 'FTSE.INDX',
        '^N225': 'N225.INDX',
        '^STOXX50E': 'STOXX50E.INDX',
        '^HSI': 'HSI.INDX'
      };
      
      const eodhSymbol = eodhSymbolMap[symbol] || symbol;
      
      // Get last 3 years of data
      const from = new Date();
      from.setFullYear(from.getFullYear() - 3);
      const fromStr = from.toISOString().split('T')[0];
      
      const response = await fetch(
        `https://eodhd.com/api/eod/${eodhSymbol}?api_token=${apiKey}&fmt=json&from=${fromStr}`
      );
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        return data.map(d => ({
          date: d.date,
          value: d.close
        }));
      }
      
      return null;
    } catch (error) {
      console.warn('EODHD benchmark fetch error:', error);
      return null;
    }
  }, []);
  
  /**
   * Generate simulated benchmark data (fallback)
   * Based on historical averages for each index
   * If portfolioData is provided, generates data for the same dates
   */
  const generateSimulatedData = useCallback((indexName, portfolioData = null) => {
    // Historical annual returns and volatility approximations
    const indexParams = {
      'OMXS30': { annualReturn: 0.08, volatility: 0.18 },
      'S&P 500': { annualReturn: 0.10, volatility: 0.15 },
      'Nasdaq 100': { annualReturn: 0.14, volatility: 0.22 },
      'Dow Jones': { annualReturn: 0.08, volatility: 0.14 },
      'DAX': { annualReturn: 0.07, volatility: 0.20 },
      'FTSE 100': { annualReturn: 0.05, volatility: 0.14 },
      'Nikkei 225': { annualReturn: 0.06, volatility: 0.20 },
      'Euro Stoxx 50': { annualReturn: 0.06, volatility: 0.18 },
      'Hang Seng': { annualReturn: 0.04, volatility: 0.22 },
      'MSCI World': { annualReturn: 0.08, volatility: 0.14 }
    };
    
    const params = indexParams[indexName] || { annualReturn: 0.07, volatility: 0.15 };
    const dailyReturn = params.annualReturn / 252;
    const dailyVol = params.volatility / Math.sqrt(252);
    
    // If portfolio data provided, use those dates
    if (portfolioData && portfolioData.length > 0) {
      const sorted = [...portfolioData].sort((a, b) => new Date(a.date) - new Date(b.date));
      const data = [];
      let value = 100;
      
      sorted.forEach((p, index) => {
        if (index > 0) {
          // Random walk with drift
          const random = (Math.random() - 0.5) * 2;
          value = value * (1 + dailyReturn + dailyVol * random);
        }
        
        data.push({
          date: p.date,
          value: value
        });
      });
      
      return data;
    }
    
    // Otherwise generate for last 3 years
    const data = [];
    let value = 100;
    const endDate = new Date();
    const days = 365 * 3;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Random walk with drift
      const random = (Math.random() - 0.5) * 2;
      value = value * (1 + dailyReturn + dailyVol * random);
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: value
      });
    }
    
    return data;
  }, []);
  
  /**
   * Fetch benchmark data
   */
  const fetchBenchmarkData = useCallback(async (indexName, apiKeys) => {
    setIsLoading(true);
    
    const index = MARKET_INDICES.find(i => i.name === indexName);
    if (!index) {
      setIsLoading(false);
      return null;
    }
    
    let data = null;
    
    // Try EODHD first
    if (apiKeys.eodhd) {
      data = await fetchFromEODHD(index.symbol, apiKeys.eodhd);
    }
    
    // Try Alpha Vantage
    if (!data && apiKeys.alphaVantage) {
      data = await fetchFromAlphaVantage(index.symbol, apiKeys.alphaVantage);
    }
    
    // Fall back to simulated data
    if (!data) {
      console.log(`Using simulated data for ${indexName}`);
      data = generateSimulatedData(indexName);
    }
    
    // Store the data
    if (data && data.length > 0) {
      setBenchmarkData(prev => ({
        ...prev,
        [indexName]: {
          data,
          lastFetched: new Date().toISOString()
        }
      }));
      setLastUpdate(new Date().toISOString());
    }
    
    setIsLoading(false);
    return data;
  }, [fetchFromEODHD, fetchFromAlphaVantage, generateSimulatedData, setBenchmarkData, setLastUpdate]);
  
  /**
   * Get benchmark data for a specific date range
   */
  const getBenchmarkForRange = useCallback((indexName, startDate, endDate) => {
    const stored = benchmarkData[indexName];
    if (!stored || !stored.data) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return stored.data.filter(d => {
      const date = new Date(d.date);
      return date >= start && date <= end;
    });
  }, [benchmarkData]);
  
  /**
   * Align benchmark data with portfolio data for comparison
   */
  const alignWithPortfolio = useCallback((portfolioData, indexName) => {
    const stored = benchmarkData[indexName];
    if (!stored || !stored.data || !portfolioData || portfolioData.length === 0) {
      return null;
    }
    
    // Create a map of benchmark data by date
    const benchmarkMap = new Map(
      stored.data.map(d => [d.date.split('T')[0], d.value])
    );
    
    // Align with portfolio dates
    const aligned = [];
    let lastKnownValue = null;
    
    for (const pData of portfolioData) {
      const dateKey = pData.date.split('T')[0];
      let benchValue = benchmarkMap.get(dateKey);
      
      // If no exact match, try to find closest previous date
      if (!benchValue) {
        // Use last known value (carry forward)
        benchValue = lastKnownValue;
      } else {
        lastKnownValue = benchValue;
      }
      
      if (benchValue) {
        aligned.push({
          date: pData.date,
          value: benchValue
        });
      }
    }
    
    return aligned;
  }, [benchmarkData]);
  
  /**
   * Calculate performance metrics for benchmark
   */
  const getBenchmarkMetrics = useCallback((indexName, days = 365) => {
    const stored = benchmarkData[indexName];
    if (!stored || !stored.data || stored.data.length < 2) {
      return null;
    }
    
    const data = stored.data.slice(-days);
    if (data.length < 2) return null;
    
    const startValue = data[0].value;
    const endValue = data[data.length - 1].value;
    const totalReturn = ((endValue - startValue) / startValue) * 100;
    
    // Calculate daily returns
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i].value - data[i - 1].value) / data[i - 1].value);
    }
    
    // Volatility
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
    const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100;
    
    return {
      totalReturn,
      annualizedReturn: totalReturn * (365 / days),
      volatility,
      startValue,
      endValue,
      dataPoints: data.length
    };
  }, [benchmarkData]);
  
  return {
    benchmarkData,
    selectedBenchmark,
    setSelectedBenchmark,
    isLoading,
    lastUpdate,
    fetchBenchmarkData,
    getBenchmarkForRange,
    alignWithPortfolio,
    getBenchmarkMetrics,
    generateSimulatedData
  };
}

export default useBenchmark;




