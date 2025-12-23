# Portfolio Tracker V 2.0 📊

En modern och kraftfull portföljhanterare byggd med React, Vite och Tailwind CSS.

## ✨ Funktioner

### Portföljhantering
- **Köp/Sälj aktier** med stöd för flera mäklare
- **Multi-valuta** med automatisk FX-uppdatering
- **Aggregering** av innehav per symbol (olika mäklare visas separat)
- **Kassa & Lån** hantering

### Visualisering
- **Heatmap** - Översikt över portföljen med färgkodning baserat på avkastning
- **Donut Charts** - Industri-, geografisk- och innehavsfördelning
- **Performance Chart** - Interaktiv graf med tidsperspektiv och benchmark-jämförelse
- **Utdelningskalender** - Månatlig utdelningsöversikt

### Analys
- **Riskanalys** - Varningar för hög koncentration
- **Volatilitet** - 30, 90 och 252 dagars volatilitet
- **Sharpe Ratio** - Riskjusterad avkastning
- **Portfolio Beta** - Marknadskorrelation
- **Trading Analytics** - Hit rate, Win/Loss ratio, m.m.

### Data & Export
- **Excel-export** - Exportera hela portföljen till Excel
- **JSON Backup** - Fullständig backup med alla inställningar
- **CSV Import** - Importera historik för grafer
- **Live-kurser** - Hämta kurser från flera API:er

### Benchmark
- **Jämför med index** - OMXS30, S&P 500, Nasdaq 100, DAX, m.fl.
- **Simulerad data** - Fallback om API inte finns

## 🚀 Kom igång

### Installation

```bash
cd portfolio-tracker
npm install
```

### Starta utvecklingsserver

```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000) i webbläsaren.

### Bygg för produktion

```bash
npm run build
```

## 🚀 Deployment till Vercel

### Steg 1: Pusha till GitHub

1. Initialisera git (om inte redan gjort):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Lägg till remote repository:
```bash
git remote add origin https://github.com/ABNAPP/Portfolio-Tracker.git
git branch -M main
git push -u origin main
```

### Steg 2: Deploya till Vercel

1. Gå till [vercel.com](https://vercel.com) och logga in
2. Klicka på **"Add New Project"**
3. Importera ditt GitHub-repository: `ABNAPP/Portfolio-Tracker`
4. Vercel kommer automatiskt att:
   - Detektera att det är ett Vite-projekt
   - Använda `vercel.json` för konfiguration
   - Bygga projektet med `npm run build`
   - Deploya till produktion

### Steg 3: Konfiguration (valfritt)

Vercel kommer automatiskt att:
- ✅ Detektera build-kommandot från `package.json`
- ✅ Använda output-mappen `dist/`
- ✅ Konfigurera SPA-routing via `vercel.json`

**Inga miljövariabler behövs** - API-nycklar hanteras via localStorage i appen.

### Efter deployment

Din app kommer att vara tillgänglig på en URL som:
- `https://portfolio-tracker-xxxxx.vercel.app`

Varje push till `main`-branchen kommer automatiskt att trigga en ny deployment.

## 📁 Projektstruktur

```
portfolio-tracker/
├── src/
│   ├── components/
│   │   ├── ui/              # Icon, Notification, ErrorBoundary
│   │   ├── charts/          # PerformanceChart, DonutChart, Heatmap
│   │   ├── modals/          # PriceModal, SellModal, etc.
│   │   ├── Navigation.jsx
│   │   ├── HoldingsTable.jsx
│   │   ├── AddHoldingForm.jsx
│   │   └── DashboardCards.jsx
│   ├── hooks/
│   │   ├── useLocalStorage.js
│   │   ├── useApi.js
│   │   └── useBenchmark.js
│   ├── utils/
│   │   ├── constants.js
│   │   ├── formatters.js
│   │   ├── calculations.js
│   │   ├── exportUtils.js
│   │   └── translations.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🔧 API-nycklar

För att hämta live-kurser behöver du API-nycklar från:

1. **EODHD** (Rekommenderas) - [eodhd.com](https://eodhd.com)
2. **Finnhub** - [finnhub.io](https://finnhub.io)
3. **Alpha Vantage** - [alphavantage.co](https://www.alphavantage.co)

Lägg till nycklarna under Inställningar i appen.

## 🌟 Förbättringar i V2.0

### Performance
- ✅ **Optimerad icon-rendering** - Använder lucide-react istället för runtime DOM-manipulation
- ✅ **Memoization** - Komponenter är memo:ade för att undvika onödiga re-renders
- ✅ **Code splitting** - Modulär kodstruktur för bättre underhåll

### Nya funktioner
- ✅ **Recharts** - Professionella och interaktiva grafer
- ✅ **Excel-export** - Exportera portföljen till .xlsx
- ✅ **Riktiga benchmarks** - Stöd för att hämta verklig indexdata
- ✅ **Förbättrad Heatmap** - Hover-effekter och tooltips

### Buggfixar
- ✅ **DonutChart** - Beräknar nu total korrekt från data
- ✅ **Stress Test FX** - Korrekt hantering av valutainnehav
- ✅ **Division by zero** - Säkra beräkningar överallt

## 📝 Licens

MIT

## 🤝 Bidra

Pull requests är välkomna! För större ändringar, öppna först en issue.












