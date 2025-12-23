import { useState, useCallback } from 'react';
import { CRYPTO_SYMBOLS } from '../utils/constants';

/**
 * API Configuration
 */
const API_ENDPOINTS = {
  EODHD: (symbol, apiKey) => 
    `https://eodhd.com/api/real-time/${symbol}?api_token=${apiKey}&fmt=json`,
  
  MARKETSTACK: (symbol, apiKey) => {
    // Convert .ST to .XSTO for Marketstack
    const msSymbol = symbol.includes('.ST') ? symbol.replace('.ST', '.XSTO') : symbol;
    return `http://api.marketstack.com/v1/eod/latest?access_key=${apiKey}&symbols=${msSymbol}`;
  },
  
  FINNHUB_QUOTE: (symbol, apiKey) => {
    const fhSymbol = symbol.includes('.STO') ? symbol.replace('.STO', '.ST') : symbol;
    return `https://finnhub.io/api/v1/quote?symbol=${fhSymbol}&token=${apiKey}`;
  },
  
  FINNHUB_SEARCH: (query, apiKey) => 
    `https://finnhub.io/api/v1/search?q=${query}&token=${apiKey}`,
  
  FINNHUB_METRICS: (symbol, apiKey) => 
    `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`,
  
  ALPHAVANTAGE: (symbol, apiKey) => {
    const avSymbol = symbol.includes('.ST') ? symbol.replace('.ST', '.STO') : symbol;
    return `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${avSymbol}&apikey=${apiKey}`;
  },
  
  ALPHAVANTAGE_OVERVIEW: (symbol, apiKey) => {
    const avSymbol = symbol.includes('.ST') ? symbol.replace('.ST', '.STO') : symbol;
    return `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${avSymbol}&apikey=${apiKey}`;
  },
  
  BINANCE: (symbol) => {
    const binSymbol = symbol.replace('/', '').toUpperCase() + 'USDT';
    return `https://api.binance.com/api/v3/ticker/price?symbol=${binSymbol}`;
  },
  
  FRANKFURTER_FX: (baseCurr) => 
    `https://api.frankfurter.app/latest?from=${baseCurr}`
};

/**
 * Fetch price from EODHD
 */
async function fetchEODHD(symbol, apiKey) {
  if (!apiKey) return null;
  
  try {
    const response = await fetch(API_ENDPOINTS.EODHD(symbol, apiKey));
    const data = await response.json();
    return data.close ? parseFloat(data.close) : null;
  } catch (error) {
    console.warn('EODHD fetch error:', error);
    return null;
  }
}

/**
 * Fetch price from Marketstack
 */
async function fetchMarketstack(symbol, apiKey) {
  if (!apiKey) return null;
  
  try {
    const response = await fetch(API_ENDPOINTS.MARKETSTACK(symbol, apiKey));
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      return data.data[0].close;
    }
    return null;
  } catch (error) {
    console.warn('Marketstack fetch error:', error);
    return null;
  }
}

/**
 * Fetch price from Finnhub
 */
async function fetchFinnhub(symbol, apiKey) {
  if (!apiKey) return null;
  
  try {
    const response = await fetch(API_ENDPOINTS.FINNHUB_QUOTE(symbol, apiKey));
    const data = await response.json();
    return data.c > 0 ? data.c : null;
  } catch (error) {
    console.warn('Finnhub fetch error:', error);
    return null;
  }
}

/**
 * Fetch price from Alpha Vantage
 */
async function fetchAlphaVantage(symbol, apiKey) {
  if (!apiKey) return null;
  
  try {
    const response = await fetch(API_ENDPOINTS.ALPHAVANTAGE(symbol, apiKey));
    const data = await response.json();
    return data['Global Quote'] ? parseFloat(data['Global Quote']['05. price']) : null;
  } catch (error) {
    console.warn('Alpha Vantage fetch error:', error);
    return null;
  }
}

/**
 * Fetch crypto price from Binance
 */
async function fetchBinance(symbol) {
  try {
    const response = await fetch(API_ENDPOINTS.BINANCE(symbol));
    const data = await response.json();
    return data.price ? parseFloat(data.price) : null;
  } catch (error) {
    console.warn('Binance fetch error:', error);
    return null;
  }
}

/**
 * Fetch beta from APIs
 */
