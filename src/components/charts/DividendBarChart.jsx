import React, { memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

/**
 * Bar chart for monthly dividend visualization
 */
const DividendBarChart = memo(({
  data,
  theme = 'dark',
  baseCurr = 'SEK',
  height = 250,
  showValues = true
}) => {
  // Theme colors
  const colors = {
    bar: '#10b981',
    barHover: '#059669',
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
    
    return (
      <div 
        className="p-3 rounded-lg shadow-xl border"
        style={{ 
          backgroundColor: colors.tooltip.bg,
          borderColor: colors.tooltip.border
        }}
      >
        <p className="text-sm font-bold mb-1">{label}</p>
        <p className="text-sm text-emerald-500 font-medium">
          {formatCurrency(payload[0].value, baseCurr)}
        </p>
      </div>
    );
  };
  
  // Custom bar label
  const CustomLabel = ({ x, y, width, value }) => {
    if (!showValues || value <= 0) return null;
    
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        textAnchor="middle"
        className={`text-xs font-bold ${theme === 'dark' ? 'fill-slate-300' : 'fill-slate-700'}`}
      >
        {Math.round(value)}
      </text>
    );
  };
  
  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <div className="flex items-center justify-center h-[200px] opacity-50">
        Ingen utdelningsdata
      </div>
    );
  }
  
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        
        <XAxis 
          dataKey="label" 
          stroke={colors.text}
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        
        <YAxis 
          stroke={colors.text}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
          width={40}
        />
        
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
        
        <Bar 
          dataKey="value" 
          radius={[4, 4, 0, 0]}
          label={<CustomLabel />}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.value > 0 ? colors.bar : 'transparent'}
              style={{
                transition: 'all 0.2s ease',
                cursor: entry.value > 0 ? 'pointer' : 'default'
              }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

DividendBarChart.displayName = 'DividendBarChart';

export default DividendBarChart;












