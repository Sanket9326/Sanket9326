import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const c = { bg: '#101215', panel: '#181b20', edge: '#2b3037', text: '#f1f3ec', muted: '#a2aaa9', lime: '#c2f970', blue: '#92baff', purple: '#c2abff', orange: '#ffbc7d', pink: '#ff8caa' };
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const number = value => value === null ? '—' : new Intl.NumberFormat('en-US').format(value);
const text = (x, y, value, size = 16, color = c.text, extra = '') => `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" ${extra}>${escape(value)}</text>`;
const mono = (x, y, value, size = 12, color = c.muted, extra = '') => text(x, y, value, size, color, `font-family="Consolas, 'Liberation Mono', monospace" ${extra}`);
const rect = (x, y, w, h, fill = c.panel, radius = 12, stroke = c.edge) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}"/>`;
const line = (x, y, x2) => `<path d="M${x} ${y}H${x2}" stroke="${c.edge}"/>`;
const svg = (w, h, title, body, description = title) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc">
<title id="title">${escape(title)}</title><desc id="desc">${escape(description)}</desc>
<style>svg{font-family:Arial,Helvetica,sans-serif} .packet{animation:flow 6s linear infinite}.orbit{animation:orbit 36s linear infinite;transform-box:fill-box;transform-origin:center}.cursor{animation:blink 2s steps(2,end) infinite}@keyframes flow{to{stroke-dashoffset:-120}}@keyframes orbit{to{transform:rotate(360deg)}}@keyframes blink{50%{opacity:0}}@media(prefers-reduced-motion:reduce){.packet,.orbit,.cursor{animation:none}}</style>
${rect(1, 1, w - 2, h - 2, c.bg, 18)}${body}
</svg>\n`;

function hero(mobile) {
  const w = mobile ? 440 : 960;
  const h = mobile ? 425 : 355;
  const pad = mobile ? 26 : 38;
  let body = `<defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${c.edge}"/></pattern><linearGradient id="fade"><stop stop-color="${c.lime}" stop-opacity="0"/><stop offset="1" stop-color="${c.lime}" stop-opacity=".10"/></linearGradient></defs>`;
  body += `<rect x="${mobile ? 230 : 560}" y="2" width="${mobile ? 208 : 398}" height="${h - 4}" rx="18" fill="url(#dots)"/>`;
  body += mono(pad, 36, 'S / S', 15, c.lime, 'font-weight="700"');
  body += mono(w - pad, 36, 'PUNE, IN', 12, c.muted, 'text-anchor="end"');
  body += line(pad, 55, w - pad, 55);
  body += mono(pad, 91, 'SOFTWARE ENGINEER', 13, c.lime, 'letter-spacing="2"');
  body += text(pad - 3, mobile ? 165 : 169, 'Sanket', mobile ? 78 : 88, c.text, 'font-weight="750" letter-spacing="-5"');
  body += text(pad - 3, mobile ? 235 : 244, 'Sawant', mobile ? 78 : 88, c.text, 'font-weight="750" letter-spacing="-5"');
  body += text(mobile ? 280 : 323, mobile ? 235 : 244, '.', mobile ? 78 : 88, c.lime, 'font-weight="750"');
  body += text(pad, mobile ? 278 : 280, 'SDE-2 @ Xperate', mobile ? 19 : 20, c.muted);
  if (mobile) {
    body += line(pad, 310, w - pad, 310);
    body += mono(pad, 340, 'BACKEND ENGINEERING', 13, c.text, 'letter-spacing="1"');
    body += mono(pad, 365, 'DISTRIBUTED SYSTEMS', 13, c.text, 'letter-spacing="1"');
    body += mono(pad, 398, '> build. understand. improve.', 12, c.lime);
    body += `<rect class="cursor" x="${pad + '> build. understand. improve.'.length * 7.2 + 6}" y="387" width="7" height="13" fill="${c.lime}"/>`;
  } else {
    body += mono(pad, 326, 'BACKEND ENGINEERING  /  DISTRIBUTED SYSTEMS', 12, c.muted, 'letter-spacing=".7"');
    body += `<circle cx="741" cy="181" r="106" fill="url(#fade)" stroke="${c.edge}"/><circle class="orbit" cx="741" cy="181" r="82" fill="none" stroke="${c.lime}" stroke-opacity=".3" stroke-dasharray="2 15"/>`;
    body += `<path d="M584 181H898M741 87V273" stroke="${c.edge}"/><path class="packet" d="M584 181H898M741 87V273" fill="none" stroke="${c.lime}" stroke-width="2" stroke-dasharray="8 52"/>`;
    body += rect(695, 135, 92, 92, c.panel, 22);
    body += text(741, 191, '{ }', 37, c.lime, 'font-weight="700" text-anchor="middle"');
    for (const [x, y, label, width] of [[544, 165, 'API', 72], [856, 165, 'DATA', 72], [697, 69, 'EVENTS', 88], [689, 265, 'WORKERS', 104]]) {
      body += rect(x, y, width, 32, c.bg, 6);
      body += mono(x + width / 2, y + 21, label, 11, c.muted, 'text-anchor="middle"');
    }
    body += mono(741, 328, 'build. understand. improve.', 12, c.lime, 'text-anchor="middle"');
  }
  return svg(w, h, 'Sanket Sawant · Software Engineer', body, 'SDE-2 at Xperate, Pune, India. Backend engineering and distributed systems. An animated message flow connects API, events, workers, and data.');
}

