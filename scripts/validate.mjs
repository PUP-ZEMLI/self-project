import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';

const root = resolve(import.meta.dirname, '..');
const htmlFiles = ['index.html', 'cases/ags/index.html'];
const styleFiles = ['style.css', 'components.css', 'cases/ags/styles.css'];
const scriptFiles = ['script.js', 'cases/ags/script.js'];
const failures = [];

for (const relativeFile of htmlFiles) {
  const filePath = resolve(root, relativeFile);
  const html = await readFile(filePath, 'utf8');

  if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) failures.push(`${relativeFile}: inline script found`);
  if (/<style(?:\s|>)/i.test(html)) failures.push(`${relativeFile}: inline style block found`);
  if (/\son[a-z]+\s*=/i.test(html)) failures.push(`${relativeFile}: inline event handler found`);

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) failures.push(`${relativeFile}: duplicate ids: ${[...new Set(duplicates)].join(', ')}`);

  for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    const reference = match[1];
    if (/^(?:#|https?:|mailto:|tel:|data:)/i.test(reference)) continue;
    const cleanReference = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
    const target = resolve(dirname(filePath), cleanReference);
    try {
      await access(target);
    } catch {
      failures.push(`${relativeFile}: missing resource ${reference}`);
    }
  }

  for (const match of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)) {
    if (!/\brel="[^"]*noopener[^"]*"/i.test(match[0])) {
      failures.push(`${relativeFile}: target="_blank" without rel="noopener"`);
    }
  }
}

for (const relativeFile of styleFiles) {
  const filePath = resolve(root, relativeFile);
  const css = await readFile(filePath, 'utf8');

  for (const match of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
    const reference = match[2].trim();
    if (!reference || /^(?:data:|https?:|#)/i.test(reference)) continue;
    const cleanReference = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
    const target = resolve(dirname(filePath), cleanReference);
    try {
      await access(target);
    } catch {
      failures.push(`${relativeFile}: missing CSS resource ${reference}`);
    }
  }
}

for (const relativeFile of scriptFiles) {
  const source = await readFile(resolve(root, relativeFile), 'utf8');
  if (/\b(?:eval|Function)\s*\(/.test(source)) failures.push(`${relativeFile}: dynamic code execution found`);
  if (/\.(?:innerHTML|outerHTML)\s*=|insertAdjacentHTML\s*\(/.test(source)) {
    failures.push(`${relativeFile}: unsafe HTML injection API found`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Validation passed: resources, markup, and script safety checks are clean.');
}
