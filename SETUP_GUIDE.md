# SOC Lab Dashboard - Complete Setup & Run Guide

This project contains a React frontend and Python backend for monitoring Windows Server lab environments.

## Quick Start - Copy & Paste

### Terminal 1: Backend Server

```powershell
Set-Location C:\Users\Administrator.JIHADLABSERVER.000\Downloads\soc-lab-prosjekt-main\backend
py -3 server.py --data "C:\SOC\exports\soc-summary.json"
```

**Expected output:**
```
SOC backend kjører på http://127.0.0.1:8001
Leser data fra: C:\SOC\exports\soc-summary.json
```

### Terminal 2: Frontend HTTP Server

```powershell
Set-Location C:\Users\Administrator.JIHADLABSERVER.000\Downloads\soc-lab-prosjekt-main\frontend
py -3 -m http.server 4173
```

**Expected output:**
```
Serving HTTP on 0.0.0.0 port 4173 (http://0.0.0.0:4173/)
```

### Browser

Open: `http://127.0.0.1:4173`

---

## Step-by-Step Setup

### 1. Generate Live Data Export (Windows Server/Lab Collector)

Run this on the Windows Server machine where events are being collected:

```powershell
Set-Location C:\Users\Administrator.JIHADLABSERVER.000\Downloads\soc-lab-prosjekt-main\scripts\windows
.\Get-SocSummary.ps1 -ComputerTargets @("Fariss") -OutputPath "C:\SOC\exports\soc-summary.json"
```

This creates `C:\SOC\exports\soc-summary.json` with live lab data.

### 2. Start Backend (Terminal 1)

```powershell
cd C:\Users\Administrator.JIHADLABSERVER.000\Downloads\soc-lab-prosjekt-main\backend
py -3 server.py --data "C:\SOC\exports\soc-summary.json"
```

Serves live JSON at: `http://127.0.0.1:8001/api/summary`

### 3. Start Frontend (Terminal 2)

```powershell
cd C:\Users\Administrator.JIHADLABSERVER.000\Downloads\soc-lab-prosjekt-main\frontend
py -3 -m http.server 4173
```

Serves HTML/JS at: `http://127.0.0.1:4173`

### 4. Open Browser

Navigate to: `http://127.0.0.1:4173`

The dashboard shows:
- Live domain information
- Failed logons, locked accounts, service failures, etc.
- Recent security events from the lab
- Monitored computers and services

---

## Terminal Commands Reference

### Frontend (No build required)

| Command | Purpose |
|---------|---------|
| `py -3 -m http.server 4173` | Start simple HTTP server on port 4173 |
| (Browser reload) | Manually refresh to see changes |

**Note:** React and dependencies load from CDN in the browser. No npm or build step needed.

### Backend

| Command | Purpose |
|---------|---------|
| `py -3 server.py --data <path>` | Start backend serving JSON from file |
| `py -3 server.py --help` | Show backend options |

### Data Export

| Command | Purpose |
|---------|---------|
| `.\Get-SocSummary.ps1 -ComputerTargets @("Name") -OutputPath <path>` | Export live lab data |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│          Web Browser                            │
│  http://127.0.0.1:4173                         │
└────────────────┬────────────────────────────────┘
                │
                │ HTTP GET /api/summary
                │ Auto-refresh every 15 sec
                ▼
┌─────────────────────────────────────────────────┐
│          React Frontend                         │
│  ✓ Loads React from CDN (no build needed)      │
│  ✓ Uses htm for JSX syntax                      │
│  ✓ Static HTML/JS files                        │
└────────────────┬────────────────────────────────┘
                │
                │ HTTP GET
                │
                ▼
┌─────────────────────────────────────────────────┐
│          Python Backend                         │
│  http://127.0.0.1:8001/api/summary             │
│  ✓ Serves JSON with UTF-8 BOM support          │
│  ✓ CORS enabled for frontend cross-origin      │
└────────────────┬────────────────────────────────┘
                │
                │ File read
                │
                ▼
┌─────────────────────────────────────────────────┐
│  C:\SOC\exports\soc-summary.json               │
│  Live Windows lab data (created by             │
│  Get-SocSummary.ps1 on Windows Server)         │
└─────────────────────────────────────────────────┘
```

---

## Troubleshooting

### "Backend is not responding" or dashboard shows sample data?

Check backend is running:

```powershell
Test-Path C:\SOC\exports\soc-summary.json
Invoke-RestMethod http://127.0.0.1:8001/api/summary
```

Restart backend if needed.

### Frontend shows "Laster..." forever?

1. Open DevTools (F12)
2. Check Console tab for errors
3. Check Network tab - is `/api/summary` request succeeding?
4. Verify `http://127.0.0.1:8001` is reachable

### Port already in use?

If port 4173 or 8001 is in use, kill the process:

```powershell
# Find process on port
Get-NetTCPConnection -LocalPort 4173 -State Listen

# Kill by PID
Stop-Process -Id <PID> -Force
```

Then restart the server.

---

## File Structure

```
soc-lab-prosjekt-main/
├── backend/
│   ├── server.py                    # Python backend API
│   ├── data/
│   │   └── soc-summary.json
│   └── README.md
├── frontend/                        # ← React project
│   ├── index.html                   # HTML entry point
│   ├── app.js                       # React app (no build needed)
│   ├── styles.css                   # All styling
│   ├── data/
│   │   └── sample-soc-summary.json  # Fallback data
│   ├── README.md
│   ├── package.json
│   └── .gitignore
├── scripts/
│   └── windows/
│       ├── Get-SocSummary.ps1       # Data export
│       ├── Configure-Collector.ps1
│       ├── Install-Sysmon.ps1
│       └── Start-SocWebApp.ps1
├── docs/
├── SETUP_GUIDE.md                   # This file
└── README.md
```

---

## Key Technologies

- **Frontend:** React 19 (from CDN), htm for JSX-like syntax
- **Backend:** Python 3.7+, http.server
- **Data Format:** JSON (UTF-8 with BOM support)
- **Communication:** HTTP/REST API
- **No Build Step:** Everything runs as-is in the browser

---

## Notes for Students/Lab Setup

1. Backend must be running before frontend makes requests
2. Data is auto-refreshed every 15 seconds
3. If Windows Server data is not available, the dashboard shows sample data
4. The React frontend handles both live and sample data gracefully
5. All styling is responsive (works on desktop and tablets)
6. **No npm installation required** - use Python http.server instead

---

## Support

For issues:
1. Check the frontend and backend README files in each folder
2. Verify ports 4173 and 8001 are available
3. Ensure `C:\SOC\exports\soc-summary.json` exists with valid JSON
4. Check browser console (F12) for JavaScript errors
5. Verify backend is serving with BOM-compatible encoding
