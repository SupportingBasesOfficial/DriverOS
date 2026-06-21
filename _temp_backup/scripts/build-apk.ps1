#Requires -Version 7
<#
.SYNOPSIS
    Script para gerar build APK do DriverOS via EAS Build
.DESCRIPTION
    1. Verifica .env do mobile
    2. Verifica/instala EAS CLI
    3. Verifica login e projectId
    4. Executa build preview (APK)
.EXAMPLE
    .\scripts\build-apk.ps1
#>
$ErrorActionPreference = "Stop"
$BaseDir = Split-Path -Parent $PSScriptRoot
$MobileDir = Join-Path $BaseDir "apps\mobile"
Set-Location $MobileDir

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DriverOS - Gerar Build APK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# 1. VERIFICAR .ENV
# -----------------------------------------------------------------------------
Write-Host "[1/4] Verificando .env do mobile..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "  ERRO: .env nao encontrado em apps/mobile" -ForegroundColor Red
    Write-Host "  Copie .env.example para .env e preencha a SUPABASE_ANON_KEY" -ForegroundColor Yellow
    exit 1
}
$EnvContent = Get-Content ".env" -Raw
if ($EnvContent -notmatch "EXPO_PUBLIC_SUPABASE_URL" -or $EnvContent -notmatch "EXPO_PUBLIC_SUPABASE_ANON_KEY") {
    Write-Host "  ERRO: EXPO_PUBLIC_SUPABASE_URL ou EXPO_PUBLIC_SUPABASE_ANON_KEY nao encontrados no .env" -ForegroundColor Red
    exit 1
}
Write-Host "  OK: .env configurado" -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# 2. VERIFICAR/INSTALAR EAS CLI
# -----------------------------------------------------------------------------
Write-Host "[2/4] Verificando EAS CLI..." -ForegroundColor Yellow
$EasCmd = Get-Command "eas" -ErrorAction SilentlyContinue
if (-not $EasCmd) {
    Write-Host "  Instalando EAS CLI..." -ForegroundColor Yellow
    npm install -g eas-cli
    $EasCmd = Get-Command "eas" -ErrorAction SilentlyContinue
    if (-not $EasCmd) {
        Write-Error "Falha ao instalar EAS CLI. Instale manualmente: npm install -g eas-cli"
        exit 1
    }
}
Write-Host "  OK: $($EasCmd.Source)" -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# 3. VERIFICAR LOGIN E PROJETO
# -----------------------------------------------------------------------------
Write-Host "[3/4] Verificando login na Expo..." -ForegroundColor Yellow
$LoginCheck = & eas whoami 2>&1
if ($LASTEXITCODE -ne 0 -or $LoginCheck -match "not logged") {
    Write-Host "  Nao esta logado. Execute: eas login" -ForegroundColor Yellow
    & eas login
} else {
    Write-Host "  OK: $LoginCheck" -ForegroundColor Green
}

# Verifica se projectId eh um UUID (projeto criado no EAS)
$AppJson = Get-Content "app.json" | ConvertFrom-Json
$ProjectId = $AppJson.expo.extra.eas.projectId
if ($ProjectId -notmatch "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$") {
    Write-Host "  AVISO: projectId nao parece um UUID valido do EAS." -ForegroundColor Yellow
    Write-Host "  Execute 'eas init' para criar o projeto na nuvem da Expo." -ForegroundColor Yellow
    $Confirm = Read-Host "Deseja executar 'eas init' agora? (s/N)"
    if ($Confirm -eq "s" -or $Confirm -eq "S") {
        & eas init
    } else {
        exit 1
    }
}
Write-Host ""

# -----------------------------------------------------------------------------
# 4. BUILD PREVIEW (APK)
# -----------------------------------------------------------------------------
Write-Host "[4/4] Iniciando build preview (APK)..." -ForegroundColor Yellow
Write-Host "  Isso vai enviar o codigo para a nuvem da Expo e gerar o APK." -ForegroundColor DarkGray
Write-Host "  Voce recebera um email e podera acompanhar em: https://expo.dev" -ForegroundColor DarkGray
Write-Host ""

& eas build --profile preview --platform android

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build falhou. Verifique os logs acima."
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build iniciado com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Acompanhe em: https://expo.dev/accounts/supportingbasesofficial/projects/driveros" -ForegroundColor Yellow
