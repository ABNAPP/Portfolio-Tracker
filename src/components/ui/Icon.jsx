import React, { memo } from 'react';
import * as LucideIcons from 'lucide-react';

/**
 * Optimized Icon component using lucide-react
 * Icons are memoized to prevent unnecessary re-renders
 * 
 * @param {string} name - Icon name in kebab-case or PascalCase
 * @param {number} size - Icon size in pixels
 * @param {string} className - Additional CSS classes
 * @param {string} strokeWidth - Stroke width
 */
const Icon = memo(({ name, size = 18, className = '', strokeWidth = 2, ...props }) => {
  // Convert kebab-case to PascalCase
  const pascalName = name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
  
  const IconComponent = LucideIcons[pascalName];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return null;
  }
  
  return (
    <IconComponent 
      size={size} 
      className={className} 
      strokeWidth={strokeWidth}
      {...props}
    />
  );
});

Icon.displayName = 'Icon';

export default Icon;

// Also export commonly used icons directly for tree-shaking benefits
export {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Settings,
  Calendar,
  PieChart,
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
  Minus,
  Trash2,
  Pencil,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Search,
  Banknote,
  Briefcase,
  Globe,
  Layers,
  Zap,
  History,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronLeft,
  ArrowUpRight,
  ArrowDownRight,
  Map,
  Crosshair,
  FileSpreadsheet
} from 'lucide-react';







