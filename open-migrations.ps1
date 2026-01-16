# Script PowerShell pour ouvrir les migrations Supabase
# Usage: .\open-migrations.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   OUVERTURE DES MIGRATIONS SUPABASE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = "C:\Users\djala_r1l99q2\OneDrive\Bureau\eitherway"
$migrationsPath = "$projectPath\supabase\migrations"

# Vérifier que le dossier existe
if (-not (Test-Path $migrationsPath)) {
    Write-Host "❌ ERREUR: Le dossier migrations n'existe pas!" -ForegroundColor Red
    Write-Host "   Chemin: $migrationsPath" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ Dossier migrations trouvé!" -ForegroundColor Green
Write-Host ""

# Lister les migrations
$migrations = Get-ChildItem -Path $migrationsPath -Filter "*.sql" | Sort-Object Name

Write-Host "📋 Migrations disponibles:" -ForegroundColor Yellow
Write-Host ""
foreach ($migration in $migrations) {
    $size = [math]::Round($migration.Length / 1KB, 1)
    Write-Host "   • $($migration.Name) ($size KB)" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Menu interactif
Write-Host "Que voulez-vous faire ?" -ForegroundColor Yellow
Write-Host ""
Write-Host "[1] Ouvrir TOUTES les migrations dans Notepad" -ForegroundColor White
Write-Host "[2] Ouvrir migration 001 uniquement" -ForegroundColor White
Write-Host "[3] Ouvrir migration 002 uniquement" -ForegroundColor White
Write-Host "[4] Ouvrir migration 003 uniquement" -ForegroundColor White
Write-Host "[5] Ouvrir le guide d'exécution (EXECUTE_MIGRATIONS.md)" -ForegroundColor White
Write-Host "[6] Ouvrir Supabase dans le navigateur" -ForegroundColor White
Write-Host "[Q] Quitter" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Votre choix"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "📂 Ouverture de toutes les migrations..." -ForegroundColor Green
        foreach ($migration in $migrations) {
            Start-Process notepad.exe $migration.FullName
            Start-Sleep -Milliseconds 500
        }
        Write-Host "✅ Toutes les migrations sont ouvertes!" -ForegroundColor Green
    }
    "2" {
        $file = "$migrationsPath\001_initial_schema.sql"
        if (Test-Path $file) {
            Write-Host "📂 Ouverture de 001_initial_schema.sql..." -ForegroundColor Green
            Start-Process notepad.exe $file
            Write-Host "✅ Fichier ouvert!" -ForegroundColor Green
        } else {
            Write-Host "❌ Fichier non trouvé!" -ForegroundColor Red
        }
    }
    "3" {
        $file = "$migrationsPath\002_row_level_security.sql"
        if (Test-Path $file) {
            Write-Host "📂 Ouverture de 002_row_level_security.sql..." -ForegroundColor Green
            Start-Process notepad.exe $file
            Write-Host "✅ Fichier ouvert!" -ForegroundColor Green
        } else {
            Write-Host "❌ Fichier non trouvé!" -ForegroundColor Red
        }
    }
    "4" {
        $file = "$migrationsPath\003_functions_and_triggers.sql"
        if (Test-Path $file) {
            Write-Host "📂 Ouverture de 003_functions_and_triggers.sql..." -ForegroundColor Green
            Start-Process notepad.exe $file
            Write-Host "✅ Fichier ouvert!" -ForegroundColor Green
        } else {
            Write-Host "❌ Fichier non trouvé!" -ForegroundColor Red
        }
    }
    "5" {
        $guide = "$projectPath\EXECUTE_MIGRATIONS.md"
        if (Test-Path $guide) {
            Write-Host "📖 Ouverture du guide d'exécution..." -ForegroundColor Green
            Start-Process $guide
            Write-Host "✅ Guide ouvert!" -ForegroundColor Green
        } else {
            Write-Host "❌ Guide non trouvé!" -ForegroundColor Red
        }
    }
    "6" {
        Write-Host "🌐 Ouverture de Supabase dans le navigateur..." -ForegroundColor Green
        Start-Process "https://app.supabase.com"
        Write-Host "✅ Navigateur ouvert!" -ForegroundColor Green
    }
    "Q" {
        Write-Host "Au revoir! 👋" -ForegroundColor Cyan
        exit 0
    }
    default {
        Write-Host "❌ Choix invalide!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 PROCHAINES ÉTAPES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ouvrez https://app.supabase.com" -ForegroundColor White
Write-Host "2. Sélectionnez votre projet" -ForegroundColor White
Write-Host "3. Cliquez sur 'SQL Editor'" -ForegroundColor White
Write-Host "4. Copiez-collez chaque migration dans l'ordre" -ForegroundColor White
Write-Host "5. Cliquez 'RUN' pour chaque migration" -ForegroundColor White
Write-Host ""
Write-Host "📖 Consultez EXECUTE_MIGRATIONS.md pour le guide détaillé" -ForegroundColor Cyan
Write-Host ""
pause
