// Currencies supported
export const CURRENCIES = ['SEK', 'USD', 'EUR', 'DKK', 'NOK', 'GBP', 'AUD', 'CAD', 'CHF', 'JPY', 'CNY'];

// Industries list
export const INDUSTRIES = [
  'Agricultural Inputs', 'Airlines', 'Aluminum', 'Apparel Retail', 'Auto Parts',
  'Biotechnology', 'Building Products & Equipment', 'Capital Markets', 'Chemicals',
  'Coking Coal', 'Communication Equipment', 'Computer Hardware', 'Conglomerates',
  'Copper', 'Discount Stores', 'Drug Manufacturers - General',
  'Drug Manufacturers - Specialty & Generic', 'Electrical Equipment & Parts',
  'Electronic Components', 'Electronic Gaming & Multimedia', 'Engineering & Construction',
  'Farm & Heavy Construction Machinery', 'Farm Products', 'Footwear & Accessories',
  'Gambling', 'Healthcare Plans', 'Industrial Distribution',
  'Information Technology Services', 'Internet Content & Information', 'Internet Retail',
  'Leisure', 'Luxury Goods', 'Marine Shipping', 'Medical Care Facilities',
  'Medical Instruments & Supplies', 'Oil & Gas Exploration & Production',
  'Oil & Gas Integrated', 'Oil & Gas Midstream', 'Oil & Gas Refining & Marketing',
  'Other Industrial Metals & Mining', 'Other Precious Metals & Mining', 'Packaged Foods',
  'Packaging & Containers', 'Pollution & Treatment Controls', 'Railroads',
  'Real Estate Services', 'Recreational Vehicles', 'REIT - Industrial', 'REIT - Specialty',
  'Residential Construction', 'Scientific & Technical Instruments',
  'Security & Protection Services', 'Semiconductors', 'Software', 'Solar',
  'Specialty Business Services', 'Specialty Chemicals', 'Specialty Industrial Machinery',
  'Steel', 'Telecom Services', 'Thermal Coal', 'Utilities - Regulated Electric',
  'Utilities - Regulated Water', 'Utilities - Renewable', 'Waste Management', 'Krypto', 'Övrigt'
].sort();

// Countries list
export const ALL_COUNTRIES = [
  'Sverige', 'USA', 'Tyskland', 'Danmark', 'Norge', 'Finland', 'Storbritannien',
  'Kanada', 'Kina', 'Japan', 'Frankrike', 'Schweiz', 'Australien', 'Nederländerna',
  'Spanien', 'Italien', 'Belgien', 'Brasilien', 'Indien', 'Sydkorea', 'Taiwan',
  'Hongkong', 'Sydafrika', 'Ryssland', 'Polen', 'Österrike', 'Irland', 'Portugal',
  'Global', 'Övrigt'
].sort();

// Country to ISO code mapping for flags
export const COUNTRY_ISO = {
  'Sverige': 'se', 'USA': 'us', 'Tyskland': 'de', 'Danmark': 'dk', 'Norge': 'no',
  'Finland': 'fi', 'Storbritannien': 'gb', 'Kanada': 'ca', 'Kina': 'cn', 'Japan': 'jp',
  'Frankrike': 'fr', 'Schweiz': 'ch', 'Australien': 'au', 'Nederländerna': 'nl',
  'Spanien': 'es', 'Italien': 'it', 'Belgien': 'be', 'Brasilien': 'br', 'Indien': 'in',
  'Sydkorea': 'kr', 'Taiwan': 'tw', 'Hongkong': 'hk', 'Sydafrika': 'za', 'Ryssland': 'ru',
  'Polen': 'pl', 'Österrike': 'at', 'Irland': 'ie', 'Portugal': 'pt'
};

// Brokers list
export const BROKERS = [
  'Avanza', 'Nordnet', 'eToro', 'Interactive Brokers', 'Degiro',
  'Swedbank', 'SEB', 'Handelsbanken', 'Revolut', 'Coinbase', 'Binance', 'Annan'
];

// Market indices with their symbols for API fetching
export const MARKET_INDICES = [
  { name: 'OMXS30', symbol: '^OMXS30', currency: 'SEK', country: 'Sverige' },
  { name: 'S&P 500', symbol: '^GSPC', currency: 'USD', country: 'USA' },
  { name: 'Nasdaq 100', symbol: '^NDX', currency: 'USD', country: 'USA' },
  { name: 'Dow Jones', symbol: '^DJI', currency: 'USD', country: 'USA' },
  { name: 'DAX', symbol: '^GDAXI', currency: 'EUR', country: 'Tyskland' },
  { name: 'FTSE 100', symbol: '^FTSE', currency: 'GBP', country: 'Storbritannien' },
  { name: 'Nikkei 225', symbol: '^N225', currency: 'JPY', country: 'Japan' },
  { name: 'Euro Stoxx 50', symbol: '^STOXX50E', currency: 'EUR', country: 'Europa' },
  { name: 'Hang Seng', symbol: '^HSI', currency: 'HKD', country: 'Hongkong' },
  { name: 'MSCI World', symbol: 'URTH', currency: 'USD', country: 'Global' }
];

// Default FX rates (fallback if API fails)
export const DEFAULT_FX_RATES = {
  SEK: 1,
  USD: 10.85,
  EUR: 11.50,
  DKK: 1.54,
  NOK: 0.98,
  GBP: 13.65,
  AUD: 7.05,
  CAD: 8.00,
  CHF: 12.20,
  JPY: 0.07,
  CNY: 1.50,
  HKD: 1.39
};

// Chart colors palette
export const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#84cc16', // lime
  '#f97316', // orange
  '#14b8a6', // teal
  '#a855f7', // purple
];

// Time range options
export const TIME_RANGES = ['1W', '1M', '3M', '6M', 'YTD', '1Y', '3Y', 'ALL'];

// Crypto symbols for detection
export const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOT', 'DOGE', 'USDT', 'USDC', 'BNB', 'AVAX', 'MATIC'];

// Default empty state
export const DEFAULT_DATA = {
  cashAccounts: [{ id: 1, name: 'Kassa', value: 0, currency: 'SEK' }],
  loanAccounts: [{ id: 2, name: 'Lån', value: 0, currency: 'SEK' }],
  holdings: []
};

export const DEFAULT_FIRE_DATA = {
  monthlyExpenses: 20000
};












