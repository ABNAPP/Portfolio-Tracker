import * as XLSX from 'xlsx';
import { formatCurrency, formatPercent, formatDateShort } from './formatters';

/**
 * Export portfolio data to Excel file
 * @param {object} data - Portfolio data
 * @param {object} stats - Calculated statistics
 * @param {object} transactions - Transaction history
 * @param {string} baseCurr - Base currency
 * @param {string} lang - Language
 */
export function exportToExcel(data, stats, transactions, baseCurr, lang) {
  const workbook = XLSX.utils.book_new();
  
  // Holdings Sheet
  const holdingsData = stats.enriched.map(h => ({
    'Symbol': h.symbol,
    'Namn': h.name || '',
    'Antal': h.shares,
    'GAV': h.purchasePrice,
    'Kurs': h.currentPrice,
    'Valuta': h.currency,
    'Värde (Bas)': h.marketValueBase,
    'Kostnad (Bas)': h.realCostBase || h.shares * h.purchasePrice,
    'Vinst/Förlust': h.marketValueBase - (h.realCostBase || h.shares * h.purchasePrice),
    'Utveckling %': h.gainPercent,
    'Portföljvikt %': h.mWeight,
    'Industri': h.industry,
    'Land': h.country,
    'Mäklare': h.broker || 'Övrigt',
    'Beta': h.beta || 1,
    'Utdelning': h.dividend || 0
  }));
  
  const holdingsSheet = XLSX.utils.json_to_sheet(holdingsData);
  XLSX.utils.book_append_sheet(workbook, holdingsSheet, 'Innehav');
  
  // Summary Sheet
  const summaryData = [
    { 'Nyckeltal': 'Nettoförmögenhet', 'Värde': stats.netWorth, 'Valuta': baseCurr },
    { 'Nyckeltal': 'Total Utdelning/år', 'Värde': stats.divTotal, 'Valuta': baseCurr },
    { 'Nyckeltal': 'Direktavkastning', 'Värde': `${stats.yieldPct.toFixed(2)}%`, 'Valuta': '' },
    { 'Nyckeltal': 'Belåningsgrad', 'Värde': `${stats.loanPct.toFixed(2)}%`, 'Valuta': '' },
    { 'Nyckeltal': 'Sharpe Ratio', 'Värde': stats.sharpe.toFixed(2), 'Valuta': '' },
    { 'Nyckeltal': 'Portfolio Beta', 'Värde': stats.portfolioBeta.toFixed(2), 'Valuta': '' },
    { 'Nyckeltal': 'Volatilitet (30d)', 'Värde': `${stats.vol30.toFixed(1)}%`, 'Valuta': '' },
    { 'Nyckeltal': 'Max Drawdown', 'Värde': `${stats.maxDrawdown.toFixed(1)}%`, 'Valuta': '' },
    { 'Nyckeltal': 'Total Avkastning', 'Värde': stats.totalGain, 'Valuta': baseCurr },
    { 'Nyckeltal': 'Hit Rate', 'Värde': `${stats.hitRate.toFixed(1)}%`, 'Valuta': '' }
  ];
  
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Sammanfattning');
  
  // Transactions Sheet
  if (transactions && transactions.length > 0) {
    const transData = transactions.map(t => ({
      'Datum': formatDateShort(t.date),
      'Typ': t.type,
      'Symbol': t.symbol,
      'Antal': t.shares,
      'Pris': t.price,
      'Courtage': t.commission || 0,
      'Mäklare': t.broker || '',
      'Resultat': t.profit || ''
    }));
    
    const transSheet = XLSX.utils.json_to_sheet(transData);
    XLSX.utils.book_append_sheet(workbook, transSheet, 'Transaktioner');
  }
  
  // Cash & Loans Sheet
  const accountsData = [
    ...data.cashAccounts.map(a => ({
      'Typ': 'Likviditet',
      'Konto': a.name || 'Kassa',
      'Belopp': a.value,
      'Valuta': a.currency
    })),
    ...data.loanAccounts.map(a => ({
      'Typ': 'Lån',
      'Konto': a.name || 'Lån',
      'Belopp': a.value,
      'Valuta': a.currency
    }))
  ];
  
  const accountsSheet = XLSX.utils.json_to_sheet(accountsData);
  XLSX.utils.book_append_sheet(workbook, accountsSheet, 'Konton');
  
  // Allocation Sheet
  const allocationData = [
    { 'Kategori': 'INDUSTRI', 'Namn': '', 'Andel %': '' },
    ...stats.secData.map(s => ({
      'Kategori': '',
      'Namn': s.name,
      'Andel %': ((s.value / stats.netWorth) * 100).toFixed(2)
    })),
    { 'Kategori': '', 'Namn': '', 'Andel %': '' },
    { 'Kategori': 'GEOGRAFI', 'Namn': '', 'Andel %': '' },
    ...stats.regData.map(s => ({
      'Kategori': '',
      'Namn': s.name,
      'Andel %': ((s.value / stats.netWorth) * 100).toFixed(2)
    }))
  ];
  
  const allocationSheet = XLSX.utils.json_to_sheet(allocationData);
  XLSX.utils.book_append_sheet(workbook, allocationSheet, 'Allokering');
  
  // Set column widths
  const setColumnWidths = (sheet) => {
    const cols = [];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      cols.push({ wch: 15 });
    }
    sheet['!cols'] = cols;
  };
  
  workbook.SheetNames.forEach(name => {
    setColumnWidths(workbook.Sheets[name]);
  });
  
  // Generate and download file
  const filename = `portfolio_export_${formatDateShort(new Date())}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Export data as JSON backup
 * @param {object} backupData - All data to backup
 */
export function exportBackupJSON(backupData) {
  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `portfolio_backup_${formatDateShort(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import data from JSON backup file
 * @param {File} file - File to import
 * @returns {Promise<object>} Parsed data
 */
export function importBackupJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        resolve(data);
      } catch (e) {
        reject(new Error('Invalid JSON format'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsText(file);
  });
}

/**
 * Parse CSV file for history import
 * @param {File} file - CSV file
 * @returns {Promise<Array<{date: string, value: number}>>} Parsed data points
 */
export function parseHistoryCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const lines = event.target.result.split('\n');
        const points = [];
        
        for (const line of lines) {
          const cols = line.split(/[,;]/);
          if (cols.length >= 2) {
            const date = cols[0].trim();
            let valueStr = cols[1].trim().replace(/\s/g, '').replace(',', '.');
            const value = Number(valueStr);
            
            if (!isNaN(value) && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
              points.push({ date, value });
            }
          }
        }
        
        if (points.length === 0) {
          reject(new Error('No valid data found in CSV'));
        } else {
          resolve(points);
        }
      } catch (e) {
        reject(new Error('Could not parse CSV'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsText(file);
  });
}

/**
 * Export chart data as CSV
 * @param {Array<{date: string, value: number}>} chartData - Chart data
 * @param {string} filename - Filename
 */
export function exportChartCSV(chartData, filename = 'portfolio_history.csv') {
  const csv = 'Datum,Värde\n' + chartData.map(d => `${d.date},${d.value}`).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}