const stack = [
  ['01', 'Backend', 'C#', c.purple, 'C# / .NET / ASP.NET Core', 'EF Core · Java'],
  ['02', 'Frontend', 'ng', c.pink, 'Angular / TypeScript', 'RxJS · SignalR'],
  ['03', 'Messaging', '~>', c.lime, 'Kafka / Redis', 'Azure Service Bus'],
  ['04', 'Data', 'db', c.blue, 'PostgreSQL / SQL Server', 'Qdrant · MinIO'],
  ['05', 'Cloud & delivery', '>_', c.orange, 'Azure / Docker / Kubernetes', 'Helm · Argo CD'],
  ['06', 'Observability', '/~', c.lime, 'OpenTelemetry', 'Prometheus · Grafana'],
];

function toolbox(mobile) {
  const w = mobile ? 440 : 960;
  const gap = mobile ? 12 : 14;
  const pad = mobile ? 14 : 18;
  const cols = mobile ? 1 : 3;
  const cw = (w - pad * 2 - gap * (cols - 1)) / cols;
  const ch = mobile ? 111 : 154;
  const height = pad * 2 + Math.ceil(stack.length / cols) * (ch + gap) - gap;
  let body = '';
  stack.forEach(([index, label, icon, color, first, second], i) => {
    const x = pad + (i % cols) * (cw + gap);
    const y = pad + Math.floor(i / cols) * (ch + gap);
    body += rect(x, y, cw, ch);
    body += rect(x + 16, y + 16, 34, 34, c.bg, 9, c.edge);
    body += mono(x + 33, y + 39, icon, 16, color, 'text-anchor="middle" font-weight="700"');
    body += text(x + 62, y + 39, label, 17, c.text, 'font-weight="600"');
    body += mono(x + cw - 17, y + 37, index, 11, c.muted, 'text-anchor="end"');
    body += text(x + 17, y + (mobile ? 75 : 92), first, mobile ? 16 : 15, color);
    body += text(x + 17, y + (mobile ? 96 : 120), second, 14, c.muted);
  });
  return svg(w, height, 'The engineering stack', body, stack.map(row => `${row[1]}: ${row[4]}, ${row[5]}`).join('. '));
}

function social(label, short, color, width) {
  return svg(width, 38, label, `<circle cx="20" cy="19" r="10" fill="${color}"/>${text(20, 23, short, 10, c.bg, 'font-weight="700" text-anchor="middle"')}${text(38, 24, label, 13, c.text)}${text(width - 17, 24, '↗', 14, color, 'text-anchor="middle"')}`);
}

