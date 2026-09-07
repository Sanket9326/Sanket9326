import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const username = 'Sanket9326';
const dayMs = 86_400_000;

async function request(url, options = {}) {
  let failure;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: { 'User-Agent': 'Sanket9326-profile-stats', ...options.headers },
        signal: AbortSignal.timeout(25_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} from ${new URL(url).hostname}`);
      return response;
    } catch (error) {
      failure = error;
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw failure;
}

function integer(value, label) {
  if (!Number.isInteger(value) || value < 0) throw new Error(`Invalid ${label}`);
  return value;
}

// Public calendar: no personal token required. Fail closed if upstream markup changes.
export function parseContributions(html, today = new Date().toISOString().slice(0, 10)) {
  const counts = new Map();
  for (const match of html.matchAll(/<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/g)) {
    const id = match[1].match(/\bfor="([^"]+)"/)?.[1];
    const count = match[2].trim().match(/^(No|[\d,]+) contributions? on /);
    if (id && count) counts.set(id, count[1] === 'No' ? 0 : Number(count[1].replaceAll(',', '')));
  }
  const days = [];
  for (const match of html.matchAll(/<td\b[^>]*\bdata-date="\d{4}-\d{2}-\d{2}"[^>]*>/g)) {
    const cell = match[0];
    const date = cell.match(/\bdata-date="([^"]+)"/)[1];
    if (date > today) continue;
    const id = cell.match(/\bid="([^"]+)"/)?.[1];
    const level = Number(cell.match(/\bdata-level="([0-4])"/)?.[1]);
    if (!counts.has(id) || !Number.isInteger(level)) throw new Error(`Incomplete contribution data: ${date}`);
    days.push({ date, count: integer(counts.get(id), 'contribution count'), level });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  if (days.length < 350 || days.length > 372) throw new Error('Expected approximately one year of contribution data');
  for (let index = 1; index < days.length; index++) {
    if (Date.parse(days[index].date) - Date.parse(days[index - 1].date) !== dayMs) {
      throw new Error('Contribution calendar has duplicate or missing dates');
    }
  }
  if (Date.parse(today) - Date.parse(days.at(-1).date) > dayMs) throw new Error('Contribution calendar is stale');
  return days;
}

export function summarizeDays(days) {
  let run = 0;
  let longestStreak = 0;
  for (const day of days) {
    run = day.count > 0 ? run + 1 : 0;
    longestStreak = Math.max(longestStreak, run);
  }
  return {
    contributions: days.reduce((total, day) => total + day.count, 0),
    activeDays: days.filter(day => day.count > 0).length,
    longestStreak,
  };
}

async function github() {
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const api = async path => (await request(`https://api.github.com${path}`, { headers })).json();
  const [user, calendar] = await Promise.all([
    api(`/users/${username}`),
    request(`https://github.com/users/${username}/contributions`, { headers: { Accept: 'text/html' } }).then(r => r.text()),
  ]);
  const repos = [];
  for (let page = 1; ; page++) {
    const batch = await api(`/users/${username}/repos?type=owner&per_page=100&page=${page}`);
    if (!Array.isArray(batch)) throw new Error('Invalid public repository list');
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  const days = parseContributions(calendar);
  return {
    updatedAt: new Date().toISOString().slice(0, 10),
    followers: integer(user.followers, 'followers'),
    stars: repos.filter(repo => !repo.fork).reduce((total, repo) => total + integer(repo.stargazers_count, 'stars'), 0),
    ...summarizeDays(days), days,
  };
}

export function parseLeetcode(data) {
  const user = data?.matchedUser;
  if (user?.username?.toLowerCase() !== username.toLowerCase()) throw new Error('LeetCode user missing');
  const difficulty = Object.fromEntries((user.submitStatsGlobal?.acSubmissionNum ?? []).map(item => [item.difficulty, integer(item.count, 'solved count')]));
  for (const key of ['All', 'Easy', 'Medium', 'Hard']) integer(difficulty[key], key);
  if (difficulty.All !== difficulty.Easy + difficulty.Medium + difficulty.Hard) throw new Error('LeetCode totals do not match');
  if (!Array.isArray(user.badges)) throw new Error('Missing LeetCode badges');
  const contest = data.userContestRanking;
  if (contest && (!Number.isFinite(contest.rating) || contest.rating < 0)) throw new Error('Invalid contest rating');
  return {
    updatedAt: new Date().toISOString().slice(0, 10),
    solved: difficulty.All, easy: difficulty.Easy, medium: difficulty.Medium, hard: difficulty.Hard,
    ranking: integer(user.profile?.ranking, 'global problem rank'),
    badges: user.badges.length,
    rating: contest ? Math.round(contest.rating) : null,
    contests: contest ? integer(contest.attendedContestsCount, 'contests') : 0,
  };
}

async function leetcode() {
  const query = `query { matchedUser(username: "${username}") {
    username profile { ranking } submitStatsGlobal { acSubmissionNum { difficulty count } } badges { name }
  } userContestRanking(username: "${username}") { rating attendedContestsCount } }`;
  const response = await request('https://leetcode.com/graphql/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Referer: `https://leetcode.com/u/${username}/` },
    body: JSON.stringify({ query }),
  });
  const body = await response.json();
  if (body.errors) throw new Error('LeetCode returned GraphQL errors');
  return parseLeetcode(body.data);
}

export async function refresh({ directory = resolve(root, 'data'), sources = { github, leetcode } } = {}) {
  await mkdir(directory, { recursive: true });
  const results = await Promise.allSettled([sources.github(), sources.leetcode()]);
  let failures = 0;
  for (const [index, name] of ['github', 'leetcode'].entries()) {
    const path = resolve(directory, `${name}.json`);
    const result = results[index];
    if (result.status === 'fulfilled') {
      await writeFile(path, JSON.stringify(result.value, null, 2) + '\n');
      console.log(`Updated ${name} from its public profile.`);
    } else {
      failures++;
      console.warn(`::warning::Could not refresh ${name}: ${result.reason.message}. Keeping the dated snapshot.`);
      // A clean installation cannot silently succeed without real source data.
      JSON.parse(await readFile(path, 'utf8'));
    }
  }
  return failures;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (await refresh()) process.exitCode = 1;
}
