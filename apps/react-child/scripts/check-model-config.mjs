import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const configSource = fs.readFileSync(path.join(root, 'src/store/configSlice.ts'), 'utf8');
const providersSource = fs.readFileSync(path.join(root, 'src/constants/providers.ts'), 'utf8');
const streamingSource = fs.readFileSync(path.join(root, 'src/services/streamingService.ts'), 'utf8');

const failures = [];

function fail(message) {
  failures.push(message);
}

function numberField(name) {
  const match = configSource.match(new RegExp(`${name}:\\s*([0-9.]+)`));
  return match ? Number(match[1]) : null;
}

const temperature = numberField('temperature');
const maxTokens = numberField('maxTokens');
const topP = numberField('topP');

if (temperature === null || temperature < 0 || temperature > 2) {
  fail(`temperature must be within 0..2, got ${temperature}`);
}
if (maxTokens === null || maxTokens < 256 || maxTokens > 128000) {
  fail(`maxTokens must be within 256..128000, got ${maxTokens}`);
}
if (topP === null || topP <= 0 || topP > 1) {
  fail(`topP must be within (0, 1], got ${topP}`);
}

for (const provider of ['openrouter', 'openai', 'custom']) {
  if (!providersSource.includes(`${provider}:`)) fail(`provider preset missing: ${provider}`);
}

if (!streamingSource.includes('stream: true')) fail('chat completion request must enable stream:true');
if (!streamingSource.includes('DEFAULT_REQUEST_TIMEOUT')) fail('request timeout constant is missing');
if (!streamingSource.includes('DEFAULT_STREAM_IDLE_TIMEOUT')) fail('stream idle timeout constant is missing');
if (!streamingSource.includes('MAX_REQUEST_RETRIES')) fail('retry limit constant is missing');
if (!streamingSource.includes('reasoning_effort')) fail('reasoning mode should be explicit');

if (failures.length) {
  console.error('[model-config-check] failed');
  failures.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('[model-config-check] ok');
