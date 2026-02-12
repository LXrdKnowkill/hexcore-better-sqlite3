# ============================================================================
# HexCore Better-SQLite3 - Sync to Standalone Repo + Git Push
# ============================================================================

$ErrorActionPreference = "Stop"

$SRC  = "C:\Users\Mazum\Desktop\vscode-main\StandalonePackagesHexCore\hexcore-better-sqlite3"
$DEST = "C:\Users\Mazum\Desktop\StandalonePackagesHexCore\hexcore-better-sqlite3"
$TMP_GIT = "$env:TEMP\hexcore-sqlite3-git-backup"
$REPO_URL = "https://github.com/LXrdKnowkill/hexcore-better-sqlite3.git"

if (-not (Test-Path $SRC)) {
    Write-Host "[ERRO] Source nao encontrada: $SRC" -ForegroundColor Red
    exit 1
}

# Garantir que o destino existe
if (-not (Test-Path $DEST)) {
    New-Item -ItemType Directory -Path $DEST -Force | Out-Null
}

Write-Host "=== HexCore Better-SQLite3 Sync + Push ===" -ForegroundColor Cyan
Write-Host ""

# Restaurar .git se necessario
if (-not (Test-Path "$DEST\.git")) {
    Write-Host "[RECOVERY] .git nao encontrado no destino" -ForegroundColor Yellow

    if (Test-Path "$TMP_GIT\HEAD") {
        Write-Host "[RECOVERY] Restaurando .git do backup temporario..." -ForegroundColor Yellow
        Copy-Item -Recurse -Force $TMP_GIT "$DEST\.git"
        Remove-Item -Recurse -Force $TMP_GIT
        Write-Host "[RECOVERY] .git restaurado com sucesso" -ForegroundColor Green
    } else {
        Write-Host "[RECOVERY] Sem backup, clonando fresh do GitHub..." -ForegroundColor Yellow
        $tempClone = "$env:TEMP\hexcore-sqlite3-fresh-clone"
        if (Test-Path $tempClone) { Remove-Item -Recurse -Force $tempClone }
        git clone $REPO_URL $tempClone
        Copy-Item -Recurse -Force "$tempClone\.git" "$DEST\.git"
        Remove-Item -Recurse -Force $tempClone
        Write-Host "[RECOVERY] .git clonado com sucesso" -ForegroundColor Green
    }
}

# Limpar tudo no destino EXCETO .git
Write-Host "[1/4] Limpando destino (preservando .git)..." -ForegroundColor Yellow
Get-ChildItem -Path $DEST -Force | Where-Object {
    $_.Name -ne ".git"
} | ForEach-Object {
    Remove-Item -Recurse -Force $_.FullName
}

# Copiar arquivos (sem node_modules, build, .git, prebuilds)
Write-Host "[2/4] Copiando arquivos..." -ForegroundColor Yellow
$exclude = @("node_modules", "build", ".git", "prebuilds")

Get-ChildItem -Path $SRC -Force | Where-Object {
    $exclude -notcontains $_.Name
} | ForEach-Object {
    Copy-Item -Recurse -Force $_.FullName "$DEST\$($_.Name)"
    Write-Host "  $($_.Name)" -ForegroundColor DarkGray
}

# Verificar
Write-Host "[3/4] Verificando..." -ForegroundColor Yellow
$required = @(
    "src\main.cpp",
    "src\sqlite3_wrapper.cpp",
    "src\sqlite3_wrapper.h",
    "binding.gyp",
    "package.json",
    "index.js",
    "lib\database.js",
    ".git\HEAD"
)
$allOk = $true
foreach ($f in $required) {
    if (Test-Path (Join-Path $DEST $f)) {
        Write-Host "  [OK] $f" -ForegroundColor Green
    } else {
        Write-Host "  [FALTA] $f" -ForegroundColor Red
        $allOk = $false
    }
}

if (-not $allOk) {
    Write-Host "`nVerificacao falhou." -ForegroundColor Red
    exit 1
}

# Git add + commit + push
Write-Host "[4/4] Git add, commit, push..." -ForegroundColor Yellow
Push-Location $DEST
try {
    git add -A
    Write-Host ""
    git status --short
    Write-Host ""

    git commit -m "refactor: rewrite as N-API wrapper (remove vendor dump)" -m "- Replace vendor dump with clean N-API wrapper (node-addon-api)" -m "- New src/main.cpp, sqlite3_wrapper.cpp, sqlite3_wrapper.h" -m "- Same pattern as hexcore-capstone/unicorn/llvm-mc" -m "- Pre-built sqlite3.lib, zero runtime deps" -m "- All smoke + IOC integration tests passing"

    git push origin main

    Write-Host ""
    Write-Host "=== Pronto! Push feito ===" -ForegroundColor Green
} catch {
    Write-Host "Git falhou: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}
