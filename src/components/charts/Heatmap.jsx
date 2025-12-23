import React, { useMemo, useRef, useState, useEffect, memo } from 'react';
import { formatCurrency, formatPercent } from '../../utils/formatters';

/**
 * Treemap/Heatmap visualization for portfolio holdings
 * Shows holdings sized by value and colored by performance
 */
const Heatmap = memo(({
  items,
  theme = 'dark',
  baseCurr = 'SEK',
  height = 320
}) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredItem, setHoveredItem] = useState(null);
  
  // Watch container size
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);
  
  // Calculate treemap layout
  const layout = useMemo(() => {
    if (!items || items.length === 0) return [];
    
    // Filter and sort by value
    const data = items
      .filter(i => !i.isWatchlist && i.marketValueBase > 0)
      .map(i => ({
        ...i,
        val: i.marketValueBase
      }))
      .sort((a, b) => b.val - a.val);
    
    if (data.length === 0) return [];
    
    // Squarified treemap algorithm
    const calculateRects = (data, x, y, w, h) => {
      if (data.length === 0) return [];
      if (data.length === 1) {
        return [{ ...data[0], x, y, w, h }];
      }
      
      const total = data.reduce((sum, item) => sum + item.val, 0);
      if (total === 0) return [];
      
      // Find split point
      let sum = 0;
      let splitIdx = 0;
      
      for (let i = 0; i < data.length; i++) {
        sum += data[i].val;
        if (sum >= total / 2) {
          splitIdx = i + 1;
          break;
        }
      }
      
      if (splitIdx >= data.length && data.length > 1) {
        splitIdx = data.length - 1;
      }
      
      const groupA = data.slice(0, splitIdx);
      const groupB = data.slice(splitIdx);
      
      const valueA = groupA.reduce((s, i) => s + i.val, 0);
      const pctA = valueA / total;
      
      // Determine split direction based on aspect ratio
      const ratio = dimensions.width > 0 && dimensions.height > 0 
        ? dimensions.width / dimensions.height 
        : 1.5;
      const isWide = (w * ratio) > h;
      
      let boundsA, boundsB;
      
      if (isWide) {
        const wA = w * pctA;
        boundsA = { x, y, w: wA, h };
        boundsB = { x: x + wA, y, w: w - wA, h };
      } else {
        const hA = h * pctA;
        boundsA = { x, y, w, h: hA };
        boundsB = { x, y: y + hA, w, h: h - hA };
      }
      
      return [
        ...calculateRects(groupA, boundsA.x, boundsA.y, boundsA.w, boundsA.h),
        ...calculateRects(groupB, boundsB.x, boundsB.y, boundsB.w, boundsB.h)
      ];
    };
    
    return calculateRects(data, 0, 0, 100, 100);
  }, [items, dimensions]);
  
  // Get color based on performance
  const getColor = (gainPercent) => {
    if (gainPercent >= 20) return 'bg-emerald-500';
    if (gainPercent >= 10) return 'bg-emerald-600';
    if (gainPercent >= 0) return 'bg-emerald-700';
    if (gainPercent >= -10) return 'bg-rose-600';
    if (gainPercent >= -20) return 'bg-rose-500';
    return 'bg-rose-700';
  };
  
  if (!items || items.length === 0 || layout.length === 0) {
    return (
      <div 
        className={`w-full rounded-xl flex items-center justify-center ${
          theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
        }`}
        style={{ height }}
      >
        <span className="opacity-50">Inga innehav att visa</span>
      </div>
    );
  }
  
  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className={`w-full relative rounded-xl overflow-hidden shadow-inner ${
          theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
        }`}
        style={{ height }}
      >
        {layout.map(item => (
          <div
            key={item.symbol}
            className={`absolute border ${
              theme === 'dark' ? 'border-slate-900' : 'border-white'
            } ${getColor(item.gainPercent)} flex flex-col justify-center items-center text-white transition-all cursor-pointer overflow-hidden`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: `${item.w}%`,
              height: `${item.h}%`,
              filter: hoveredItem === item.symbol ? 'brightness(1.2)' : 'none',
              zIndex: hoveredItem === item.symbol ? 10 : 1
            }}
            onMouseEnter={() => setHoveredItem(item.symbol)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {item.w > 8 && item.h > 8 && (
              <span className="font-bold text-[10px] truncate px-1 w-full text-center drop-shadow-md">
                {item.symbol}
              </span>
            )}
            {item.w > 12 && item.h > 12 && (
              <span className="text-[9px] opacity-90 drop-shadow-md">
                {formatPercent(item.gainPercent, 1, true)}
              </span>
            )}
            {item.w > 15 && item.h > 18 && (
              <span className="text-[8px] opacity-75 mt-0.5">
                {formatCurrency(item.val, baseCurr, 'sv-SE').split(',')[0]}
              </span>
            )}
          </div>
        ))}
      </div>
      
      {/* Tooltip for hovered item */}
      {hoveredItem && (
        <div 
          className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 rounded-lg shadow-xl border z-50 ${
            theme === 'dark' 
              ? 'bg-slate-800 border-slate-700' 
              : 'bg-white border-slate-200'
          }`}
        >
          {(() => {
            const item = layout.find(i => i.symbol === hoveredItem);
            if (!item) return null;
            
            return (
              <>
                <p className="font-bold text-sm">{item.symbol}</p>
                <p className="text-xs opacity-70">{item.name}</p>
                <div className="flex gap-4 mt-2">
                  <div>
                    <span className="text-xs opacity-50">Värde</span>
                    <p className="font-bold text-sm">{formatCurrency(item.val, baseCurr)}</p>
                  </div>
                  <div>
                    <span className="text-xs opacity-50">Utv.</span>
                    <p className={`font-bold text-sm ${item.gainPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {formatPercent(item.gainPercent, 2, true)}
                    </p>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
      
      {/* Legend */}
      <div className="flex justify-center gap-4 mt-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-emerald-500 rounded" />
          <span className="opacity-70">+20%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-emerald-700 rounded" />
          <span className="opacity-70">0%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-rose-500 rounded" />
          <span className="opacity-70">-20%</span>
        </div>
      </div>
    </div>
  );
});

Heatmap.displayName = 'Heatmap';

export default Heatmap;












