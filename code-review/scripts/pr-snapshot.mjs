#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, shell: false });
  if (result.error || result.status !== 0) throw new Error(`${command} failed: ${result.error?.message || result.stderr}`);
  return result.stdout;
}

export function gh(args) { return run('gh', args); }

export function treeDelta(before, after) {
  const left = new Map(before.filter(x => x.type !== 'tree').map(x => [x.path, x]));
  const right = new Map(after.filter(x => x.type !== 'tree').map(x => [x.path, x]));
  return [...new Set([...left.keys(), ...right.keys()])].sort().flatMap(p => {
    const a = left.get(p), b = right.get(p);
    return a?.sha === b?.sha && a?.mode === b?.mode ? [] :
      [{ path: p, before: a || null, after: b || null }];
  });
}

export function validatePrior(prior, repo, pr) {
  if (prior.schema !== 1 || prior.complete !== true || typeof prior.repo !== 'string' || prior.repo.toLowerCase() !== repo.toLowerCase() ||
      prior.pr !== pr || !/^[0-9a-f]{40}$/.test(prior.head)) {
    throw new Error('Prior snapshot is incomplete or belongs to another PR');
  }
}

export function staleEvidence(prior, current, delta, relevant) {
  if (prior.base !== current.base || prior.mergeBase !== current.mergeBase) {
    return { stale: true, reason: 'base comparison changed; revalidate all evidence', paths: relevant };
  }
  const changed = delta.map(x => x.path);
  return { stale: relevant.length ? relevant.some(p => changed.includes(p)) : changed.length > 0,
    reason: relevant.length ? 'exact relevant-path intersection; dependencies must be supplied explicitly' :
      'no relevance list supplied; conservatively invalidate on any head-tree change',
    paths: relevant.length ? changed.filter(p => relevant.includes(p)) : changed };
}

