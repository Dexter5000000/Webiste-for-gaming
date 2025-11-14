#!/usr/bin/env bash
# Convert Scrapy JSON data to multiple formats
# Usage: bash scripts/convert-formats.sh freesound-samples.json

INPUT_FILE="${1:-.freesound-samples.json}"
OUTPUT_DIR="./public/data"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Run converter
&"C:\Users\Rhowind\Zenith Daw\Webiste-for-gaming\.venv\Scripts\ts-node.exe" scripts/convert-scrapy-formats.ts "$INPUT_FILE"

echo ""
echo "📂 All formats ready in: $OUTPUT_DIR"
echo ""
echo "🔍 Use these files:"
echo "   • Spreadsheets: freesound-samples.csv or freesound-samples-semicolon.csv"
echo "   • Programming: freesound-samples.json or freesound-samples.jsonl"
echo "   • Web/APIs: freesound-samples.xml"