function leetcode(data, mobile) {
  const w = mobile ? 440 : 960;
  const h = mobile ? 552 : 327;
  const pad = mobile ? 26 : 32;
  let body = mono(pad, 34, '01 / PROBLEM SOLVING', 12, c.orange, 'letter-spacing="1"');
  body += text(w - pad, 34, 'LeetCode ↗', 14, c.muted, 'text-anchor="end"');
  body += line(pad, 51, w - pad, 51);
  const cx = mobile ? 106 : 140;
  const cy = mobile ? 159 : 170;
  const radius = mobile ? 68 : 82;
  const circumference = 2 * Math.PI * radius;
  body += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${c.edge}" stroke-width="8"/>`;
  let offset = 0;
  for (const [value, color] of [[data.easy, c.lime], [data.medium, c.orange], [data.hard, c.pink]]) {
    const length = data.solved > 0 ? value / data.solved * circumference : 0;
    if (length > 0) body += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${color}" stroke-width="8" stroke-dasharray="${Math.max(0, length - 5)} ${circumference - Math.max(0, length - 5)}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"/>`;
    offset += length;
  }
  body += text(cx, cy + 8, number(data.solved), mobile ? 39 : 46, c.text, 'text-anchor="middle" font-weight="700" letter-spacing="-2"');
  body += mono(cx, cy + 31, 'SOLVED', 11, c.muted, 'text-anchor="middle" letter-spacing="1.5"');
  const dx = mobile ? 207 : 278;
  for (const [i, label, count, color] of [[0, 'Easy', data.easy, c.lime], [1, 'Medium', data.medium, c.orange], [2, 'Hard', data.hard, c.pink]]) {
    const y = (mobile ? 116 : 127) + i * 44;
    body += `<circle cx="${dx}" cy="${y - 5}" r="4" fill="${color}"/>`;
    body += text(dx + 14, y, label, 15, c.muted);
    body += text(mobile ? 401 : 485, y, number(count), 22, color, 'text-anchor="end" font-weight="600"');
  }
  if (!mobile) body += `<path d="M529 85V250" stroke="${c.edge}"/>`;
  const metrics = [[number(data.rating), 'CONTEST RATING'], [number(data.ranking), 'GLOBAL PROBLEM RANK'], [number(data.badges), 'BADGES'], [number(data.contests), 'CONTESTS']];
  metrics.forEach(([value, label], i) => {
    const x = (mobile ? 27 : 571) + (i % 2) * (mobile ? 200 : 185);
    const y = (mobile ? 302 : 126) + Math.floor(i / 2) * 101;
    body += text(x, y, value, 32, i === 0 ? c.orange : c.text, 'font-weight="700" letter-spacing="-1"');
    body += mono(x, y + 23, label, mobile ? 11 : 10, c.muted);
  });
  if (mobile) body += line(pad, 256, w - pad, 256);
  body += line(pad, h - 59, w - pad, h - 59);
  body += mono(pad, h - 32, 'CONSISTENCY > INTENSITY', 11, c.orange, 'letter-spacing=".5"');
  body += mono(mobile ? pad : w - pad, h - (mobile ? 13 : 32), `UPDATED ${data.updatedAt} UTC`, 10, c.muted, mobile ? '' : 'text-anchor="end"');
  return svg(w, h, `LeetCode · ${number(data.solved)} problems solved`, body, `${data.easy} easy, ${data.medium} medium, ${data.hard} hard. Contest rating ${data.rating ?? 'unrated'}, global problem rank ${data.ranking}, ${data.badges} badges, ${data.contests} contests. Updated ${data.updatedAt} UTC.`);
}

