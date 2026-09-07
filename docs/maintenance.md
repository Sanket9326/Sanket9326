# Profile maintenance

The public README is intentionally focused on identity, stack, coding profiles,
and measured activity. It contains no project showcase or repository links.

## Files

- `README.md`: the profile layout, biography, accessible image descriptions, and links.
- `scripts/render.mjs`: the graphite/lime visual system, stack, SVG animation, and desktop/mobile layouts.
- `scripts/refresh.mjs`: public GitHub and LeetCode data collection and validation.
- `data/`: last successful snapshots; these contain public metrics only.
- `assets/`: generated, self-contained SVGs. Edit the renderer rather than these files.
- `.github/workflows/refresh-profile.yml`: daily refresh and manual refresh.

## Local update

Requires Node.js 24. There are no package dependencies or installation step.

```sh
node --test scripts/refresh.test.mjs
node scripts/refresh.mjs
node scripts/render.mjs
git diff --check
```

In a Windows sandbox that prevents the test runner from spawning a subprocess,
use `node --test --test-isolation=none scripts/refresh.test.mjs`.

`refresh.mjs` needs network access. `render.mjs` and the tests work offline.
An optional `GITHUB_TOKEN` raises the GitHub API rate limit; no personal token is
required. Never put a token in a file or commit it.

## Automatic updates

After this workflow is on `main`, it runs daily at 04:23 UTC (09:53 IST), when
its scripts change on `main`, or through **Actions → Refresh profile stats →
Run workflow**. GitHub schedules can run later than their scheduled time.

The workflow uses the repository's built-in `GITHUB_TOKEN` with `contents: write`
to commit only `data/` and `assets/`. Official actions are pinned to commit SHAs.
No third-party stats image service or personal access token is needed.

Repository or organization policies must permit Actions and commits by the
workflow token. A branch rule that requires pull requests may prevent the bot
from pushing; adapt delivery to that policy rather than weakening it. Check the
Actions page if snapshot dates stop changing.

Each provider refreshes independently. Timeouts, malformed responses, and changed
upstream markup preserve that provider's last successful snapshot and date.
The healthy provider still updates. CI commits the usable assets, then reports
a failed run so a stale source is visible to the maintainer. With no saved
snapshot, a failed fetch stops the initial generation rather than inventing data.

## What the statistics mean

- **GitHub contributions, active days, and longest streak**: the exact period
  printed on the card, based on the public GitHub profile calendar. Longest
  streak counts consecutive UTC calendar dates with at least one contribution.
  This is a period statistic, not an all-time record or current streak.
- **GitHub stars earned**: the sum of stars on owned, non-fork public repositories.
  It does not mean repositories starred by the user.
- **Mobile calendar**: the final 20 calendar weeks; summary metrics still cover
  the full date range printed above it.
- **LeetCode solved**: accepted problem counts, broken down by difficulty. The
  ring shows the mix of solved problems, not completion of the entire catalog.
- **Contest rating**: rounded to the nearest integer; unrated is shown as a dash.
- **Global problem rank**: LeetCode's profile ranking, separate from contest rank.
- **Badges and contests**: badge count and attended contest count from LeetCode.

GitHub's public calendar HTML and LeetCode's public GraphQL endpoint can change.
The parsers validate responses and retain dated snapshots when either changes.
No private contributions or professional achievements are inferred.

## Presentation

The README uses GitHub-compatible Markdown, links, `picture`, and `details`.
All images are served from this repository. SVGs contain no scripts, external
fonts, raster images, or external asset requests. The hero uses subtle CSS
animation and honors `prefers-reduced-motion`. The design remains complete when
animation is disabled. Below a 600px viewport, `picture` selects dedicated mobile
assets; all images have alt text and SVG titles/descriptions.

Live statistics means scheduled snapshots, not per-visitor real-time queries.
The date on each card shows its last successful fetch in UTC. GitHub image
caching can delay when a new snapshot appears to visitors.
