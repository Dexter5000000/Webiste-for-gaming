# Convert Scrapy JSON data to multiple formats
# Usage: .\scripts\convert-formats.ps1 -InputFile freesound-samples.json

param(
    [string]$InputFile = "./freesound-samples.json"
)

$OutputDir = "./public/data"
$PythonExe = "C:\Users\Rhowind\Zenith Daw\Webiste-for-gaming\.venv\Scripts\ts-node.exe"

# Create output directory
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

Write-Host "📥 Converting Scrapy data to multiple formats..."
Write-Host ""

# Run converter
& $PythonExe scripts/convert-scrapy-formats.ts $InputFile

Write-Host ""
Write-Host "📂 All formats ready in: $OutputDir"
Write-Host ""
Write-Host "🔍 Use these files:"
Write-Host "   • Spreadsheets: freesound-samples.csv or freesound-samples-semicolon.csv"
Write-Host "   • Programming: freesound-samples.json or freesound-samples.jsonl"
Write-Host "   • Web/APIs: freesound-samples.xml"
Write-Host ""
Write-Host "✅ Conversion complete!"
