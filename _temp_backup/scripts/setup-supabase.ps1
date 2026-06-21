#Requires -Version 7
<#
.SYNOPSIS
    Script de setup automatizado do Supabase para DriverOS
.DESCRIPTION
    1. Verifica/instala Supabase CLI
    2. Faz login com token (se fornecido)
    3. Linka com projeto remoto
    4. Aplica migrations
    5. Gera tipos TypeScript
.EXAMPLE
    .\scripts\setup-supabase.ps1 -Token "sbp_xxxxxxxx"
#>
param(
    [string]$Token = "",
    [string]$ProjectRef = "wobazrdzckzaoununlje"
)

$ErrorActionPreference = "Stop"
$BaseDir = Split-Path -Parent $PSScriptRoot
Set-Location $BaseDir

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DriverOS - Setup Automatizado Supabase" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# 1. VERIFICAR/INSTALAR SUPABASE CLI
# -----------------------------------------------------------------------------
Write-Host "[1/5] Verificando Supabase CLI..." -ForegroundColor Yellow

$SupabaseCmd = Get-Command "supabase" -ErrorAction SilentlyContinue

if (-not $SupabaseCmd) {
    Write-Host "  Supabase CLI nao encontrado. Instalando..." -ForegroundColor Yellow

    # Tentar via npm (Node.js)
    $NpmCmd = Get-Command "npm" -ErrorAction SilentlyContinue
    if ($NpmCmd) {
        Write-Host "  Instalando via npm..." -ForegroundColor DarkGray
        & npm install -g supabase
    } else {
        # Tentar via scoop
        $ScoopCmd = Get-Command "scoop" -ErrorAction SilentlyContinue
        if ($ScoopCmd) {
            Write-Host "  Instalando via scoop..." -ForegroundColor DarkGray
            & scoop install supabase
        } else {
            # Download direto do binario
            $LatestUrl = "https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.tar.gz"
            $TempFile = "$env:TEMP\supabase.tar.gz"
            $InstallDir = "$env:LOCALAPPDATA\supabase"

            Write-Host "  Baixando binario diretamente..." -ForegroundColor DarkGray
            Invoke-WebRequest -Uri $LatestUrl -OutFile $TempFile -UseBasicParsing

            if (-not (Test-Path "$env:TEMP\tar.exe")) {
                # Usar Expand-Archive se for zip, ou tar do Windows 10+
                tar -xzf $TempFile -C "$env:TEMP"
            }

            New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
            Copy-Item "$env:TEMP\supabase.exe" "$InstallDir\supabase.exe" -Force -ErrorAction SilentlyContinue

            $env:Path += ";$InstallDir"
            [Environment]::SetEnvironmentVariable("Path", $env:Path, "User")

            Write-Host "  Instalado em $InstallDir" -ForegroundColor Green
        }
    }

    # Verificar novamente
    $SupabaseCmd = Get-Command "supabase" -ErrorAction SilentlyContinue
    if (-not $SupabaseCmd) {
        Write-Error "Falha ao instalar Supabase CLI. Instale manualmente: https://supabase.com/docs/guides/cli/getting-started"
        exit 1
    }
} else {
    Write-Host "  OK: $($SupabaseCmd.Source)" -ForegroundColor Green
}

Write-Host ""

# -----------------------------------------------------------------------------
# 2. LOGIN (se token fornecido)
# -----------------------------------------------------------------------------
if ($Token) {
    Write-Host "[2/5] Fazendo login no Supabase..." -ForegroundColor Yellow
    & supabase login --token $Token
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha no login. Verifique o token em: https://supabase.com/dashboard/account/tokens"
        exit 1
    }
    Write-Host "  OK: Login realizado" -ForegroundColor Green
} else {
    Write-Host "[2/5] Pulando login (sem token fornecido)" -ForegroundColor DarkGray
    Write-Host "  Para fazer login depois, rode: supabase login" -ForegroundColor DarkGray
    Write-Host "  Ou obtenha um token em: https://supabase.com/dashboard/account/tokens" -ForegroundColor DarkGray
}
Write-Host ""

# -----------------------------------------------------------------------------
# 3. LINKAR PROJETO REMOTO
# -----------------------------------------------------------------------------
Write-Host "[3/5] Linkando com projeto remoto ($ProjectRef)..." -ForegroundColor Yellow
& supabase link --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Falha ao linkar. Verifique se o token de acesso tem permissao."
    Write-Warning "Para linkar manualmente: supabase link --project-ref $ProjectRef"
}
Write-Host ""

# -----------------------------------------------------------------------------
# 4. APLICAR MIGRATIONS
# -----------------------------------------------------------------------------
Write-Host "[4/5] Aplicando migrations..." -ForegroundColor Yellow
& supabase db push
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao aplicar migrations."
    exit 1
}
Write-Host "  OK: Migrations aplicadas com sucesso!" -ForegroundColor Green
Write-Host ""

# -----------------------------------------------------------------------------
# 5. GERAR TIPOS TYPESCRIPT
# -----------------------------------------------------------------------------
Write-Host "[5/5] Gerando tipos TypeScript..." -ForegroundColor Yellow
& supabase gen types typescript --project-id $ProjectRef --schema public > packages/typescript-config/database.types.ts
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao gerar tipos."
    exit 1
}
Write-Host "  OK: Tipos gerados em packages/typescript-config/database.types.ts" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup concluido com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
