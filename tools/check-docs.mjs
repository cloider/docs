#!/usr/bin/env node
// Checks the docs for what the Docusaurus build doesn't: the project's writing rules
// (WRITING.md), screenshots that don't exist yet and pages SITEMAP.md promises.
// The build itself already fails on broken links and anchors.
//
//   node tools/check-docs.mjs            report everything
//   node tools/check-docs.mjs --strict   exit 1 on any error (for CI)

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import yaml from 'js-yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(root, 'docs');
const staticDir = path.join(root, 'static');
const strict = process.argv.includes('--strict');

const errors = [];
const warnings = [];
const rel = (file) => path.relative(root, file);

function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.mdx?$/.test(entry.name) ? [full] : [];
  });
}

function frontMatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2].replace(/^['"]|['"]$/g, '');
  }
  return {fields, body: text.slice(match[0].length)};
}

const pages = walk(docsDir);
const screenshots = new Map();

for (const file of pages) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n');

  // em and en dashes are banned everywhere, per services/CLAUDE.md
  lines.forEach((line, i) => {
    if (/[—–]/.test(line)) errors.push(`${rel(file)}:${i + 1} em or en dash: ${line.trim().slice(0, 80)}`);
  });

  const fm = frontMatter(text);
  if (!fm) {
    errors.push(`${rel(file)} has no front matter`);
    continue;
  }
  // an unquoted value with ": " in it breaks the whole build without naming the file
  try {
    yaml.load(text.match(/^---\n([\s\S]*?)\n---\n/)[1]);
  } catch (e) {
    errors.push(`${rel(file)} front matter isn't valid YAML (quote values that contain ": "): ${e.message.split('\n')[0]}`);
  }
  const {fields, body} = fm;
  for (const key of ['title', 'description']) {
    if (!fields[key]) errors.push(`${rel(file)} front matter has no ${key}`);
  }
  if (fields.title && fields.title.length > 70) warnings.push(`${rel(file)} title is ${fields.title.length} characters, aim for 60`);
  if (fields.description) {
    const n = fields.description.length;
    if (n < 80 || n > 200) warnings.push(`${rel(file)} description is ${n} characters, aim for 120 to 160`);
  }
  if (!/^keywords:/m.test(text.slice(0, 2000))) warnings.push(`${rel(file)} front matter has no keywords`);

  // the title comes from front matter, so the page actions sit under it
  let inFence = false;
  body.split('\n').forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (!inFence && /^# /.test(line)) warnings.push(`${rel(file)} has an H1 in the body: ${line.trim()}`);
    if (!inFence && /<!--/.test(line)) errors.push(`${rel(file)} uses an HTML comment, MDX needs {/* */}`);
  });

  for (const m of text.matchAll(/src(?:=|:\s*)["'](\/img\/[^"']+)["']/g)) {
    const list = screenshots.get(m[1]) ?? [];
    list.push(rel(file));
    screenshots.set(m[1], list);
  }
  for (const m of text.matchAll(/!\[[^\]]*\]\((\/img\/[^)\s]+)\)/g)) {
    const list = screenshots.get(m[1]) ?? [];
    list.push(rel(file));
    screenshots.set(m[1], list);
  }
}

const missingImages = [...screenshots].filter(([src]) => !fs.existsSync(path.join(staticDir, src)));
for (const [src, files] of missingImages) {
  warnings.push(`missing image ${src} (used in ${[...new Set(files)].join(', ')})`);
}

// every page SITEMAP.md promises
const sitemap = fs.readFileSync(path.join(root, 'SITEMAP.md'), 'utf8');
let section = '';
for (const line of sitemap.split('\n')) {
  const heading = line.match(/^## (.+)$/);
  if (heading) section = heading[1] === 'Root' ? '' : heading[1].replace(/\/$/, '');
  const item = line.match(/^- `([^`]+\.mdx)`/);
  if (item) {
    const file = path.join(docsDir, section, item[1]);
    if (!fs.existsSync(file)) errors.push(`SITEMAP.md page missing: ${rel(file)}`);
  }
}

for (const w of warnings) console.log(`warning  ${w}`);
for (const e of errors) console.log(`error    ${e}`);
console.log(`\n${pages.length} pages, ${screenshots.size} images referenced (${missingImages.length} missing), ${errors.length} errors, ${warnings.length} warnings`);
if (strict && errors.length) process.exit(1);
