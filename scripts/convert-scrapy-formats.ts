import fs from 'fs';
import path from 'path';

export interface FreesoundSample {
  id: string;
  name: string;
  url: string;
  username: string;
  duration: string;
  license: string;
  downloads: string;
  genre: string;
  source: string;
  page: number;
}

/**
 * Convert Scrapy JSON to CSV (comma delimited)
 */
export function toCSVComma(samples: FreesoundSample[]): string {
  if (samples.length === 0) return '';

  // Get all unique keys
  const keys = Object.keys(samples[0]);
  
  // Header row
  const header = keys.map(escapeCSV).join(',');
  
  // Data rows
  const rows = samples.map(sample =>
    keys.map(key => escapeCSV(String(sample[key as keyof FreesoundSample] || ''))).join(',')
  );

  return [header, ...rows].join('\n');
}

/**
 * Convert Scrapy JSON to CSV (semicolon delimited)
 */
export function toCSVSemicolon(samples: FreesoundSample[]): string {
  if (samples.length === 0) return '';

  const keys = Object.keys(samples[0]);
  const header = keys.map(escapeCSV).join(';');
  
  const rows = samples.map(sample =>
    keys.map(key => escapeCSV(String(sample[key as keyof FreesoundSample] || ''))).join(';')
  );

  return [header, ...rows].join('\n');
}

/**
 * Convert Scrapy JSON to JSONL (JSON Lines)
 */
export function toJSONLines(samples: FreesoundSample[]): string {
  return samples.map(sample => JSON.stringify(sample)).join('\n');
}

/**
 * Convert Scrapy JSON to XML
 */
export function toXML(samples: FreesoundSample[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<freesound>\n';
  xml += `  <metadata count="${samples.length}" exported="${new Date().toISOString()}"/>\n`;
  xml += '  <samples>\n';

  for (const sample of samples) {
    xml += '    <sample>\n';
    for (const [key, value] of Object.entries(sample)) {
      const sanitized = String(value || '').replace(/[<>&'"]/g, char => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          "'": '&apos;',
          '"': '&quot;',
        };
        return entities[char] || char;
      });
      xml += `      <${key}>${sanitized}</${key}>\n`;
    }
    xml += '    </sample>\n';
  }

  xml += '  </samples>\n';
  xml += '</freesound>\n';
  return xml;
}

/**
 * Escape special characters in CSV fields
 */
function escapeCSV(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Main conversion function
 */
async function main() {
  const inputFile = process.argv[2] || './freesound-samples.json';
  const outputDir = './public/data';

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`📥 Loading ${inputFile}...`);
  
  try {
    let samples: FreesoundSample[] = [];
    
    // Load JSON
    const rawData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
    
    if (Array.isArray(rawData)) {
      samples = rawData;
    } else if (rawData.results && Array.isArray(rawData.results)) {
      samples = rawData.results;
    } else {
      throw new Error('Could not find samples in JSON structure');
    }

    console.log(`✨ Loaded ${samples.length} samples\n`);

    // Generate all formats
    const formats = {
      'CSV (Comma)': { ext: 'csv', data: toCSVComma(samples) },
      'CSV (Semicolon)': { ext: 'csv', data: toCSVSemicolon(samples) },
      'JSON': { ext: 'json', data: JSON.stringify(samples, null, 2) },
      'JSONL': { ext: 'jsonl', data: toJSONLines(samples) },
      'XML': { ext: 'xml', data: toXML(samples) },
    };

    const outputs: Record<string, string> = {};

    // CSV comma
    const csvCommaPath = path.join(outputDir, 'freesound-samples.csv');
    fs.writeFileSync(csvCommaPath, formats['CSV (Comma)'].data, 'utf-8');
    outputs['CSV (Comma)'] = csvCommaPath;
    console.log(`✅ ${csvCommaPath}`);

    // CSV semicolon
    const csvSemicolonPath = path.join(outputDir, 'freesound-samples-semicolon.csv');
    fs.writeFileSync(csvSemicolonPath, formats['CSV (Semicolon)'].data, 'utf-8');
    outputs['CSV (Semicolon)'] = csvSemicolonPath;
    console.log(`✅ ${csvSemicolonPath}`);

    // JSON
    const jsonPath = path.join(outputDir, 'freesound-samples.json');
    fs.writeFileSync(jsonPath, formats['JSON'].data, 'utf-8');
    outputs['JSON'] = jsonPath;
    console.log(`✅ ${jsonPath}`);

    // JSONL
    const jsonlPath = path.join(outputDir, 'freesound-samples.jsonl');
    fs.writeFileSync(jsonlPath, formats['JSONL'].data, 'utf-8');
    outputs['JSONL'] = jsonlPath;
    console.log(`✅ ${jsonlPath}`);

    // XML
    const xmlPath = path.join(outputDir, 'freesound-samples.xml');
    fs.writeFileSync(xmlPath, formats['XML'].data, 'utf-8');
    outputs['XML'] = xmlPath;
    console.log(`✅ ${xmlPath}`);

    console.log(`\n📊 Summary:`);
    console.log(`  Input: ${inputFile} (${samples.length} samples)`);
    console.log(`  Output directory: ${outputDir}`);
    console.log(`\n  Generated files:`);
    Object.entries(outputs).forEach(([format, file]) => {
      const size = fs.statSync(file).size;
      console.log(`    • ${format}: ${path.basename(file)} (${formatBytes(size)})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

main();
