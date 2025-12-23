import React, { useMemo, memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Legend,
  ReferenceLine
} from 'recharts';
import { formatCurrency, formatDateShort, formatPercent } from '../../utils/formatters';

/**
 * Performance chart with portfolio value and optional benchmark comparison
 */
const PerformanceChart = memo(({
  data,
  benchmarkData = null,
  showBenchmark = false,
  theme = 'dark',
  baseCurr = 'SEK',
  height = 350,
  showArea = true,
  normalized = false // If true, show % change from start
}) => {
  // Process and normalize data
  const chartData = useMemo(() => {
    if (!data || data.length < 2) return [];
    
    const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    const startValue = sorted[0].value;
    
    // Create benchmark map by date for proper alignment
    let benchmarkMap = null;
    let benchStartValue = null;
    
    if (showBenchmark && benchmarkData && benchmarkData.length > 0) {
      // Sort benchmark data by date
      const sortedBench = [...benchmarkData].sort((a, b) => new Date(a.date) - new Date(b.date));
      benchStartValue = sortedBench[0]?.value || 1;
      
      // Create map: date string -> value
      benchmarkMap = new Map();
      sortedBench.forEach(d => {
        const dateKey = d.date.split('T')[0];
        benchmarkMap.set(dateKey, d.value);
      });
    }
    
    return sorted.map((d) => {
      const dateKey = d.date.split('T')[0];
      const point = {
        date: d.date,
        dateFormatted: formatDateShort(d.date),
        value: d.value,
        normalizedValue: normalized || showBenchmark 
          ? ((d.value / startValue) - 1) * 100 
          : d.value
      };
      
      // Add benchmark if available - match by date, not index
      if (showBenchmark && benchmarkMap && benchStartValue) {
        const benchValue = benchmarkMap.get(dateKey);
        if (benchValue !== undefined) {
          point.benchmark = ((benchValue / benchStartValue) - 1) * 100;
          point.benchmarkRaw = benchValue;
        } else {
          // If no exact match, use last known value (forward fill)
          // This will be handled by finding the closest previous value
          point.benchmark = null;
        }
      }
      
      return point;
    }).map((point, index, array) => {
      // Forward fill benchmark values for missing dates
      if (showBenchmark && point.benchmark === null && index > 0) {
        // Find last known benchmark value
        for (let i = index - 1; i >= 0; i--) {
          if (array[i].benchmark !== null && array[i].benchmark !== undefined) {
            point.benchmark = array[i].benchmark;
            break;
          }
        }
      }
      return point;
    });
  }, [data, benchmarkData, showBenchmark, normalized]);
  
  // Calculate Y-axis domain
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    
    const key = normalized || showBenchmark ? 'normalizedValue' : 'value';
    const values = chartData.map(d => d[key]);
    
    if (showBenchmark) {
      chartData.forEach(d => {
        if (d.benchmark !== undefined) values.push(d.benchmark);
      });
    }
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1;
    
    return [min - padding, max + padding];
  }, [chartData, showBenchmark, normalized]);
  
  // Theme colors
  const colors = {
    line: '#3b82f6',
    benchmark: '#94a3b8',
    area: 'url(#areaGradient)',
    grid: theme === 'dark' ? '#334155' : '#e2e8f0',
    text: theme === 'dark' ? '#94a3b8' : '#64748b',
    tooltip: {
      bg: theme === 'dark' ? '#1e293b' : '#ffffff',
      border: theme === 'dark' ? '#334155' : '#e2e8f0'
    }
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    
    const portfolioData = payload.find(p => p.dataKey === 'normalizedValue' || p.dataKey === 'value');
    const benchmarkDataPoint = payload.find(p => p.dataKey === 'benchmark');
    
    return (
      <div 
        className="p-3 rounded-lg shadow-xl border"
        style={{ 
          backgroundColor: colors.tooltip.bg,
          borderColor: colors.tooltip.border
        }}
      >
        <p className="text-xs font-medium opacity-70 mb-2">{label}</p>
        
        {portfolioData && (
          <div className="flex justify-between items-center gap-4">
            <span className="text-sm font-medium">Portfölj</span>
            <span className={`font-bold ${portfolioData.value >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {normalized || showBenchmark 
                ? formatPercent(portfolioData.value, 2, true)
                : formatCurrency(portfolioData.value, baseCurr)
              }
            </span>
          </div>
        )}
        
        {benchmarkDataPoint && (
          <div className="flex justify-between items-center gap-4 mt-1">
            <span className="text-sm font-medium opacity-70">Index</span>
            <span className={`font-bold ${benchmarkDataPoint.value >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatPercent(benchmarkDataPoint.value, 2, true)}
            </span>
          </div>
        )}
      </div>
    );
  };
  
  if (chartData.length < 2) {
    return (
      <div className="flex items-center justify-center h-[300px] opacity-50">
        Ingen data för grafen
      </div>
    );
  }
  
  const dataKey = normalized || showBenchmark ? 'normalizedValue' : 'value';
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        
        <XAxis 
          dataKey="dateFormatted" 
          stroke={colors.text}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        
        <YAxis 
          stroke={colors.text}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          domain={yDomain}
          tickFormatter={(val) => 
            normalized || showBenchmark 
              ? `${val.toFixed(0)}%` 
              : val >= 1000000 
                ? `${(val / 1000000).toFixed(1)}M`
                : val >= 1000 
                  ? `${(val / 1000).toFixed(0)}k`
                  : val.toFixed(0)
          }
          width={50}
        />
        
        <Tooltip content={<CustomTooltip />} />
        
        {(normalized || showBenchmark) && (
          <ReferenceLine y={0} stroke={colors.text} strokeDasharray="3 3" />
        )}
        
        {showArea && !showBenchmark && (
          <Area
            type="monotone"
            dataKey={dataKey}
            fill={colors.area}
            stroke="none"
          />
        )}
        
        {showBenchmark && (
          <Line
            type="monotone"
            dataKey="benchmark"
            stroke={colors.benchmark}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Index"
            connectNulls={false}
          />
        )}
        
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={colors.line}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 6, fill: colors.line }}
          name="Portfölj"
        />
        
        {showBenchmark && (
          <Legend 
            wrapperStyle={{ paddingTop: 20 }}
            iconType="line"
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
});

PerformanceChart.displayName = 'PerformanceChart';

export default PerformanceChart;




