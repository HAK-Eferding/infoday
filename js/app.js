import { FLOORS } from './plan-data.js';
import { CONFIG } from './config.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const STORAGE_KEY = 'infoday-besucht';
const TABS = ['plan', 'liste', 'umfrage'];

const ICONS = {
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  list: 'M10 6h10M10 12h10M10 18h10M3.5 6l1.5 1.5L8 4.5M3.5 12l1.5 1.5L8 10.5M3.5 18l1.5 1.5L8 16.5',
  chat: 'M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1.4-4.9A8.5 8.5 0 1 1 21 11.5zM8.5 11.5h.01M12.5 11.5h.01M16.5 11.5h.01',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  close: 'M6 6l12 12M18 6 6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  chevron: 'M9 6l6 6-6 6',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
};

function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;
}

const $ = (sel) => document.querySelector(sel);

const state = {
  stations: [],          // aus der CSV, in CSV-Reihenfolge
  byId: new Map(),
  visited: loadVisited(),
  floor: 'eg',
  rotated: null,
  selected: null,
  pendingFocus: null,
};

/* ---------- Speicher ---------- */

function loadVisited() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []);
  } catch {
    return new Set();
  }
}

function saveVisited() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.visited]));
  } catch { /* privater Modus o. Ä. – Haken gelten dann nur bis zum Neuladen */ }
}

/* ---------- CSV ---------- */

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }

  const [header, ...data] = rows.filter((r) => r.some((f) => f.trim()));
  const keys = header.map((h) => h.trim().toLowerCase());
  return data.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] || '').trim()])));
}

// "Ausbildungs- / schwerpunkte" → Zeilen für den Plan und "Ausbildungs­schwerpunkte" (mit weichem Trennstrich) für Listen
function splitLines(name) {
  return name.split(/\s+\/\s+/);
}

function displayName(name) {
  return splitLines(name).reduce((acc, part) =>
    !acc ? part : acc.endsWith('-') ? `${acc.slice(0, -1)}\u00AD${part}` : `${acc} · ${part}`, '');
}

function floorOf(id) {
  for (const [key, floor] of Object.entries(FLOORS)) {
    if (floor.rooms.some((r) => r.id === id)) return key;
  }
  return null;
}

