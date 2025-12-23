/**
 * Calculate portfolio statistics
 */

/**
 * Calculate Sharpe Ratio
 * @param {number[]} returns - Array of periodic returns
 * @param {number} riskFreeRate - Annual risk-free rate (default 3%)
 * @returns {number} Sharpe ratio
 */
export function calculateSharpeRatio(returns, riskFreeRate = 0.03) {
  if (!returns || returns.length < 2) return 0;
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  
  // Annualize: assuming daily returns
  const annualizedReturn = mean * 252;
  const annualizedStdDev = stdDev * Math.sqrt(252);
  
  return (annualizedReturn - riskFreeRate) / annualizedStdDev;
}

/**
 * Calculate Sortino Ratio (downside risk only)
 * @param {number[]} returns - Array of periodic returns
 * @param {number} targetReturn - Target return (default 0)
 * @returns {number} Sortino ratio
 */
export function calculateSortinoRatio(returns, targetReturn = 0) {
  if (!returns || returns.length < 2) return 0;
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const downsideReturns = returns.filter(r => r < targetReturn);
  
  if (downsideReturns.length === 0) return mean > 0 ? Infinity : 0;
  
  const downsideVariance = downsideReturns.reduce((a, b) => a + Math.pow(b - targetReturn, 2), 0) / downsideReturns.length;
  const downsideDeviation = Math.sqrt(downsideVariance);
  
  if (downsideDeviation === 0) return 0;
  
  // Annualize
  const annualizedReturn = mean * 252;
  const annualizedDownside = downsideDeviation * Math.sqrt(252);
  
  return annualizedReturn / annualizedDownside;
}

/**
 * Calculate Maximum Drawdown
 * @param {number[]} values - Array of portfolio values
 * @returns {{ maxDrawdown: number, maxDrawdownValue: number, peakValue: number }}
 */
export function calculateMaxDrawdown(values) {
  if (!values || values.length < 2) return { maxDrawdown: 0, maxDrawdownValue: 0, peakValue: 0 };
  
  let peak = values[0];
  let maxDrawdown = 0;
  let maxDrawdownValue = 0;
  let trough = values[0];
  
  for (const value of values) {
    if (value > peak) {
      peak = value;
    }
    
    const drawdown = (value - peak) / peak;
    
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownValue = value - peak;
      trough = value;
    }
  }
  
  return {
    maxDrawdown: maxDrawdown * 100, // Return as percentage
    maxDrawdownValue,
    peakValue: peak
  };
}

/**
 * Calculate annualized volatility
 * @param {number[]} returns - Array of returns
 * @param {number} periods - Number of periods to use (default all)
 * @returns {number} Annualized volatility as percentage
 */
export function calculateVolatility(returns, periods = null) {
  if (!returns || returns.length < 2) return 0;
  
  const slice = periods ? returns.slice(-periods) : returns;
  if (slice.length < 2) return 0;
  
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (slice.length - 1);
  const stdDev = Math.sqrt(variance);
  
  // Annualize (assuming daily returns)
  return stdDev * Math.sqrt(252) * 100;
}

/**
 * Calculate daily returns from values
 * @param {number[]} values - Array of portfolio values
 * @returns {number[]} Array of daily returns
 */
export function calculateReturns(values) {
  if (!values || values.length < 2) return [];
  
  const returns = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] !== 0) {
      returns.push((values[i] - values[i - 1]) / values[i - 1]);
    }
  }
  return returns;
}

/**
 * Calculate portfolio beta against benchmark
 * @param {number[]} portfolioReturns - Portfolio returns
 * @param {number[]} benchmarkReturns - Benchmark returns
 * @returns {number} Portfolio beta
 */
export function calculateBeta(portfolioReturns, benchmarkReturns) {
  if (!portfolioReturns || !benchmarkReturns || portfolioReturns.length < 2) return 1;
  
  const minLen = Math.min(portfolioReturns.length, benchmarkReturns.length);
  const pReturns = portfolioReturns.slice(-minLen);
  const bReturns = benchmarkReturns.slice(-minLen);
  
  const pMean = pReturns.reduce((a, b) => a + b, 0) / pReturns.length;
  const bMean = bReturns.reduce((a, b) => a + b, 0) / bReturns.length;
  
  let covariance = 0;
  let bVariance = 0;
  
  for (let i = 0; i < minLen; i++) {
    covariance += (pReturns[i] - pMean) * (bReturns[i] - bMean);
    bVariance += Math.pow(bReturns[i] - bMean, 2);
  }
  
  if (bVariance === 0) return 1;
  
  return covariance / bVariance;
}

