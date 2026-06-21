#Requires -Version 7
<#
.SYNOPSIS
    Sincroniza tipos TypeScript do banco de dados Supabase
.DESCRIPTION
    Gera o arquivo database.types.ts a partir do schema remoto
.EXAMPLE
    .\scripts\sync-types.ps1
#>
param(
    [string]$ProjectRef = "wobazrdzckzaoununlje",
    [string]$OutputPath = "packages/typescript-config/database.types.ts"
)

$ErrorActionPreference = "Stop"
$BaseDir = Split-Path -Parent $PSScriptRoot
Set-Location $BaseDir

Write-Host "[sync-types] Gerando tipos TypeScript..." -ForegroundColor Cyan

# Verificar se supabase CLI existe
$SupabaseCmd = Get-Command "supabase" -ErrorAction SilentlyContinue
if (-not $SupabaseCmd) {
    Write-Error "Supabase CLI nao encontrado. Rode primeiro: .\scripts\setup-supabase.ps1"
    exit 1
}

# Gerar tipos
& supabase gen types typescript --project-id $ProjectRef --schema public > $OutputPath

if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao gerar tipos. Verifique se esta logado no Supabase CLI."
    exit 1
}

Write-Host "[sync-types] OK: Tipos salvos em $OutputPath" -ForegroundColor Green