async function loadStations() {
  const res = await fetch('data/stationen.csv', { cache: 'no-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const rows = parseCSV(await res.text());
  state.stations = rows.filter((r) => r.id).map((r) => ({
    id: r.id,
    stockwerk: r.stockwerk || '',
    name: r.name || r.id,
    lines: splitLines(r.name || r.id),
    title: displayName(r.name || r.id),
    text: r.beschreibung || '',
    floor: floorOf(r.id),
  }));
  state.byId = new Map(state.stations.map((s) => [s.id, s]));
}

/* ---------- Textmessung ---------- */

const measureCtx = document.createElement('canvas').getContext('2d');
const fontFamily = getComputedStyle(document.body).fontFamily;

function textWidth(str, weight) {
  measureCtx.font = `${weight} 100px ${fontFamily}`;
  return measureCtx.measureText(str).width / 100;
}

const LINE_H = 1.18;

function fitSize(lines, w, h, weight, max) {
  const widest = Math.max(...lines.map((l) => textWidth(l, weight)));
  return Math.min(max, (w * 0.84) / widest, (h * 0.78) / (lines.length * LINE_H));
}

const LABEL_STYLE = {
  station: { weight: 800, max: 40 },
  room: { weight: 600, max: 24 },
  infra: { weight: 700, max: 22 },
  landmark: { weight: 700, max: 30 },
  stairs: { weight: 700, max: 22 },
};

/* ---------- SVG-Helfer ---------- */

function el(name, attrs = {}, parent) {
  const node = document.createElementNS(SVGNS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

function label(parent, lines, box, kind) {
  const { weight, max } = LABEL_STYLE[kind];
  const [x1, y1, x2, y2] = box;
  const w = x2 - x1, h = y2 - y1;
  const horizontal = fitSize(lines, w, h, weight, max);
  const vertical = fitSize(lines, h, w, weight, max);
  const rotate = vertical > horizontal * 1.4 && horizontal < max * (kind === 'station' ? 0.5 : 0.75);
  const size = rotate ? vertical : horizontal;
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;

  const text = el('text', { 'text-anchor': 'middle', 'font-size': size.toFixed(1) }, parent);
  if (rotate) text.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
  lines.forEach((line, i) => {
    const y = cy + (i - (lines.length - 1) / 2) * LINE_H * size + 0.36 * size;
    el('tspan', { x: cx, y: y.toFixed(1) }, text).textContent = line;
  });
}

// Plan im Hochformat um 90° im Uhrzeigersinn drehen, damit er den Handybildschirm füllt.
// Nur die Geometrie wird gedreht, Beschriftungen bleiben waagrecht lesbar.
function makeTransform(floor, rotated) {
  const xs = floor.outline.map((p) => p[0]), ys = floor.outline.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  if (!rotated) {
    return {
      pt: ([x, y]) => [x - minX, y - minY],
      rect: ([x1, y1, x2, y2]) => [x1 - minX, y1 - minY, x2 - minX, y2 - minY],
      w: maxX - minX,
      h: maxY - minY,
    };
  }
  return {
    pt: ([x, y]) => [maxY - y, x - minX],
    rect: ([x1, y1, x2, y2]) => [maxY - y2, x1 - minX, maxY - y1, x2 - minX],
    w: maxY - minY,
    h: maxX - minX,
  };
}

/* ---------- Raumplan ---------- */

const svg = $('#plan');
const stage = $('#plan-stage');
const view = { world: null, vb: null, transform: null };

function renderPlan() {
  const floor = FLOORS[state.floor];
  const t = makeTransform(floor, state.rotated);
  view.transform = t;
  view.world = { x: 0, y: 0, w: t.w, h: t.h };
  svg.replaceChildren();

  el('polygon', { class: 'outline', points: floor.outline.map((p) => t.pt(p).join(',')).join(' ') }, svg);

  for (const room of floor.rooms) {
    const station = state.byId.get(room.id);
    const kind = station ? 'station' : room.type || 'room';
    const [x1, y1, x2, y2] = t.rect(room.r);
    const g = el('g', { class: kind }, svg);
    if (room.noHit) g.style.pointerEvents = 'none';
    el('rect', { x: x1, y: y1, width: x2 - x1, height: y2 - y1, rx: 5 }, g);

    if (kind === 'stairs') {
      const vertical = y2 - y1 > x2 - x1;
      for (let p = (vertical ? y1 : x1) + 12; p < (vertical ? y2 : x2) - 6; p += 13) {
        el('line', vertical ? { x1: x1 + 6, x2: x2 - 6, y1: p, y2: p } : { x1: p, x2: p, y1: y1 + 6, y2: y2 - 6 }, g);
      }
    }

    const lines = station ? station.lines : room.label ? splitLines(room.label) : null;
    if (lines) label(g, lines, room.labelBox ? t.rect(room.labelBox) : [x1, y1, x2, y2], kind);

    if (station) {
      g.dataset.id = room.id;
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', station.title);
      g.classList.toggle('is-visited', state.visited.has(room.id));
      g.classList.toggle('is-selected', state.selected === room.id);
      if (state.visited.has(room.id)) {
        const r = Math.min(15, (x2 - x1) / 3, (y2 - y1) / 3);
        const cx = x2 - r - 5, cy = y1 + r + 5;
        const badge = el('g', { class: 'check-badge' }, g);
        el('circle', { cx, cy, r }, badge);
        el('path', { d: `M${cx - r * .45} ${cy + r * .02}l${r * .3} ${r * .3} ${r * .55}-${r * .6}`, 'stroke-width': r * .27 }, badge);
      }
    }
  }

}

function stageSize() {
  return { cw: stage.clientWidth || 1, ch: stage.clientHeight || 1 };
}

// viewBox, das den ganzen Plan zeigt (unten etwas Platz für Legende und Zoom-Knöpfe)
function baseVB() {
  const { cw, ch } = stageSize();
  const { x, y, w, h } = view.world;
  const pad = { l: 12, r: 60, t: 8, b: 12 };
  const s = Math.min((cw - pad.l - pad.r) / w, (ch - pad.t - pad.b) / h);
  const ox = pad.l + (cw - pad.l - pad.r - w * s) / 2;
  const oy = pad.t + (ch - pad.t - pad.b - h * s) / 2;
  return { x: x - ox / s, y: y - oy / s, w: cw / s, h: ch / s };
}

function clampVB(vb) {
  const base = baseVB();
  const k = Math.min(6, Math.max(1, base.w / vb.w));
  if (k <= 1.001) return base;
  const w = base.w / k, h = base.h / k;
  const { world } = view;
  const cx = Math.min(world.x + world.w, Math.max(world.x, vb.x + vb.w / 2));
  const cy = Math.min(world.y + world.h, Math.max(world.y, vb.y + vb.h / 2));
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

function setVB(vb) {
  view.vb = vb;
  svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
}

let anim = 0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function animateTo(target, ms = 380) {
  cancelAnimationFrame(anim);
  if (reducedMotion.matches) return setVB(target);
  const from = { ...view.vb }, start = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - start) / ms), e = 1 - (1 - p) ** 3;
    setVB({
      x: from.x + (target.x - from.x) * e,
      y: from.y + (target.y - from.y) * e,
      w: from.w + (target.w - from.w) * e,
      h: from.h + (target.h - from.h) * e,
    });
    if (p < 1) anim = requestAnimationFrame(step);
  };
  anim = requestAnimationFrame(step);
}

function zoomAt(clientX, clientY, factor, animate = false) {
  const rect = svg.getBoundingClientRect();
  const vb = view.vb, upp = vb.w / rect.width;
  const px = vb.x + (clientX - rect.left) * upp, py = vb.y + (clientY - rect.top) * upp;
  const w = vb.w / factor, h = vb.h / factor;
  const target = clampVB({ x: px - (px - vb.x) / factor, y: py - (py - vb.y) / factor, w, h });
  animate ? animateTo(target) : setVB(target);
}

// Ausrichtung prüfen und Plan bei Bedarf neu aufbauen; Zoom bleibt bei reinen Größenänderungen erhalten.
function layoutPlan(forceReset = false) {
  if (!stage.clientWidth) return;
  const { cw, ch } = stageSize();
  const rotated = ch > cw * 1.1;
  if (rotated !== state.rotated || forceReset || !view.vb || view.floor !== state.floor) {
    state.rotated = rotated;
    view.floor = state.floor;
    renderPlan();
    setVB(baseVB());
  } else {
    const k = view.prevBase.w / view.vb.w;
    const base = baseVB();
    const cx = view.vb.x + view.vb.w / 2, cy = view.vb.y + view.vb.h / 2;
    setVB(clampVB({ x: cx - base.w / k / 2, y: cy - base.h / k / 2, w: base.w / k, h: base.h / k }));
  }
  view.prevBase = baseVB();
}

new ResizeObserver(() => layoutPlan()).observe(stage);

/* Gesten: ziehen, zwei Finger zoomen, Mausrad */
const pointers = new Map();
let gesture = null, moved = false;

function startGesture() {
  const pts = [...pointers.values()];
  gesture = { vb: { ...view.vb }, pts: pts.map((p) => ({ ...p })) };
}

svg.addEventListener('pointerdown', (e) => {
  if (pointers.size === 0) moved = false;
  cancelAnimationFrame(anim);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  startGesture();
});

window.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId) || !gesture) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const rect = svg.getBoundingClientRect();
  const pts = [...pointers.values()];
  const g = gesture;

  if (pts.length === 1) {
    const dx = pts[0].x - g.pts[0].x, dy = pts[0].y - g.pts[0].y;
    if (!moved && Math.hypot(dx, dy) < 6) return;
    moved = true;
    const upp = g.vb.w / rect.width;
    setVB(clampVB({ ...g.vb, x: g.vb.x - dx * upp, y: g.vb.y - dy * upp }));
  } else if (pts.length >= 2) {
    moved = true;
    const [a, b] = pts, [a0, b0] = g.pts;
    const dist = Math.hypot(a.x - b.x, a.y - b.y), dist0 = Math.hypot(a0.x - b0.x, a0.y - b0.y);
    const mid = { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top };
    const mid0 = { x: (a0.x + b0.x) / 2 - rect.left, y: (a0.y + b0.y) / 2 - rect.top };
    const upp0 = g.vb.w / rect.width;
    const px = g.vb.x + mid0.x * upp0, py = g.vb.y + mid0.y * upp0;
    const w = g.vb.w * (dist0 / dist), h = g.vb.h * (dist0 / dist), upp = w / rect.width;
    setVB(clampVB({ x: px - mid.x * upp, y: py - mid.y * upp, w, h }));
  }
});