export function capture({ repo, pr, output, previous, relevant = [] }, invoke = gh) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo) || !Number.isSafeInteger(pr) || pr < 1) {
    throw new Error('Explicit --repo owner/repo and positive --pr required');
  }
  const prior = previous ? JSON.parse(fs.readFileSync(previous, 'utf8')) : null;
  if (prior) validatePrior(prior, repo, pr);
  const root = path.resolve(output);
  // Evidence must never be written into a checkout, including the personal-skills repository.
  let ancestor = root;
  while (true) {
    if (fs.existsSync(path.join(ancestor, '.git'))) throw new Error('Output must be outside every Git checkout');
    const parent = path.dirname(ancestor);
    if (parent === ancestor) break;
    ancestor = parent;
  }
  fs.mkdirSync(root, { recursive: true });
  const dir = fs.mkdtempSync(path.join(root, 'pr-snapshot-'));
  const artifacts = {};
  function save(name, content) {
    const target = path.join(dir, name);
    fs.writeFileSync(target, content);
    artifacts[name] = { path: target, sha256: crypto.createHash('sha256').update(content).digest('hex') };
    return target;
  }
  function api(name, endpoint, paginated = false, accept) {
    const args = ['api', '--method', 'GET', endpoint];
    if (paginated) args.push('--paginate', '--slurp');
    if (accept) args.push('-H', `Accept: ${accept}`);
    const raw = invoke(args);
    save(name, raw);
    if (accept) return raw;
    const value = JSON.parse(raw);
    if (value?.errors) throw new Error(`API errors in ${name}: ${JSON.stringify(value.errors)}`);
    return value;
  }
  try {
  const endpoint = `repos/${repo}`;
  const initial = api('pr-start.json', `${endpoint}/pulls/${pr}`);
  if (typeof initial.html_url !== 'string') throw new Error('Missing canonical PR URL identity');
  if (prior && prior.url !== initial.html_url) throw new Error('Prior snapshot belongs to a different PR URL/host');
  const head = initial.head.sha, base = initial.base.sha;
  if (![head, base].every(x => /^[0-9a-f]{40}$/.test(x))) throw new Error('Missing pinned commit identities');
  const comparison = api('comparison.json', `${endpoint}/compare/${base}...${head}`);
  const mergeBase = comparison.merge_base_commit?.sha;
  if (!/^[0-9a-f]{40}$/.test(mergeBase)) throw new Error('Missing merge base');
  const trees = new Map();
  function tree(sha) {
    if (trees.has(sha)) return trees.get(sha);
    const value = api(`tree-${sha}.json`, `${endpoint}/git/trees/${sha}?recursive=1`);
    if (value.truncated || !Array.isArray(value.tree)) throw new Error(`Incomplete recursive tree for ${sha}`);
    trees.set(sha, value.tree);
    return value.tree;
  }
  const changes = treeDelta(tree(mergeBase), tree(head));
  api('pr.diff', `${endpoint}/compare/${base}...${head}`, false, 'application/vnd.github.diff');
  const delta = prior ? treeDelta(tree(prior.head), tree(head)) : null;
  if (delta) {
    // A tree comparison is two-endpoint semantics even after a force push.
    // Preserve both blob contents instead of mistaking GitHub's three-dot diff for the delta.
    for (const item of delta) {
      for (const entry of [item.before, item.after]) {
        if (entry?.type === 'blob' && !artifacts[`blob-${entry.sha}.json`]) {
          const blob = api(`blob-${entry.sha}.json`, `${endpoint}/git/blobs/${entry.sha}`);
          if (blob.encoding !== 'base64' || typeof blob.content !== 'string') throw new Error('Incomplete blob response');
        }
      }
    }
    save('delta.json', JSON.stringify(delta, null, 2));
  }
  save('changed-paths.json', JSON.stringify(changes, null, 2));
  function pages(name, url, collection) {
    const values = api(name, url, true);
    if (!Array.isArray(values) || !values.length ||
        !values.every(value => Array.isArray(collection ? value?.[collection] : value))) {
      throw new Error(`Missing paginated collection in ${name}`);
    }
    if (collection && values.flatMap(v => v[collection]).length !== values[0].total_count) {
      throw new Error(`Incomplete or drifting collection in ${name}`);
    }
    return values;
  }
  pages('issue-comments.json', `${endpoint}/issues/${pr}/comments?per_page=100`);
  pages('review-comments.json', `${endpoint}/pulls/${pr}/comments?per_page=100`);
  pages('reviews.json', `${endpoint}/pulls/${pr}/reviews?per_page=100`);
  const commits = pages('commits.json', `${endpoint}/pulls/${pr}/commits?per_page=100`);
  if (!Number.isInteger(initial.commits) || commits.flat().length !== initial.commits) {
    throw new Error('Incomplete PR commit list (GitHub limits this endpoint to 250 commits)');
  }
  pages('check-runs.json', `${endpoint}/commits/${head}/check-runs?per_page=100&filter=all`, 'check_runs');
  pages('statuses.json', `${endpoint}/commits/${head}/statuses?per_page=100`);
  const [owner, name] = repo.split('/');
  let cursor = null, page = 0;
  const cursors = new Set();
  do {
    const query = `query($owner:String!,$name:String!,$pr:Int!,$cursor:String){
      repository(owner:$owner,name:$name){pullRequest(number:$pr){
        reviewThreads(first:100,after:$cursor){nodes{id isResolved isOutdated path line
          comments(first:1){nodes{databaseId url} pageInfo{hasNextPage}}}
          pageInfo{hasNextPage endCursor}}}}}`;
    const args = ['api', 'graphql', '-f', `query=${query}`, '-f', `owner=${owner}`, '-f', `name=${name}`, '-F', `pr=${pr}`];
    if (cursor) args.push('-f', `cursor=${cursor}`);
    const raw = invoke(args);
    save(`threads-${page++}.json`, raw);
    const response = JSON.parse(raw);
    if (response.errors) throw new Error(`Thread access failed: ${JSON.stringify(response.errors)}`);
    const connection = response.data?.repository?.pullRequest?.reviewThreads;
    if (!connection?.nodes || !connection.pageInfo) throw new Error('Missing review thread access');
    // Full review comments (including replies) are paginated through REST above.
    cursor = connection.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null;
    if (connection.pageInfo.hasNextPage && !cursor) throw new Error('Missing thread pagination cursor');
    if (cursor && cursors.has(cursor)) throw new Error('Repeated thread pagination cursor');
    if (cursor) cursors.add(cursor);
  } while (cursor);
  const final = api('pr-end.json', `${endpoint}/pulls/${pr}`);
  if (final.head.sha !== head || final.base.sha !== base) throw new Error('PR head/base drifted during capture; retry');
  const current = { base, mergeBase };
  const manifest = { schema: 1, complete: true, repo, pr, url: initial.html_url, head, base, mergeBase,
    capturedAt: new Date().toISOString(), semantics: {
      full: 'merge-base(base, head) to head (three-dot PR diff)',
      delta: prior ? 'previous head tree to current head tree (two endpoints; renames are delete/add)' : null },
    previous: previous ? path.resolve(previous) : null, previousHead: prior?.head || null,
    headIdentityChanged: prior ? prior.head !== head : null,
    changedPaths: changes.map(x => x.path), deltaPaths: delta?.map(x => x.path) ?? null,
    staleEvidence: prior ? staleEvidence(prior, current, delta, relevant) : null,
    artifacts, limitations: ['Comments/checks are a capture interval, not a transactional GitHub snapshot.',
      'Tree/blob identity proves content, not runtime behavior or implementation attribution.',
      'Relevant paths are exact; callers, tests, contracts and instructions must be explicitly included.'] };
  const manifestPath = path.join(dir, 'manifest.json');
  fs.writeFileSync(`${manifestPath}.pending`, JSON.stringify(manifest, null, 2));
  fs.renameSync(`${manifestPath}.pending`, manifestPath);
  return { complete: true, repo, pr, head, base, mergeBase, manifest: manifestPath,
    changedPathCount: changes.length, deltaPathCount: delta?.length ?? null,
    staleEvidence: manifest.staleEvidence };
  } catch (error) {
    const failure = path.join(dir, 'failure.json');
    fs.writeFileSync(failure, JSON.stringify({ complete: false, error: error.message }, null, 2));
    throw new Error(`Capture failed; see ${failure}`);
  }
}

export function main(args) {
  const options = { relevant: [] };
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (!['--repo', '--pr', '--output', '--previous', '--relevant-path'].includes(key) || !args[i + 1]) {
      throw new Error('Usage: node pr-snapshot.mjs --repo owner/repo --pr N --output artifact-directory [--previous manifest.json] [--relevant-path path]');
    }
    const value = args[++i];
    if (key === '--relevant-path') options.relevant.push(value);
    else options[key.slice(2)] = key === '--pr' ? Number(value) : value;
  }
  if (!options.output) throw new Error('--output outside a checkout is required');
  return capture(options);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { console.log(JSON.stringify(main(process.argv.slice(2)))); }
  catch (error) { console.error(JSON.stringify({ complete: false, error: error.message })); process.exitCode = 1; }
}
