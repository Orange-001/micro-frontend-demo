import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const assetsDir = path.join(root, 'dist/assets');
const failures = [];

const budgets = {
  entryJsGzip: 80 * 1024,
  chatViewJsGzip: 80 * 1024,
  vendorReactGzip: 70 * 1024,
  vendorMarkdownGzip: 220 * 1024,
  vendorAntdGzip: 380 * 1024,
  vendorMermaidGzip: 820 * 1024,
  cssGzipTotal: 80 * 1024,
};

function fail(message) {
  failures.push(message);
}

function gzipSize(filePath) {
  return zlib.gzipSync(fs.readFileSync(filePath), { level: 9 }).length;
}

if (!fs.existsSync(assetsDir)) {
  fail('dist/assets does not exist. Run pnpm build first.');
} else {
  const files = fs.readdirSync(assetsDir);
  const jsFiles = files.filter((file) => file.endsWith('.js'));
  const cssFiles = files.filter((file) => file.endsWith('.css'));

  const checks = [
    ['entryJsGzip', jsFiles.find((file) => /^index-.*\.js$/.test(file))],
    ['chatViewJsGzip', jsFiles.find((file) => /^ChatView-.*\.js$/.test(file))],
    ['vendorReactGzip', jsFiles.find((file) => /^vendor-react-.*\.js$/.test(file))],
    ['vendorMarkdownGzip', jsFiles.find((file) => /^vendor-markdown-.*\.js$/.test(file))],
    ['vendorAntdGzip', jsFiles.find((file) => /^vendor-antd-.*\.js$/.test(file))],
    ['vendorMermaidGzip', jsFiles.find((file) => /^vendor-mermaid-.*\.js$/.test(file))],
  ];

  for (const [budgetName, file] of checks) {
    if (!file) {
      fail(`missing expected bundle for ${budgetName}`);
      continue;
    }
    const size = gzipSize(path.join(assetsDir, file));
    if (size > budgets[budgetName]) {
      fail(`${file} gzip ${size} exceeds budget ${budgets[budgetName]}`);
    }
  }

  const cssTotal = cssFiles.reduce((sum, file) => sum + gzipSize(path.join(assetsDir, file)), 0);
  if (cssTotal > budgets.cssGzipTotal) {
    fail(`total css gzip ${cssTotal} exceeds budget ${budgets.cssGzipTotal}`);
  }
}

if (failures.length) {
  console.error('[bundle-budget-check] failed');
  failures.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('[bundle-budget-check] ok');