function endPointer(e) {
  if (!pointers.delete(e.pointerId)) return;
  if (pointers.size) startGesture();
  else gesture = null;
}
window.addEventListener('pointerup', endPointer);
window.addEventListener('pointercancel', endPointer);

svg.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0015));
}, { passive: false });

svg.addEventListener('click', (e) => {
  if (moved) return;
  const g = e.target.closest('.station');
  if (g) openSheet(g.dataset.id);
  else closeSheet();
});

document.querySelectorAll('[data-zoom]').forEach((btn) => {
  btn.innerHTML = icon({ in: 'plus', out: 'minus', reset: 'expand' }[btn.dataset.zoom]);
  btn.addEventListener('click', () => {
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    if (btn.dataset.zoom === 'in') zoomAt(cx, cy, 1.6, true);
    else if (btn.dataset.zoom === 'out') zoomAt(cx, cy, 1 / 1.6, true);
    else animateTo(baseVB());
  });
});

/* Stockwerk wechseln */
const floorButtons = document.querySelectorAll('[data-floor]');

function setFloor(key) {
  if (key === state.floor) return;
  state.floor = key;
  floorButtons.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.floor === key)));
  closeSheet();
  layoutPlan(true);
}

floorButtons.forEach((b) => b.addEventListener('click', () => setFloor(b.dataset.floor)));