/**
 * Calculate alpha (Jensen's Alpha)
 * @param {number} portfolioReturn - Portfolio return
 * @param {number} benchmarkReturn - Benchmark return
 * @param {number} beta - Portfolio beta
 * @param {number} riskFreeRate - Risk-free rate
 * @returns {number} Alpha
 */
export function calculateAlpha(portfolioReturn, benchmarkReturn, beta, riskFreeRate = 0.03) {
  return portfolioReturn - (riskFreeRate + beta * (benchmarkReturn - riskFreeRate));
}

/**
 * Calculate weighted average
 * @param {Array<{value: number, weight: number}>} items - Items with values and weights
 * @returns {number} Weighted average
 */
export function calculateWeightedAverage(items) {
  if (!items || items.length === 0) return 0;
  
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) return 0;
  
  return items.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;
}

/**
 * Calculate CAGR (Compound Annual Growth Rate)
 * @param {number} startValue - Starting value
 * @param {number} endValue - Ending value
 * @param {number} years - Number of years
 * @returns {number} CAGR as percentage
 */
export function calculateCAGR(startValue, endValue, years) {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

/**
 * Calculate trading statistics from transactions
 * @param {Array} transactions - Array of transactions with profit
 * @returns {object} Trading statistics
 */
export function calculateTradingStats(transactions) {
  const sells = transactions.filter(t => t.type === 'SÄLJ' && t.profit !== undefined);
  
  if (sells.length === 0) {
    return {
      totalTrades: 0,
      winners: 0,
      losers: 0,
      hitRate: 0,
      avgWin: 0,
      avgLoss: 0,
      winLossRatio: 0,
      avgHoldTime: 0,
      totalProfit: 0,
      largestWin: 0,
      largestLoss: 0
    };
  }
  
  const winners = sells.filter(t => t.profit > 0);
  const losers = sells.filter(t => t.profit <= 0);
  
  const avgWin = winners.length > 0
    ? winners.reduce((sum, t) => sum + t.profit, 0) / winners.length
    : 0;
  
  const avgLoss = losers.length > 0
    ? Math.abs(losers.reduce((sum, t) => sum + t.profit, 0)) / losers.length
    : 0;
  
  const avgHoldTime = sells.reduce((sum, t) => sum + (t.holdTime || 0), 0) / sells.length;
  
  const profits = sells.map(t => t.profit);
  
  return {
    totalTrades: sells.length,
    winners: winners.length,
    losers: losers.length,
    hitRate: (winners.length / sells.length) * 100,
    avgWin,
    avgLoss,
    winLossRatio: avgLoss > 0 ? avgWin / avgLoss : avgWin,
    avgHoldTime,
    totalProfit: sells.reduce((sum, t) => sum + t.profit, 0),
    largestWin: Math.max(...profits, 0),
    largestLoss: Math.min(...profits, 0)
  };
}

/**
 * Calculate correlation between two return series
 * @param {number[]} returns1 - First return series
 * @param {number[]} returns2 - Second return series
 * @returns {number} Correlation coefficient (-1 to 1)
 */
export function calculateCorrelation(returns1, returns2) {
  if (!returns1 || !returns2 || returns1.length < 2) return 0;
  
  const minLen = Math.min(returns1.length, returns2.length);
  const r1 = returns1.slice(-minLen);
  const r2 = returns2.slice(-minLen);
  
  const mean1 = r1.reduce((a, b) => a + b, 0) / r1.length;
  const mean2 = r2.reduce((a, b) => a + b, 0) / r2.length;
  
  let cov = 0, var1 = 0, var2 = 0;
  
  for (let i = 0; i < minLen; i++) {
    const diff1 = r1[i] - mean1;
    const diff2 = r2[i] - mean2;
    cov += diff1 * diff2;
    var1 += diff1 * diff1;
    var2 += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(var1 * var2);
  if (denominator === 0) return 0;
  
  return cov / denominator;
}

/**
 * Calculate Value at Risk (VaR) using historical method
 * @param {number[]} returns - Historical returns
 * @param {number} confidence - Confidence level (default 0.95)
 * @param {number} portfolioValue - Current portfolio value
 * @returns {number} VaR value
 */
export function calculateVaR(returns, confidence = 0.95, portfolioValue = 1) {
  if (!returns || returns.length < 10) return 0;
  
  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.floor(sorted.length * (1 - confidence));
  const percentile = sorted[index] || 0;
  
  return Math.abs(percentile * portfolioValue);
}












