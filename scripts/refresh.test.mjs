import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseContributions, summarizeDays, parseLeetcode, refresh } from './refresh.mjs';

function calendar({ skip = -1, broken = -1, extra = '' } = {}) {
  return Array.from({ length: 365 }, (_, i) => {
    if (i === skip) return '';
    const date = new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10);
    const count = i === 1 ? '1,234' : i === 2 ? '1' : 'No';
    return `<td data-date="${date}" id="day-${i}" data-level="${i === 1 || i === 2 ? 4 : 0}"></td>
      <tool-tip for="${i === broken ? 'wrong-id' : `day-${i}`}">${count} ${i === 2 ? 'contribution' : 'contributions'} on January 1st.</tool-tip>`;
  }).reverse().join('') + extra;
}

test('calendar handles singular, zero, comma-separated counts and out-of-order cells', () => {
  const days = parseContributions(calendar(), '2025-12-31');
  assert.equal(days[0].date, '2025-01-01');
  assert.equal(days[1].count, 1234);
  assert.equal(days[2].count, 1);
  assert.deepEqual(summarizeDays(days), { contributions: 1235, activeDays: 2, longestStreak: 2 });
});

test('calendar rejects missing dates and tooltips instead of publishing lower totals', () => {
  assert.throws(() => parseContributions(calendar({ skip: 50 }), '2025-12-31'), /missing dates/);
  assert.throws(() => parseContributions(calendar({ broken: 50 }), '2025-12-31'), /Incomplete contribution data/);
  assert.throws(() => parseContributions('<html>Service unavailable</html>', '2025-12-31'), /one year/);
});

test('calendar excludes future cells and rejects stale responses', () => {
  const extra = '<td data-date="2026-01-01" id="future" data-level="0"></td>';
  assert.equal(parseContributions(calendar({ extra }), '2025-12-31').length, 365);
  assert.throws(() => parseContributions(calendar(), '2026-01-03'), /stale/);
});

function leetcodeFixture() {
  return {
    matchedUser: {
      username: 'Sanket9326', profile: { ranking: 100 }, badges: [{ name: 'Annual Badge' }],
      submitStatsGlobal: { acSubmissionNum: [
        { difficulty: 'All', count: 10 }, { difficulty: 'Easy', count: 2 },
        { difficulty: 'Medium', count: 5 }, { difficulty: 'Hard', count: 3 },
      ] },
    },
    userContestRanking: null,
  };
}

test('unrated LeetCode users do not acquire a fabricated contest rating', () => {
  const data = parseLeetcode(leetcodeFixture());
  assert.equal(data.rating, null);
  assert.equal(data.contests, 0);
  assert.equal(data.solved, 10);
});

test('LeetCode rejects missing profiles and inconsistent difficulty totals', () => {
  assert.throws(() => parseLeetcode({ matchedUser: null }), /user missing/);
  const fixture = leetcodeFixture();
  fixture.matchedUser.submitStatsGlobal.acSubmissionNum[0].count = 100;
  assert.throws(() => parseLeetcode(fixture), /totals do not match/);
});

test('partial API failure preserves the old snapshot and updates the healthy source', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'profile-stats-test-'));
  t.after(async () => {
    for (const name of ['github', 'leetcode']) await unlink(join(directory, `${name}.json`)).catch(error => { if (error.code !== 'ENOENT') throw error; });
    await rmdir(directory);
  });
  const original = '{"updatedAt":"2025-01-01","solved":10}\n';
  await writeFile(join(directory, 'leetcode.json'), original);
  const failures = await refresh({ directory, sources: {
    github: async () => ({ updatedAt: '2025-02-01', followers: 2 }),
    leetcode: async () => { throw new Error('Service unavailable'); },
  } });
  assert.equal(failures, 1);
  assert.equal(await readFile(join(directory, 'leetcode.json'), 'utf8'), original);
  assert.equal(JSON.parse(await readFile(join(directory, 'github.json'), 'utf8')).followers, 2);
});
