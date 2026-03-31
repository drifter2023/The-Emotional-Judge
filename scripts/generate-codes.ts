/**
 * 兑换码生成脚本
 * 生成 trial/basic/standard 三种类型的 UUID v4 兑换码
 *
 * Usage:
 *   npx tsx scripts/generate-codes.ts [count]
 *   npx tsx scripts/generate-codes.ts 100
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'node:crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CodeRecord {
  type: 'trial' | 'basic' | 'standard';
  totalCredits: number;
  usedCredits: number;
  status: 'active' | 'used' | 'expired';
  createdAt: string;
  lastUsedAt: string | null;
}

interface GeneratedCode {
  code: string;
  record: CodeRecord;
}

const TIER_CREDITS: Record<string, number> = {
  trial: 1,
  basic: 3,
  standard: 10,
};

function generateCodes(
  type: 'trial' | 'basic' | 'standard',
  count: number
): GeneratedCode[] {
  const codes: GeneratedCode[] = [];
  const seen = new Set<string>();
  const now = new Date().toISOString();
  const credits = TIER_CREDITS[type];

  while (codes.length < count) {
    const code = crypto.randomUUID();
    if (seen.has(code)) continue;
    seen.add(code);

    codes.push({
      code,
      record: {
        type,
        totalCredits: credits,
        usedCredits: 0,
        status: 'active',
        createdAt: now,
        lastUsedAt: null,
      },
    });
  }

  return codes;
}

function main() {
  const args = process.argv.slice(2);
  const count = parseInt(args.find((a) => !a.startsWith('--')) || '10');

  console.log(`Generating ${count} codes per tier...\n`);

  const trialCodes = generateCodes('trial', count);
  const basicCodes = generateCodes('basic', count);
  const standardCodes = generateCodes('standard', count);

  const allCodes = [...trialCodes, ...basicCodes, ...standardCodes];

  const outputDir = path.join(__dirname, '../output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const dateStr = new Date().toISOString().split('T')[0];

  // JSON (for bulk KV upload)
  const jsonFile = path.join(outputDir, `codes_${count}_${dateStr}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify(allCodes, null, 2));

  // CSV
  const csvFile = path.join(outputDir, `codes_${count}_${dateStr}.csv`);
  const csvContent = [
    'code,type,credits,createdAt',
    ...allCodes.map(
      (c) =>
        `${c.code},${c.record.type},${c.record.totalCredits},${c.record.createdAt}`
    ),
  ].join('\n');
  fs.writeFileSync(csvFile, csvContent);

  // KV bulk upload format (for wrangler kv:bulk put)
  const kvFile = path.join(outputDir, `kv_bulk_${count}_${dateStr}.json`);
  const kvEntries = allCodes.map((c) => ({
    key: `code:${c.code}`,
    value: JSON.stringify(c.record),
  }));
  fs.writeFileSync(kvFile, JSON.stringify(kvEntries, null, 2));

  // Links by tier
  const baseUrl = 'https://the-emotional-judge.pages.dev/?code=';
  const tiers = { trial: trialCodes, basic: basicCodes, standard: standardCodes };
  for (const [type, codes] of Object.entries(tiers)) {
    const linksFile = path.join(outputDir, `links_${type}_${dateStr}.txt`);
    fs.writeFileSync(linksFile, codes.map((c) => `${baseUrl}${c.code}`).join('\n'));
  }

  console.log('Done!\n');
  console.log(`Trial (1 use):    ${trialCodes.length} codes`);
  console.log(`Basic (3 uses):   ${basicCodes.length} codes`);
  console.log(`Standard (10 uses): ${standardCodes.length} codes`);
  console.log(`Total: ${allCodes.length} codes\n`);
  console.log(`Files:`);
  console.log(`  JSON:     ${jsonFile}`);
  console.log(`  CSV:      ${csvFile}`);
  console.log(`  KV bulk:  ${kvFile}`);
  console.log(`  Links:    ${outputDir}/links_*.txt`);
}

main();
