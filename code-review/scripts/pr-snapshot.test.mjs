import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { capture, treeDelta, staleEvidence, validatePrior } from './pr-snapshot.mjs';

const sha = n => n.toString(16).padStart(40, '0');
const blob = (p, n, mode = '100644') => ({ path: p, sha: sha(n), type: 'blob', mode });
const prior = { schema: 1, complete: true, repo: 'owner/repo', pr: 7, url: 'https://github.com/owner/repo/pull/7',
  head: sha(1), base: sha(2), mergeBase: sha(3) };
const scratch = fs.mkdtempSync(path.join(process.cwd(), '.snapshot-tests-'));
process.on('exit', () => fs.rmSync(scratch, { recursive: true, force: true }));

function fakeGh({ drift = false, truncated = false, fail = false, missing = false, threadPages = 1, threadError = false } = {}) {
  const calls = [];
  let reads = 0, threads = 0;
  const invoke = args => {
    calls.push(args);
    const url = args[4] === 'GET' ? args[5] : args[3];
    if (fail) throw new Error('HTTP 403: Resource not accessible');
    if (args[1] === 'graphql') {
      if (threadError) return JSON.stringify({ errors: [{ message: 'Forbidden' }] });
      threads++;
      return JSON.stringify({ data: { repository: { pullRequest: {
      reviewThreads: { nodes: [{ id: 'thread', comments: { nodes: [{ databaseId: 1 }] } }],
        pageInfo: { hasNextPage: threads < threadPages, endCursor: `cursor-${threads}` } }
    } } } });
    }
    assert.equal(args[1], '--method');
    assert.equal(args[2], 'GET');
    if (url.endsWith('/pulls/7')) {
      reads++;
      return JSON.stringify({ head: { sha: drift && reads > 1 ? sha(9) : sha(4) }, base: { sha: sha(2) }, commits: 1, html_url: prior.url });
    }
    if (url.includes('/compare/')) return args.includes('application/vnd.github.diff') ? 'diff --git a/a b/a\n' :
      JSON.stringify({ merge_base_commit: { sha: sha(3) } });
    if (url.includes('/git/trees/')) {
      const entries = url.includes(sha(4)) ? [blob('a', 8), blob('new', 9)] :
        url.includes(sha(1)) ? [blob('a', 6), blob('removed', 7)] : [blob('a', 5)];
      return JSON.stringify({ tree: entries, truncated });
    }
    if (url.includes('/git/blobs/')) return JSON.stringify({ encoding: 'base64', content: 'YQ==' });
    if (url.includes('/check-runs')) return JSON.stringify(missing ? [{}] : [{ total_count: 0, check_runs: [] }]);
    return JSON.stringify([[], [{ id: 123 }]]);
  };
  return { invoke, calls };
}

test('two-endpoint delta handles force-push, deletions, additions and executable modes', () => {
  const changes = treeDelta([blob('same', 1), blob('old', 2), blob('mode', 3)],
    [blob('same', 1), blob('new', 2), blob('mode', 3, '100755')]);
  assert.deepEqual(changes.map(x => x.path), ['mode', 'new', 'old']);
});
test('prior identity cannot cross PR/repository or incomplete snapshots', () => {
  validatePrior(prior, 'OWNER/repo', 7);
  for (const value of [{ ...prior, complete: false }, { ...prior, pr: 8 }, { ...prior, repo: 'other/repo' }]) {
    assert.throws(() => validatePrior(value, 'owner/repo', 7));
  }
});
test('staleness distinguishes base changes, relevant paths and conservative default', () => {
  assert.equal(staleEvidence(prior, prior, [{ path: 'a' }], ['b']).stale, false);
  assert.equal(staleEvidence(prior, prior, [{ path: 'a' }], ['a']).stale, true);
  assert.equal(staleEvidence(prior, prior, [{ path: 'a' }], []).stale, true);
  assert.equal(staleEvidence(prior, { ...prior, base: sha(9) }, [], ['a']).stale, true);
});
test('capture pins full diff and computes a distinct exact update delta offline', () => {
  const previous = path.join(scratch, 'prior.json');
  fs.writeFileSync(previous, JSON.stringify(prior));
  const fake = fakeGh({ threadPages: 2 });
  const summary = capture({ repo: 'owner/repo', pr: 7, output: scratch, previous, relevant: ['removed'] }, fake.invoke);
  const manifest = JSON.parse(fs.readFileSync(summary.manifest));
  assert.equal(manifest.complete, true);
  assert.deepEqual(manifest.changedPaths, ['a', 'new']);
  assert.deepEqual(manifest.deltaPaths, ['a', 'new', 'removed']);
  assert.equal(manifest.previousHead, sha(1));
  assert.equal(manifest.staleEvidence.stale, true);
  assert.ok(fake.calls.some(args => args.includes('--paginate')));
  assert.equal(fake.calls.filter(args => args[1] === 'graphql').length, 2);
  assert.ok(fake.calls.some(args => args.includes('cursor=cursor-1')));
  assert.equal(JSON.parse(fs.readFileSync(manifest.artifacts['review-comments.json'].path)).flat().length, 1);
  assert.ok(Object.keys(manifest.artifacts).some(name => name.startsWith('blob-')));
});
test('head drift, truncated trees, permissions and missing checks never publish a manifest', () => {
  for (const options of [{ drift: true }, { truncated: true }, { fail: true }, { missing: true }, { threadError: true }]) {
    const output = fs.mkdtempSync(path.join(scratch, 'failure-'));
    assert.throws(() => capture({ repo: 'owner/repo', pr: 7, output }, fakeGh(options).invoke));
    for (const child of fs.readdirSync(output)) {
      assert.equal(fs.existsSync(path.join(output, child, 'manifest.json')), false);
      assert.equal(fs.existsSync(path.join(output, child, 'failure.json')), true);
    }
  }
});
test('unrelated previous identity is rejected before any network call', () => {
  const previous = path.join(scratch, 'wrong.json');
  fs.writeFileSync(previous, JSON.stringify({ ...prior, pr: 8 }));
  let calls = 0;
  assert.throws(() => capture({ repo: 'owner/repo', pr: 7, output: scratch, previous }, () => calls++));
  assert.equal(calls, 0);
});
test('same owner/repo number on a different GitHub host is not valid prior evidence', () => {
  const previous = path.join(scratch, 'other-host.json');
  fs.writeFileSync(previous, JSON.stringify({ ...prior, url: 'https://elsewhere/owner/repo/pull/7' }));
  assert.throws(() => capture({ repo: 'owner/repo', pr: 7, output: scratch, previous }, fakeGh().invoke));
});
