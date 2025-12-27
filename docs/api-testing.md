# API Testing Guide

This document provides commands to test the core API endpoints.
Choose the section that matches your terminal (Git Bash/WSL vs PowerShell).

---

## Option 1: Git Bash / WSL / Mac / Linux (Recommended)
*These commands use standard `curl` syntax.*

### 1. Authentication

#### Login as Super Admin
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@system.com", "password": "Admin@123", "tenantSubdomain": "system"}'
```

#### Login as Tenant Admin (Demo Company)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@demo.com", "password": "Demo@123", "tenantSubdomain": "demo"}'
```

---

## Option 2: Windows PowerShell
*PowerShell uses `Invoke-RestMethod` (irm). Use these commands if running directly in PowerShell.*

### 1. Authentication

#### Login as Super Admin (PowerShell)
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email": "superadmin@system.com", "password": "Admin@123", "tenantSubdomain": "system"}'
$token = $response.data.token
Write-Host "Token: $token"
```

#### Login as Tenant Admin (PowerShell)
```powershell
$login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email": "admin@demo.com", "password": "Demo@123", "tenantSubdomain": "demo"}'
$token = $login.data.token
Write-Host "Token: $token"
```

### 2. Project Management (PowerShell)

#### List Projects
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/projects" `
  -Method Get `
  -Headers @{ Authorization = ("Bearer " + $token) }
```

#### Create Project
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/projects" `
  -Method Post `
  -Headers @{ Authorization = ("Bearer " + $token) } `
  -ContentType "application/json" `
  -Body '{"name": "PowerShell Project", "description": "Created from PS", "status": "active"}'
```

---

## Troubleshooting Common Errors

### 1. Postman 404 "Cannot POST /api/auth/login%20"
**Cause**: You have a space at the end of your URL.
**Fix**: Remove the trailing space in the Postman URL bar.
- Incorrect: `http://localhost:5000/api/auth/login `
- Correct: `http://localhost:5000/api/auth/login`

### 2. PowerShell "curl" errors
**Cause**: In PowerShell, `curl` is an alias for `Invoke-WebRequest`, which has different syntax.
**Fix**: Use the PowerShell commands above, or run `Remove-Item alias:curl` to use standard curl (if installed).
