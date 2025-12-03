/*scripts/mt_golden_test.mjs*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import './dom-shim.mjs';

// import your brain (ensure your bundler/aliases allow this path)
import { getResponse } from '../src/modes/mathTips/grampyBrainV2.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const golden = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/modes/mathTips/tests/golden.json'),'utf8'));

let pass = 0, fail = 0;
for (const [input, expectRe] of golden) {
  const out = getResponse(input) || '';
  const ok = new RegExp(expectRe, 'i').test(String(out));
  if (ok) pass++; else {
    fail++;
    console.log('❌', input, '\n   got:', out, '\n   exp:', expectRe, '\n');
  }
}
console.log(`✅ ${pass} passed, ❌ ${fail} failed, total ${pass+fail}`);
process.exit(fail ? 1 : 0);