function github(data, mobile) {
  const w = mobile ? 440 : 960;
  const h = mobile ? 432 : 348;
  const pad = mobile ? 26 : 32;
  let body = mono(pad, 34, '02 / GITHUB ACTIVITY', 12, c.lime, 'letter-spacing="1"');
  body += mono(w - pad, 34, '@Sanket9326', 12, c.muted, 'text-anchor="end"');
  body += line(pad, 51, w - pad, 51);
  const metrics = [[data.contributions, 'CONTRIBUTIONS'], [data.activeDays, 'ACTIVE DAYS'], [data.longestStreak, 'LONGEST STREAK']];
  metrics.forEach(([value, label], i) => {
    const x = pad + i * (mobile ? 134 : 243);
    body += text(x, 109, number(value), mobile ? 33 : 42, i === 0 ? c.lime : c.text, 'font-weight="700" letter-spacing="-1"');
    body += mono(x, 134, label, mobile ? 9 : 11, c.muted);
  });
  if (!mobile) {
    body += mono(w - pad, 91, `${number(data.followers)} followers`, 13, c.muted, 'text-anchor="end"');
    body += mono(w - pad, 117, `${number(data.stars)} stars earned`, 13, c.muted, 'text-anchor="end"');
  }
  const period = `${data.days[0].date} — ${data.days.at(-1).date}`;
  body += mono(pad, 162, period, 11, c.muted);
  const firstDate = Date.parse(data.days[0].date);
  const startSunday = firstDate - new Date(firstDate).getUTCDay() * 86_400_000;
  const weeks = Math.floor((Date.parse(data.days.at(-1).date) - startSunday) / (7 * 86_400_000)) + 1;
  const visibleWeeks = mobile ? Math.min(20, weeks) : weeks;
  const firstWeek = weeks - visibleWeeks;
  const gap = mobile ? 5 : 4;
  const size = mobile ? 14 : 12;
  const gx = pad;
  const gy = mobile ? 212 : 190;
  const colors = [c.panel, '#33442a', '#567b39', '#87b94d', c.lime];
  for (const day of data.days) {
    const week = Math.floor((Date.parse(day.date) - startSunday) / (7 * 86_400_000));
    if (week < firstWeek) continue;
    const x = gx + (week - firstWeek) * (size + gap);
    const y = gy + new Date(day.date).getUTCDay() * (size + gap);
    body += `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="3" fill="${colors[day.level]}"><title>${day.date}: ${day.count} contributions</title></rect>`;
  }
  if (mobile) body += mono(pad, 195, 'CALENDAR / LAST 20 WEEKS', 10, c.lime);
  const ly = mobile ? 366 : 319;
  body += mono(pad, ly, mobile ? `${data.followers} followers · ${data.stars} stars earned` : 'SMALL STEPS. VISIBLE PROGRESS.', 11, c.muted);
  if (!mobile) {
    body += mono(581, ly, 'LESS', 9, c.muted);
    colors.forEach((color, index) => { body += rect(614 + index * 14, ly - 9, 9, 9, color, 2, color); });
    body += mono(688, ly, 'MORE', 9, c.muted);
  }
  body += mono(mobile ? pad : w - pad, mobile ? 405 : ly, `UPDATED ${data.updatedAt} UTC`, 10, c.muted, mobile ? '' : 'text-anchor="end"');
  return svg(w, h, `GitHub · ${number(data.contributions)} contributions`, body, `${data.contributions} contributions, ${data.activeDays} active days, ${data.longestStreak} day longest streak during ${period}. ${data.followers} followers and ${data.stars} stars across owned non-fork public repositories. ${mobile ? 'Calendar displays the last 20 weeks.' : 'Calendar displays the full period.'} Updated ${data.updatedAt} UTC.`);
}

await mkdir(resolve(root, 'assets'), { recursive: true });
const [gh, lc] = await Promise.all(['github', 'leetcode'].map(async name => JSON.parse(await readFile(resolve(root, 'data', `${name}.json`), 'utf8'))));
const files = {
  'hero.svg': hero(false), 'hero-mobile.svg': hero(true),
  'toolbox.svg': toolbox(false), 'toolbox-mobile.svg': toolbox(true),
  'leetcode.svg': leetcode(lc, false), 'leetcode-mobile.svg': leetcode(lc, true),
  'github.svg': github(gh, false), 'github-mobile.svg': github(gh, true),
  'linkedin.svg': social('LinkedIn', 'in', c.blue, 125),
  'leetcode-link.svg': social('LeetCode', '<>', c.orange, 130),
  'gfg.svg': social('GeeksforGeeks', 'G', c.lime, 167),
};
await Promise.all(Object.entries(files).map(([name, content]) => writeFile(resolve(root, 'assets', name), content)));
console.log(`Rendered ${Object.keys(files).length} SVG assets from verified snapshots.`);