/* Hervorheben einer Station */
function focusStation(id) {
  const station = state.byId.get(id);
  if (!station?.floor) return;
  setFloor(station.floor);
  openSheet(id);

  const room = FLOORS[station.floor].rooms.find((r) => r.id === id);
  const [x1, y1, x2, y2] = view.transform.rect(room.r);
  const g = svg.querySelector(`[data-id="${CSS.escape(id)}"]`);
  if (g) svg.appendChild(g);
  el('rect', { class: 'pulse', x: x1, y: y1, width: x2 - x1, height: y2 - y1, rx: 5 }, svg);
  setTimeout(() => svg.querySelector('.pulse')?.remove(), 4200);

  const base = baseVB();
  const k = Math.min(2.6, Math.max(1.5, Math.min(base.w * 0.4 / (x2 - x1), base.h * 0.3 / (y2 - y1))));
  const w = base.w / k, h = base.h / k;
  // Raum etwas nach oben schieben, damit ihn die Infokarte nicht verdeckt
  const sheetPx = sheet.hidden ? 0 : sheet.offsetHeight + 8;
  const shift = (sheetPx / 2) * (w / stage.clientWidth);
  const target = clampVB({ x: (x1 + x2) / 2 - w / 2, y: (y1 + y2) / 2 + shift - h / 2, w, h });
  animateTo(target, 600);
}

/* ---------- Infokarte ---------- */

const sheet = $('#sheet');
$('#sheet-close').innerHTML = icon('close');
$('#sheet-close').addEventListener('click', closeSheet);
$('#sheet-toggle').addEventListener('click', () => {
  if (state.selected) toggleVisited(state.selected);
});

function openSheet(id) {
  const station = state.byId.get(id);
  if (!station) return;
  state.selected = id;
  $('#sheet-floor').textContent = FLOORS[station.floor]?.name || station.stockwerk;
  $('#sheet-title').textContent = station.title;
  $('#sheet-text').textContent = station.text;
  updateSheetButton();
  sheet.hidden = false;
  svg.querySelectorAll('.station').forEach((g) => g.classList.toggle('is-selected', g.dataset.id === id));
}

function closeSheet() {
  state.selected = null;
  sheet.hidden = true;
  svg.querySelectorAll('.is-selected').forEach((g) => g.classList.remove('is-selected'));
}

function updateSheetButton() {
  const visited = state.visited.has(state.selected);
  const btn = $('#sheet-toggle');
  btn.classList.toggle('btn--ghost', visited);
  btn.innerHTML = visited ? `${icon('check')} Besucht` : 'Als besucht markieren';
}

/* ---------- Checkliste ---------- */

function toggleVisited(id) {
  state.visited.has(id) ? state.visited.delete(id) : state.visited.add(id);
  saveVisited();
  if (view.vb) renderPlan();
  if (state.selected) updateSheetButton();
  renderChecklist();
}

