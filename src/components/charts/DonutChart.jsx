import React, { useMemo, memo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { CHART_COLORS } from '../../utils/constants';

/**
 * Donut/Pie chart for allocation visualization
 */
const DonutChart = memo(({
  data,
  theme = 'dark',
  centerValue,
  centerLabel = '',
  baseCurr = 'SEK',
  masked = false,
  height = 300,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 90
}) => {
  const [activeIndex, setActiveIndex] = useState(null);
  
  // Process data and calculate percentages
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
    
    return data
      .filter(item => item.value > 0)
      .map((item, index) => ({
        ...item,
        percentage: total > 0 ? (item.value / total) * 100 : 0,
        fill: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);
  
  const total = useMemo(() => 
    chartData.reduce((sum, item) => sum + item.value, 0), 
    [chartData]
  );
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    
    const item = payload[0].payload;
    
    return (
      <div 
        className={`p-3 rounded-lg shadow-xl border ${
          theme === 'dark' 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}
      >
        <p className="font-bold text-sm mb-1">{item.name}</p>
        <p className="text-sm">
          <span className="opacity-70">Värde: </span>
          <span className="font-medium">
            {masked ? '***' : formatCurrency(item.value, baseCurr)}
          </span>
        </p>
        <p className="text-sm">
          <span className="opacity-70">Andel: </span>
          <span className="font-medium">{formatPercent(item.percentage, 1)}</span>
        </p>
      </div>
    );
  };
  
  // Custom label for center of donut
  const CenterLabel = () => {
    if (!centerValue && !centerLabel) return null;
    
    return (
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        <tspan
          x="50%"
          dy="-8"
          className={`text-xs ${theme === 'dark' ? 'fill-slate-400' : 'fill-slate-500'}`}
        >
          {centerLabel}
        </tspan>
        <tspan
          x="50%"
          dy="22"
          className={`text-sm font-bold ${theme === 'dark' ? 'fill-white' : 'fill-slate-900'}`}
        >
          {masked ? '***' : formatCurrency(centerValue || total, baseCurr, 'sv-SE')}
        </tspan>
      </text>
    );
  };
  
  // Custom legend
  const CustomLegend = ({ payload }) => {
    if (!showLegend) return null;
    
    return (
      <div className="grid grid-cols-2 gap-2 mt-4">
        {payload.map((entry, index) => (
          <div 
            key={`legend-${index}`}
            className={`flex justify-between items-center p-2 rounded border transition-all cursor-pointer ${
              theme === 'dark' 
                ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-700/50' 
                : 'border-slate-200 bg-white hover:bg-slate-50'
            } ${activeIndex === index ? 'ring-2 ring-blue-500' : ''}`}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs truncate" title={entry.value}>
                {entry.value.split('/')[0]}
              </span>
            </div>
            <span className="text-xs font-bold ml-2">
              {formatPercent(chartData[index]?.percentage || 0, 0)}
            </span>
          </div>
        ))}
      </div>
    );
  };
  
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] opacity-50">
        Ingen data
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill}
                stroke={theme === 'dark' ? '#1e293b' : '#ffffff'}
                strokeWidth={2}
                style={{
                  filter: activeIndex === index ? 'brightness(1.2)' : 'none',
                  transform: activeIndex === index ? 'scale(1.02)' : 'scale(1)',
                  transformOrigin: 'center',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {/* Center text */}
          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            dominantBaseline="middle"
            className={`text-xs ${theme === 'dark' ? 'fill-slate-400' : 'fill-slate-500'}`}
          >
            {centerLabel}
          </text>
          <text
            x="50%"
            y="55%"
            textAnchor="middle"
            dominantBaseline="middle"
            className={`text-sm font-bold ${theme === 'dark' ? 'fill-white' : 'fill-slate-900'}`}
          >
            {masked ? '***' : formatCurrency(centerValue || total, baseCurr, 'sv-SE')}
          </text>
        </PieChart>
      </ResponsiveContainer>
      
      <CustomLegend payload={chartData.map(d => ({ value: d.name, color: d.fill }))} />
    </div>
  );
});

DonutChart.displayName = 'DonutChart';

export default DonutChart;












