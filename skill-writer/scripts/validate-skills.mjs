#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { parseDocument } from 'yaml';

export function skillFiles(root) {
  const absolute = path.resolve(root);
  if (!fs.statSync(absolute).isDirectory()) return [absolute];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap(entry => {
    if (['.git', 'node_modules'].includes(entry.name)) return [];
    const p = path.join(absolute, entry.name);
    return entry.isDirectory() ? skillFiles(p) : entry.name === 'SKILL.md' ? [p] : [];
  });
}

function withoutFences(text) {
  let fence = null;
  return text.split(/\r?\n/).filter(line => {
    if (fence) {
      const closing = line.match(/^ {0,3}(`+|~+)\s*$/);
      if (closing && closing[1][0] === fence[0] && closing[1].length >= fence.length) fence = null;
      return false;
    }
    const opening = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (opening) { fence = opening[1]; return false; }
    return true;
  }).join('\n');
}

export function localLinks(text) {
  const body = withoutFences(text).replace(/(`+)[\s\S]*?\1/g, '');
  const links = [...body.matchAll(/!?\[[^\]]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+["'][^)]*)?\s*\)/g)].map(m => m[1]);
  links.push(...[...body.matchAll(/^\s{0,3}\[[^\]]+\]:\s*(<[^>]+>|\S+)/gm)].map(m => m[1]));
  return links.map(x => x.replace(/^<|>$/g, '').split('#')[0].split('?')[0])
    .filter(x => x && !/^[a-z][a-z0-9+.-]*:/i.test(x) && !x.startsWith('//'))
    .map(x => decodeURIComponent(x));
}

export function inspect(file) {
  const errors = [];
  let text, metadata;
  try {
    text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!match) throw new Error('Missing YAML frontmatter delimiters');
    const document = parseDocument(match[1], { uniqueKeys: true });
    if (document.errors.length) throw new Error(document.errors.map(e => e.message).join('; '));
    metadata = document.toJS();
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new Error('Frontmatter must be a mapping');
    if (typeof metadata.name !== 'string' || metadata.name.length > 64 ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.name)) errors.push('name must be lowercase hyphenated text, 1–64 characters');
    if (typeof metadata.description !== 'string' || !metadata.description.trim() ||
        metadata.description.length > 1024) errors.push('description must be nonempty text, max 1024 characters');
    for (const link of localLinks(text.slice(match[0].length))) {
      if (!fs.existsSync(path.resolve(path.dirname(file), link))) errors.push(`Missing resource: ${link}`);
    }
  } catch (error) { errors.push(error.message); }
  return { path: path.resolve(file), name: metadata?.name, errors };
}

function canonical(p) {
  const target = path.basename(p).toLowerCase() === 'skill.md' ? p : path.join(p, 'SKILL.md');
  const absolute = fs.existsSync(target) ? fs.realpathSync(target) : path.resolve(target);
  return process.platform === 'win32' ? absolute.toLowerCase() : absolute;
}

export function validate(files, discovery) {
  const results = [...new Set(files.map(p => path.resolve(p)))].map(inspect);
  const names = new Map();
  for (const result of results) {
    if (typeof result.name !== 'string') continue;
    const previous = names.get(result.name);
    if (previous) {
      result.errors.push(`Duplicate name ${result.name}: ${previous.path}`);
      previous.errors.push(`Duplicate name ${result.name}: ${result.path}`);
    } else names.set(result.name, result);
    if (discovery && !discovery.some(d => d.name === result.name && d.enabled !== false &&
        typeof d.path === 'string' && canonical(d.path) === canonical(result.path))) {
      result.errors.push(`CLI discovery mismatch: exact enabled path not found for ${result.name}`);
    }
  }
  return { valid: results.every(r => !r.errors.length), skills: results };
}

export function main(args) {
  let changed, discovery = false;
  const roots = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--changed' && args[i + 1]) changed = path.resolve(args[++i]);
    else if (args[i] === '--discover') discovery = true;
    else if (args[i] === '--root' && args[i + 1]) roots.push(args[++i]);
    else throw new Error('Usage: node validate-skills.mjs [--changed git-root] [--root skill-file-or-directory ...] [--discover]');
  }
  const execute = (command, argv, cwd) => {
    const result = spawnSync(command, argv, { cwd, encoding: 'utf8', shell: false });
    if (result.error || result.status !== 0) throw new Error(`${command}: ${result.error?.message || result.stderr}`);
    if (result.stderr) process.stderr.write(result.stderr);
    return result.stdout;
  };
  let files = roots.flatMap(skillFiles);
  if (changed) {
    const tracked = execute('git', ['diff', '--name-only', '-z', 'HEAD', '--'], changed);
    const untracked = execute('git', ['ls-files', '--others', '--exclude-standard', '-z'], changed);
    for (const relative of (tracked + untracked).split('\0').filter(Boolean)) {
      let p = path.resolve(changed, relative);
      if (!fs.existsSync(p)) continue;
      while (p.startsWith(changed + path.sep) || p === changed) {
        const skill = path.join(p, 'SKILL.md');
        if (fs.existsSync(skill)) { files.push(skill); break; }
        const parent = path.dirname(p);
        if (parent === p) break;
        p = parent;
      }
    }
  }
  if (!files.length) throw new Error('No selected existing skill files');
  const discovered = discovery ? JSON.parse(execute('copilot', ['skill', 'list', '--json'])) : undefined;
  if (discovered && !Array.isArray(discovered)) throw new Error('Unsupported CLI discovery JSON; expected an array with names and paths');
  return validate(files, discovered);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = main(process.argv.slice(2));
    console.log(JSON.stringify(result, null, 2));
    if (!result.valid) process.exitCode = 1;
  } catch (error) { console.error(JSON.stringify({ valid: false, error: error.message })); process.exitCode = 1; }
}