function renderChecklist() {
  const container = $('#checklist');
  const ids = new Set(state.stations.map((s) => s.id));
  const done = [...state.visited].filter((id) => ids.has(id)).length;
  const total = state.stations.length;

  $('#progress-count').textContent = done;
  $('#progress-total').textContent = total;
  $('#progress-bar').style.width = total ? `${(done / total) * 100}%` : '0';
  $('#done-card').hidden = !total || done < total;

  const badge = $('#badge');
  badge.textContent = total - done;
  badge.hidden = total - done === 0;

  const groups = new Map();
  for (const s of state.stations) {
    const key = FLOORS[s.floor]?.name || s.stockwerk || 'Weitere';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }

  container.replaceChildren();
  for (const [title, stations] of groups) {
    const h = document.createElement('h2');
    h.className = 'group-title';
    h.textContent = title;
    const ul = document.createElement('ul');
    ul.className = 'list';
    for (const s of stations) {
      const visited = state.visited.has(s.id);
      const li = document.createElement('li');
      li.className = `item${visited ? ' is-visited' : ''}`;
      li.innerHTML = `
        <button type="button" class="item__check" aria-pressed="${visited}">
          <span>${icon('check')}</span>
        </button>
        <button type="button" class="item__body">
          <span class="item__text"><span class="item__name"></span><span class="item__desc"></span></span>
          ${s.floor ? `<span class="item__go">Plan${icon('chevron')}</span>` : ''}
        </button>`;
      li.querySelector('.item__name').textContent = s.title;
      li.querySelector('.item__desc').textContent = s.text;
      li.querySelector('.item__check').setAttribute('aria-label', `${s.title} als besucht markieren`);
      li.querySelector('.item__check').addEventListener('click', () => toggleVisited(s.id));
      li.querySelector('.item__body').addEventListener('click', () => {
        if (!s.floor) return;
        state.pendingFocus = s.id;
        location.hash = '#plan';
      });
      ul.appendChild(li);
    }
    container.append(h, ul);
  }
}

$('#reset-list').addEventListener('click', () => {
  if (!confirm('Alle Haken in der Checkliste entfernen?')) return;
  state.visited.clear();
  saveVisited();
  if (view.vb) renderPlan();
  renderChecklist();
});

/* ---------- Umfrage ---------- */

function renderSurvey() {
  const box = $('#survey');
  const url = CONFIG.formsUrl.trim();
  if (!url) {
    box.innerHTML = `
      <div class="placeholder">
        ${icon('chat')}
        <h2>Umfrage folgt</h2>
        <p>Hier kannst du uns bald sagen, wie dir der Infoday gefallen hat.</p>
      </div>`;
    return;
  }
  const embed = url.includes('embed=') ? url : `${url}${url.includes('?') ? '&' : '?'}embed=true`;
  box.innerHTML = `
    <iframe title="Umfrage zum Infoday" allowfullscreen></iframe>
    <div class="survey__bar"><a target="_blank" rel="noopener">${icon('external')} Umfrage im Browser öffnen</a></div>`;
  box.querySelector('iframe').src = embed;
  box.querySelector('a').href = url;
}

/* ---------- Tabs ---------- */

function showTab() {
  const tab = TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'plan';
  document.querySelectorAll('.panel').forEach((p) => { p.hidden = p.dataset.tab !== tab; });
  document.querySelectorAll('.tabbar a').forEach((a) => {
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  if (tab === 'plan') {
    layoutPlan();
    if (state.pendingFocus) {
      const id = state.pendingFocus;
      state.pendingFocus = null;
      focusStation(id);
    }
  }
}

window.addEventListener('hashchange', showTab);

/* ---------- Start ---------- */

document.querySelectorAll('[data-icon]').forEach((node) => node.insertAdjacentHTML('afterbegin', icon(node.dataset.icon)));
$('#event-date').textContent = CONFIG.datum;
renderSurvey();

try {
  await loadStations();
} catch (err) {
  console.error(err);
  $('#checklist').innerHTML = '<p class="error">Die Stationen konnten nicht geladen werden. Bitte Seite neu laden.</p>';
}
renderChecklist();
if (view.vb) renderPlan();
showTab();