async function fetchBeta(symbol, apiKeys) {
  // Try Finnhub first
  if (apiKeys.finnhub) {
    try {
      const response = await fetch(API_ENDPOINTS.FINNHUB_METRICS(symbol, apiKeys.finnhub));
      const data = await response.json();
      if (data.metric && data.metric.beta) {
        return data.metric.beta;
      }
    } catch (error) {
      console.warn('Finnhub beta fetch error:', error);
    }
  }
  
  // Try Alpha Vantage
  if (apiKeys.alphaVantage) {
    try {
      const response = await fetch(API_ENDPOINTS.ALPHAVANTAGE_OVERVIEW(symbol, apiKeys.alphaVantage));
      const data = await response.json();
      if (data.Beta) {
        return parseFloat(data.Beta);
      }
    } catch (error) {
      console.warn('Alpha Vantage beta fetch error:', error);
    }
  }
  
  return null;
}

/**
 * Hook for fetching stock/crypto prices with fallback chain
 */
export function useApi() {
  const [status, setStatus] = useState({}); // { [symbolOrId]: 'loading' | 'ok' | 'error' }
  
  /**
   * Fetch price for a symbol using available APIs
   */
  const getPrice = useCallback(async (symbol, apiKeys) => {
    // Check if it's a crypto symbol
    const isCrypto = CRYPTO_SYMBOLS.some(c => symbol.toUpperCase().includes(c)) && !symbol.includes('.');
    
    if (isCrypto) {
      const price = await fetchBinance(symbol);
      if (price) return price;
    }
    
    // Try APIs in priority order
    let price = null;
    
    // 1. EODHD
    if (!price && apiKeys.eodhd) {
      price = await fetchEODHD(symbol, apiKeys.eodhd);
    }
    
    // 2. Marketstack
    if (!price && apiKeys.marketstack) {
      price = await fetchMarketstack(symbol, apiKeys.marketstack);
    }
    
    // 3. Finnhub
    if (!price && apiKeys.finnhub) {
      price = await fetchFinnhub(symbol, apiKeys.finnhub);
    }
    
    // 4. Alpha Vantage
    if (!price && apiKeys.alphaVantage) {
      price = await fetchAlphaVantage(symbol, apiKeys.alphaVantage);
    }
    
    return price;
  }, []);
  
  /**
   * Search for symbols using Finnhub
   */
  const searchSymbols = useCallback(async (query, apiKey) => {
    if (!apiKey || !query || query.length < 2) return [];
    
    // Quick crypto detection
    if (CRYPTO_SYMBOLS.includes(query.toUpperCase())) {
      return [{ symbol: query.toUpperCase(), description: 'Crypto (Binance)' }];
    }
    
    try {
      const response = await fetch(API_ENDPOINTS.FINNHUB_SEARCH(query, apiKey));
      const data = await response.json();
      return data.result || [];
    } catch (error) {
      console.warn('Search error:', error);
      return [];
    }
  }, []);
  
  /**
   * Get beta for a symbol
   */
  const getBeta = useCallback(async (symbol, apiKeys) => {
    return await fetchBeta(symbol, apiKeys);
  }, []);
  
  /**
   * Fetch FX rates
   */
  const fetchFxRates = useCallback(async (baseCurr, currencies) => {
    try {
      const response = await fetch(API_ENDPOINTS.FRANKFURTER_FX(baseCurr));
      const data = await response.json();
      
      const rates = { [baseCurr]: 1 };
      
      if (data.rates) {
        Object.keys(data.rates).forEach(currency => {
          if (currencies.includes(currency)) {
            rates[currency] = 1 / data.rates[currency];
          }
        });
      }
      
      return rates;
    } catch (error) {
      console.warn('FX rates fetch error:', error);
      return null;
    }
  }, []);
  
  /**
   * Update prices for multiple holdings
   */
  const updateAllPrices = useCallback(async (holdings, apiKeys, onUpdate) => {
    // Get unique symbols
    const uniqueSymbols = [...new Set(holdings.map(h => h.symbol))];
    
    // Fetch prices with delay to avoid rate limiting
    for (let i = 0; i < uniqueSymbols.length; i++) {
      const symbol = uniqueSymbols[i];
      const holdingIds = holdings.filter(h => h.symbol === symbol).map(h => h.id);
      
      // Set loading status
      holdingIds.forEach(id => {
        setStatus(prev => ({ ...prev, [id]: 'loading' }));
      });
      
      // Add delay between requests
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
      
      const price = await getPrice(symbol, apiKeys);
      
      if (price) {
        // Update each holding with this symbol
        holdingIds.forEach(id => {
          setStatus(prev => ({ ...prev, [id]: 'ok' }));
          onUpdate(id, price);
        });
      } else {
        holdingIds.forEach(id => {
          setStatus(prev => ({ ...prev, [id]: 'error' }));
        });
      }
    }
  }, [getPrice]);
  
  return {
    status,
    setStatus,
    getPrice,
    searchSymbols,
    getBeta,
    fetchFxRates,
    updateAllPrices
  };
}

export default useApi;












