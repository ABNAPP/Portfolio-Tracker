export const TRANSLATIONS = {
  sv: {
    // Navigation
    nav_overview: 'Översikt',
    nav_analysis: 'Analys',
    nav_perf: 'Utveckling',
    nav_calendar: 'Utdelningar',
    nav_settings: 'Inställningar',
    nav_brokers: 'Mäklare',
    
    // Dashboard
    net_worth: 'Nettoförmögenhet',
    dividend_yield: 'Utdelning / år',
    yield_label: 'Direktavkastning',
    cash: 'Kassa',
    loan: 'Lån',
    holdings_header: 'Innehav',
    
    // Table headers
    gav_header: 'GAV',
    price_header: 'Kurs',
    value_header: 'Värde',
    dev_header: 'Utv %',
    date_header: 'Uppdaterad',
    qty_header: 'Antal',
    m_weight_header: 'M-vikt %',
    i_weight_header: 'I-vikt %',
    
    // Form
    form_title_add: 'Registrera Affär',
    form_title_edit: 'Redigera Innehav',
    lbl_symbol: 'Kortnamn',
    lbl_shares: 'Antal',
    lbl_purchase_price: 'Inköpspris (GAV)',
    lbl_current_price: 'Dagspris (Nuvarande)',
    lbl_currency: 'Handelsvaluta',
    lbl_industry: 'Industri',
    lbl_dividend: 'Utdelning',
    lbl_country: 'Land',
    lbl_commission: 'Courtage',
    lbl_comm_curr: 'Valuta',
    lbl_next_div: 'Nästa Utdelning (Datum)',
    lbl_broker: 'Mäklare',
    lbl_total_cost: 'Totalt Belopp (Betalat)',
    lbl_beta: 'Beta',
    btn_add: 'Köp / Lägg till',
    btn_save: 'Spara',
    btn_sell: 'Sälj',
    btn_cancel: 'Avbryt',
    
    // Charts
    chart_industry_title: 'Industrifördelning',
    chart_region_title: 'Geografisk Spridning',
    chart_holding_title: 'Innehavsfördelning',
    kpi_largest: 'Största Innehav',
    heatmap_title: 'Marknadskarta',
    
    // Data management
    backup_title: 'Datahantering',
    btn_export: 'Exportera Data',
    btn_import: 'Importera Data',
    btn_export_excel: 'Exportera till Excel',
    
    // Modals
    modal_price_title: 'Uppdatera Dagspris',
    modal_sell_title: 'Registrera Försäljning',
    
    // Performance
    sim_title: 'Portföljutveckling',
    total_value: 'Totalt Värde',
    loan_pct: 'Belåningsgrad',
    total_comm: 'Totalt Courtage',
    sharpe_ratio: 'Sharpekvot',
    sharpe_info: 'Riskjusterad avkastning',
    sortino_ratio: 'Sortino Ratio',
    sortino_info: 'Nedsidesrisk',
    
    // API
    api_settings: 'API Inställningar',
    btn_update_all: 'Hämta Live Kurser',
    
    // Search
    search_ph: 'Sök aktie (Volvo) eller krypto (BTC)...',
    search_loading: 'Söker...',
    fetching_price: 'Hämtar pris...',
    
    // Calendar
    cal_title: 'Utdelningskalender',
    cal_empty: 'Inga kommande utdelningar.',
    
    // Settings
    settings_base_curr: 'Basvaluta (Visning)',
    api_prio_eodhd: 'EODHD API Token (Prio 1)',
    api_prio_ms: 'Marketstack API Key (Prio 2)',
    api_prio_1: 'Finnhub API (Prio 3)',
    api_prio_2: 'Alpha Vantage API (Prio 4)',
    api_prio_3: 'Extra API',
    
    // Time ranges
    time_1w: '1V',
    time_1m: '1M',
    time_3m: '3M',
    time_6m: '6M',
    time_ytd: 'iÅr',
    time_1y: '1År',
    time_3y: '3År',
    time_all: 'Allt',
    
    // Sell modal
    sell_dest_label: 'Hantera likvid:',
    sell_dest_cash: 'Lägg till i Kassa',
    sell_dest_loan: 'Minska Lånet',
    sell_broker_label: 'Från mäklare',
    
    // Benchmark
    btn_benchmark: 'Jämför Index',
    select_benchmark: 'Välj jämförelseindex',
    
    // Risk
    risk_analysis: 'Riskanalys',
    risk_diversification: 'Diversifiering',
    risk_high_conc: 'Hög koncentration',
    
    // Privacy
    privacy_mode: 'Sekretessläge',
    
    // Backup
    backup_section: 'Fullständig Backup',
    backup_desc: 'Spara ner HELA din data (inkl inställningar & historik) lokalt.',
    btn_backup_save: 'Spara fullständig backup',
    btn_backup_load: 'Återställ allt från fil',
    
    // Statistics
    volatility: 'Volatilitet',
    vol_info: 'Std avvikelse (Ann.)',
    max_drawdown: 'Max Drawdown',
    dd_info: 'Största nedgång',
    max_gain: 'Avkastning',
    gain_info: 'Totalt',
    beta_info: 'Volatilitet mot index',
    portfolio_beta: 'Portföljbeta',
    beta_analysis: 'Beta-analys',
    vol_30: '30 dagar',
    vol_90: '90 dagar',
    vol_252: '1 år',
    
    // Trading stats
    stats_hit_rate: 'Hit Rate',
    stats_win_loss: 'Win/Loss Ratio',
    stats_avg_win: 'Snittvinst',
    stats_avg_loss: 'Snittförlust',
    stats_hold_time: 'Innehavstid',
    stats_avg_days: 'dagar',
    stats_winners: 'Vinnare',
    stats_losers: 'Förlorare',
    stats_trading_title: 'Tradinganalys',
    
    // History
    settings_history: 'Historikhantering',
    settings_history_desc: 'Skapa profiler och importera historik manuellt för att bygga en komplett graf.',
    btn_add_profile: 'Lägg till Profil',
    btn_import_csv: 'Importera CSV',
    lbl_profile_name: 'Profilnamn',
    history_date: 'Datum',
    history_value: 'Värde',
    btn_add_row: 'Lägg till rad',
    chart_source_total: 'Total Portfölj (Alla källor)',
    chart_source_live: 'Endast Live-innehav',
    csv_info: 'Format: Datum, Värde (T.ex: 2023-01-01, 150000)',
    msg_csv_error: 'Kunde inte läsa filen. Kontrollera formatet.',
    msg_profile_added: 'Profil skapad.',
    lbl_select_chart: 'Välj datakälla för graf:',
    
    // Stress tests
    stress_title: 'Stress- & Scenariotester',
    stress_market_title: 'Marknadsscenario',
    stress_fx_title: 'Valutascenario',
    stress_index_label: 'Om',
    stress_change_label: 'ändras med',
    stress_fx_vs: 'mot',
    stress_impact: 'Påverkan',
    stress_new_value: 'Nytt Värde',
    stress_strengthens: 'stärks',
    stress_weakens: 'försvagas',
    stress_market_desc: 'Simulerar portföljens värde baserat på Beta.',
    stress_fx_desc: 'Simulerar valutaförändringar på utländska innehav.',
    
    // Accounts
    settings_deposit: 'Likviditet',
    settings_loan: 'Lån (Skuld)',
    select_holding_edit: 'Välj innehav att redigera',
    select_holding_delete: 'Välj innehav att radera',
    btn_delete_all: 'Radera HELA innehavet',
    delete_confirm_all: 'Är du säker på att du vill radera ALLA poster för detta innehav?',
    msg_restore_ok: 'Återställning klar!',
    msg_restore_err: 'Fel filformat',
    msg_csv_ok: 'rader importerade',
    btn_add_account: 'Lägg till konto',
    lbl_account_name: 'Konto/Mäklare',
    all_brokers: 'Alla mäklare',
    broker_label: 'Mäklare:',
    index_label: 'Index:',
    holdings_label: 'Innehav',
    holdings_total: 'Innehav totalt',
    liquidity_label: 'Likviditet',
    loan_label: 'Lån',
    total_label: 'Total',
    no_liquidity_accounts: 'Inga likvida konton.',
    no_loans: 'Inga lån.',
    no_holdings: 'Inga innehav att visa',
    estimated_tax_title: 'Skatteberäkning (ISK/KF)',
    tax_base_label: 'Skatteunderlag (Est.)',
    slr_label: 'Statslåneränta (SLR)',
    estimated_tax_label: 'Estimerad Skatt / År',
    tax_desc: 'Baserat på värde * (SLR + 1%) * 30%.',
    market_scenario: 'Marknadsscenario',
    currency_scenario: 'Valutascenario',
    impact_label: 'Påverkan',
    new_value_label: 'Nytt Värde',
    new_value_total: 'Nytt Värde (Tot)',
    estimated_monthly_dividend: 'Estimerad Utdelning per Månad',
    est_label: 'Est.',
    holdings_in: 'Innehav i',
    trades_label: 'affärer',
    holding_updated: 'Innehav uppdaterat',
    holding_added: 'Innehav tillagt',
    holding_deleted: 'Innehav raderat',
    all_holdings_deleted: 'Alla innehav raderade',
    error_title: 'Något gick fel',
    error_message: 'Ett oväntat fel uppstod. Försök att ladda om sidan eller återställ appen.',
    error_technical: 'Teknisk information',
    error_try_again: 'Försök igen',
    error_reload: 'Ladda om sidan',
    
    // New V2 features
    correlation_matrix: 'Korrelationsmatris',
    var_analysis: 'Value at Risk (VaR)',
    cagr: 'CAGR',
    export_csv: 'Exportera CSV',
    theme_toggle: 'Växla tema',
    no_data: 'Ingen data',
    loading: 'Laddar...',
    error: 'Ett fel uppstod',
    success: 'Lyckades',
    confirm_delete: 'Är du säker?',
    holdings_in: 'Innehav i'
  },
  
  en: {
    // Navigation
    nav_overview: 'Overview',
    nav_analysis: 'Analysis',
    nav_perf: 'Performance',
    nav_calendar: 'Dividends',
    nav_settings: 'Settings',
    nav_brokers: 'Brokers',
    
    // Dashboard
    net_worth: 'Net Worth',
    dividend_yield: 'Annual Dividends',
    yield_label: 'Yield',
    cash: 'Cash',
    loan: 'Loan',
    holdings_header: 'Holdings',
    
    // Table headers
    gav_header: 'Avg Cost',
    price_header: 'Price',
    value_header: 'Value',
    dev_header: 'Return %',
    date_header: 'Updated',
    qty_header: 'Shares',
    m_weight_header: 'M-Weight %',
    i_weight_header: 'I-Weight %',
    
    // Form
    form_title_add: 'Add Transaction',
    form_title_edit: 'Edit Holding',
    lbl_symbol: 'Symbol',
    lbl_shares: 'Shares',
    lbl_purchase_price: 'Purchase Price',
    lbl_current_price: 'Current Price',
    lbl_currency: 'Currency',
    lbl_industry: 'Industry',
    lbl_dividend: 'Dividend',
    lbl_country: 'Country',
    lbl_commission: 'Commission',
    lbl_comm_curr: 'Curr',
    lbl_next_div: 'Next Div Date',
    lbl_broker: 'Broker',
    lbl_total_cost: 'Total Amount',
    lbl_beta: 'Beta',
    btn_add: 'Buy / Add',
    btn_save: 'Save',
    btn_sell: 'Sell',
    btn_cancel: 'Cancel',
    
    // Charts
    chart_industry_title: 'Industry Allocation',
    chart_region_title: 'Geographic Allocation',
    chart_holding_title: 'Holding Allocation',
    kpi_largest: 'Largest',
    heatmap_title: 'Market Heatmap',
    
    // Data management
    backup_title: 'Data Management',
    btn_export: 'Export Data',
    btn_import: 'Import Data',
    btn_export_excel: 'Export to Excel',
    
    // Modals
    modal_price_title: 'Update Price',
    modal_sell_title: 'Register Sale',
    
    // Performance
    sim_title: 'Portfolio Performance',
    total_value: 'Total Value',
    loan_pct: 'LTV',
    total_comm: 'Total Commission',
    sharpe_ratio: 'Sharpe Ratio',
    sharpe_info: 'Risk-adjusted return',
    sortino_ratio: 'Sortino Ratio',
    sortino_info: 'Downside risk',
    
    // API
    api_settings: 'API Settings',
    btn_update_all: 'Fetch Live Prices',
    
    // Search
    search_ph: 'Search stock...',
    search_loading: 'Searching...',
    fetching_price: 'Fetching price...',
    
    // Calendar
    cal_title: 'Dividend Calendar',
    cal_empty: 'No upcoming dividends.',
    
    // Settings
    settings_base_curr: 'Base Currency (Display)',
    api_prio_eodhd: 'EODHD API Token (Prio 1)',
    api_prio_ms: 'Marketstack API Key (Prio 2)',
    api_prio_1: 'Finnhub API (Prio 3)',
    api_prio_2: 'Alpha Vantage API (Prio 4)',
    api_prio_3: 'Extra API',
    
    // Time ranges
    time_1w: '1W',
    time_1m: '1M',
    time_3m: '3M',
    time_6m: '6M',
    time_ytd: 'YTD',
    time_1y: '1Y',
    time_3y: '3Y',
    time_all: 'All',
    
    // Sell modal
    sell_dest_label: 'Handle proceeds:',
    sell_dest_cash: 'Add to Cash',
    sell_dest_loan: 'Reduce Loan',
    sell_broker_label: 'From Broker',
    
    // Benchmark
    btn_benchmark: 'Compare Index',
    select_benchmark: 'Select benchmark index',
    
    // Risk
    risk_analysis: 'Risk Analysis',
    risk_diversification: 'Diversification',
    risk_high_conc: 'High Concentration',
    
    // Privacy
    privacy_mode: 'Privacy Mode',
    
    // Backup
    backup_section: 'Full Backup',
    backup_desc: 'Save your ENTIRE data (incl settings & history) locally.',
    btn_backup_save: 'Save full backup',
    btn_backup_load: 'Restore everything',
    
    // Statistics
    volatility: 'Volatility',
    vol_info: 'Std dev (Ann.)',
    max_drawdown: 'Max Drawdown',
    dd_info: 'Largest decline',
    max_gain: 'Total Gain',
    gain_info: 'Return',
    beta_info: 'Volatility vs Index',
    portfolio_beta: 'Portfolio Beta',
    beta_analysis: 'Beta Analysis',
    vol_30: '30 days',
    vol_90: '90 days',
    vol_252: '1 year',
    
    // Trading stats
    stats_hit_rate: 'Hit Rate',
    stats_win_loss: 'Win/Loss Ratio',
    stats_avg_win: 'Avg Win',
    stats_avg_loss: 'Avg Loss',
    stats_hold_time: 'Holding Period',
    stats_avg_days: 'days',
    stats_winners: 'Winners',
    stats_losers: 'Losers',
    stats_trading_title: 'Trading Analytics',
    
    // History
    settings_history: 'History Management',
    settings_history_desc: 'Create profiles and manually import history for a complete chart.',
    btn_add_profile: 'Add Profile',
    btn_import_csv: 'Import CSV',
    lbl_profile_name: 'Profile Name',
    history_date: 'Date',
    history_value: 'Value',
    btn_add_row: 'Add Row',
    chart_source_total: 'Total Portfolio (All Sources)',
    chart_source_live: 'Live Holdings Only',
    csv_info: 'Format: Date, Value (Ex: 2023-01-01, 150000)',
    msg_csv_error: 'Could not read file. Check format.',
    msg_profile_added: 'Profile created.',
    lbl_select_chart: 'Select Chart Source:',
    
    // Stress tests
    stress_title: 'Stress & Scenario Tests',
    stress_market_title: 'Market Scenario',
    stress_fx_title: 'Currency Scenario',
    stress_index_label: 'If',
    stress_change_label: 'changes by',
    stress_fx_vs: 'vs',
    stress_impact: 'Impact',
    stress_new_value: 'New Value',
    stress_strengthens: 'strengthens',
    stress_weakens: 'weakens',
    stress_market_desc: 'Simulates portfolio value based on Beta.',
    stress_fx_desc: 'Simulates FX changes on foreign holdings.',
    
    // Accounts
    settings_deposit: 'Liquidity',
    settings_loan: 'Loan (Debt)',
    select_holding_edit: 'Select holding to edit',
    select_holding_delete: 'Select holding to delete',
    btn_delete_all: 'Delete ENTIRE holding',
    delete_confirm_all: 'Are you sure you want to delete ALL records for this symbol?',
    msg_restore_ok: 'Restore complete!',
    msg_restore_err: 'Invalid file format',
    msg_csv_ok: 'rows imported',
    btn_add_account: 'Add account',
    lbl_account_name: 'Account/Broker',
    all_brokers: 'All brokers',
    broker_label: 'Broker:',
    index_label: 'Index:',
    holdings_label: 'Holdings',
    holdings_total: 'Holdings total',
    liquidity_label: 'Liquidity',
    loan_label: 'Loan',
    total_label: 'Total',
    no_liquidity_accounts: 'No liquidity accounts.',
    no_loans: 'No loans.',
    no_holdings: 'No holdings to display',
    estimated_tax_title: 'Tax Calculation (ISK/KF)',
    tax_base_label: 'Tax Base (Est.)',
    slr_label: 'State Loan Rate (SLR)',
    estimated_tax_label: 'Estimated Tax / Year',
    tax_desc: 'Based on value * (SLR + 1%) * 30%.',
    market_scenario: 'Market Scenario',
    currency_scenario: 'Currency Scenario',
    impact_label: 'Impact',
    new_value_label: 'New Value',
    new_value_total: 'New Value (Total)',
    estimated_monthly_dividend: 'Estimated Monthly Dividends',
    est_label: 'Est.',
    holdings_in: 'Holdings in',
    trades_label: 'trades',
    holding_updated: 'Holding updated',
    holding_added: 'Holding added',
    holding_deleted: 'Holding deleted',
    all_holdings_deleted: 'All holdings deleted',
    error_title: 'Something went wrong',
    error_message: 'An unexpected error occurred. Try reloading the page or reset the app.',
    error_technical: 'Technical information',
    error_try_again: 'Try again',
    error_reload: 'Reload page',
    
    // New V2 features
    correlation_matrix: 'Correlation Matrix',
    var_analysis: 'Value at Risk (VaR)',
    cagr: 'CAGR',
    export_csv: 'Export CSV',
    theme_toggle: 'Toggle theme',
    no_data: 'No data',
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success',
    confirm_delete: 'Are you sure?',
    holdings_in: 'Holdings in'
  }
};

export function getTranslation(lang = 'sv') {
  return TRANSLATIONS[lang] || TRANSLATIONS.sv;
}




