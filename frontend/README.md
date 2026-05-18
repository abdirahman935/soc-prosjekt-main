# SOC Dashboard - React Frontend (Create React App)

A React-based SOC (Security Operations Center) dashboard for monitoring Windows Server lab environments. Built with Create React App.

## Quick Start

### 1. Install dependencies

```powershell
npm install
```

### 2. Start backend

```powershell
Set-Location C:\Users\Administrator.JIHADLABSERVER.000\Downloads\soc-lab-prosjekt-main\backend
py -3 server.py --data "C:\SOC\exports\soc-summary.json"
```

### 3. Start frontend dev server

```powershell
npm start
```

The app opens at `http://localhost:3000`.

To create a production build:

```powershell
npm run build
```

Output goes to `build/` and can be served by any static file server.

---

## Project Files

```
frontend/
├── public/
│   ├── index.html                   # HTML template
│   └── data/
│       └── sample-soc-summary.json  # Fallback sample data
├── src/
│   ├── index.js                     # React entrypoint
│   ├── App.js                       # Main dashboard component (JSX)
│   ├── helpers.js                   # Constants, formatting, data fetching
│   └── styles.css                   # All styling
├── package.json
└── .gitignore
```

---

## How It Works

1. **Create React App** handles bundling, JSX compilation, and the dev server.

2. **Data fetching** (in `src/helpers.js`):
   - Primary: `http://127.0.0.1:8001/api/summary` (live backend)
   - Fallback: `/data/sample-soc-summary.json` (local sample served from `public/`)
   - The dashboard polls every 15 seconds.

---

## Starting the Backend

```powershell
Set-Location backend
py -3 server.py --data "C:\SOC\exports\soc-summary.json"
```

Serves live data at: `http://127.0.0.1:8001/api/summary`

---

## Generate Live Data

```powershell
Set-Location scripts\windows
.\Get-SocSummary.ps1 -ComputerTargets @("Fariss") -OutputPath "C:\SOC\exports\soc-summary.json"
```

---

## Data Flow

```
Browser (http://localhost:3000)
    ↓ (fetch every 15 sec)
React App (src/App.js)
    ↓ (HTTP GET)
Python Backend (http://127.0.0.1:8001/api/summary)
    ↓ (reads JSON with BOM support)
Live Windows Lab Data (C:\SOC\exports\soc-summary.json)
```

---

## Troubleshooting

### Backend not responding?

```powershell
Invoke-RestMethod http://127.0.0.1:8001/api/summary
```

### Frontend stuck on "Laster..."?

Check browser console (F12) for errors. Verify backend is running and CORS allows `http://localhost:3000`.

### Port 3000 already in use?

CRA will prompt to use another port. Or kill the process:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
Stop-Process -Id <PID> -Force
```

---

## Available Scripts

- `npm start` — run dev server with hot reload
- `npm run build` — production build to `build/`
- `npm test` — run tests with Jest (CRA default)
- `npm run eject` — eject from react-scripts (one-way)
