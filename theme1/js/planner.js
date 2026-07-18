/* Birthday & Anniversary Planner - vanilla JavaScript logic */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const MONTH_NAMES_SHORT = [
  "Jan","Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"
];

let allEvents = [];
let allQuotes = [];
let monthPhotos = {};  // Loaded from photos.json, optional mapping of month index (0-11) to image path/URL

/* Format a year/month as a page title, e.g. "January 2026". */
function monthLabel(year, month) {
  return `${MONTH_NAMES[month]} ${year}`;
}

/* Zero-pad a number to two digits, e.g. 3 -> "03". */
function pad2(n) {
  return String(n).padStart(2, "0");
}

function readStore(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function loadEvents() {
  allEvents = readStore("plannerEvents") || (Array.isArray(EVENTS_DATA) ? EVENTS_DATA : []);
}

function normalizeQuoteData(raw) {
  if (raw && typeof raw === "object" && "quotes" in raw) {
    const quotes = raw.quotes;
    if (quotes && typeof quotes === "object" && !Array.isArray(quotes)) return quotes;
    if (Array.isArray(quotes)) return { fallback: quotes };
  }
  if (Array.isArray(raw)) return { fallback: raw };
  if (raw && typeof raw === "object") return raw;
  return {};
}

function quoteOptionsForMonth(monthLabel) {
  const monthKey = String(monthLabel).toLowerCase();
  const direct = allQuotes[monthKey];
  if (Array.isArray(direct)) return direct;
  if (Array.isArray(allQuotes.fallback)) return allQuotes.fallback;

  const values = Object.values(allQuotes).flatMap((entry) => Array.isArray(entry) ? entry : []);
  return values;
}

/* Populate the From/To Month and Year dropdowns (years: current year to +10). */
function populateControls() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const monthOpts = MONTH_NAMES.map((name, i) => `<option value="${i}">${name}</option>`).join("");
  let yearOpts = "";
  for (let y = currentYear; y <= currentYear + 10; y++) yearOpts += `<option value="${y}">${y}</option>`;

  const fromMonth = document.getElementById("fromMonth");
  const fromYear = document.getElementById("fromYear");
  const toMonth = document.getElementById("toMonth");
  const toYear = document.getElementById("toYear");

  fromMonth.innerHTML = monthOpts;
  toMonth.innerHTML = monthOpts;
  fromYear.innerHTML = yearOpts;
  toYear.innerHTML = yearOpts;

  fromMonth.value = String(now.getMonth());
  fromYear.value = String(currentYear);
  toMonth.value = String(now.getMonth());
  toYear.value = String(currentYear + 1);
}

/* Total months since year 0, used to compare and iterate over ranges. */
function toAbsMonth(year, month) {
  return year * 12 + month;
}

/* Render a calendar page for every month in the selected From/To range. */
function renderCalendar() {
  const fromMonth = Number(document.getElementById("fromMonth").value);
  const fromYear = Number(document.getElementById("fromYear").value);
  let toMonth = Number(document.getElementById("toMonth").value);
  let toYear = Number(document.getElementById("toYear").value);

  const warning = document.getElementById("rangeWarning");
  if (toAbsMonth(toYear, toMonth) < toAbsMonth(fromYear, fromMonth)) {
    document.getElementById("toMonth").value = String(fromMonth);
    document.getElementById("toYear").value = String(fromYear);
    toMonth = fromMonth;
    toYear = fromYear;
    if (warning) {
      warning.textContent = "⚠️ \"To\" date was before \"From\" date, so it was adjusted to match the \"From\" date.";
      warning.style.display = "block";
    }
  } else if (warning) {
    warning.style.display = "none";
  }

  const container = document.getElementById("calendar");
  container.innerHTML = "";

  const eventsByMonthDay = groupEventsByMonthDay(allEvents);
  const start = toAbsMonth(fromYear, fromMonth);
  const end = toAbsMonth(toYear, toMonth);
  for (let abs = start; abs <= end; abs++) {
    const year = Math.floor(abs / 12);
    const month = abs % 12;
    container.appendChild(buildMonthCard({ year, month, label: monthLabel(year, month) }, eventsByMonthDay));
  }
}

/* Group events by "MM-DD" so each recurring date can be looked up for any month. */
function groupEventsByMonthDay(events) {
  const byMonthDay = {};
  events.forEach((ev) => {
    const key = ev.date.slice(5);
    (byMonthDay[key] = byMonthDay[key] || []).push(ev);
  });
  return byMonthDay;
}

/* Default icons assigned automatically based on the occasion type. */
const OCCASION_ICONS = {
  Birthday: "🎂",
  Anniversary: "💐",
  "Engagement Anniversary": "💍",
  "Death Anniversary": "🕯️",
  "other": "🌈"
};

function iconForOccasion(occasion) {
  return OCCASION_ICONS[occasion] || "🎉";
}

/* 🌸 Nature, flowers & cute stickers (Left side) */
const STICKERS_LEFT = [
  "🌺", "🌻", "🌷", "🌹", "💐",
  "🍀", "🌿", "🍃", "🌾", "🌱", 
  "🦋", "🐞", "🐝", "🐦", "🦜",
  "🐿️", "🦔", "🧸","🪷", 
  "☀️", "🌈", "⭐", "✨", "💫"
];

/* 🧘 Travel, yoga, fitness & adventure stickers (Right side) */
const STICKERS_RIGHT = [
  // Yoga & Wellness
  "🧘", "☯️",

  // Dance & Music
  "💃", "🕺", "🎶",

  // Fitness
  "💪", "🏃",
  "🚴", "🚵", "🤸", "🏋️",

  // Travel
  "✈️", "🧳", "🗺️",
  "🚗", "🚙", "🚂", "🚤", "🛶", "🚣",

  // Places
  "🏖️", "🏝️", "🏕️", "🏔️", "🏞️",
  "🌋", "🌉", "🗽", "🏰", "⛩️", "🛕",

  // Fun
  "🎡", "🎢", "🎠"
];

function randomSticker(fromLeft = true) {
  const stickers = fromLeft ? STICKERS_LEFT : STICKERS_RIGHT;
  return stickers[Math.floor(Math.random() * stickers.length)];
}

/* Append the correct ordinal suffix (1 -> 1st, 2 -> 2nd, 3 -> 3rd, 4 -> 4th). */
function ordinalSuffix(n) {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return n + "th";
  switch (n % 10) {
    case 1: return n + "st";
    case 2: return n + "nd";
    case 3: return n + "rd";
    default: return n + "th";
  }
}

/* Build the milestone string for an event in the year being rendered. */
function milestoneLabel(ev, renderYear) {
  if(ev.occasion === "other") return "";
  const start = Number(ev.date.slice(0, 4));
  if (!start) return "";
  const count = renderYear - start;
  if (count <= 0) return "";
  return `(${ordinalSuffix(count)} ${ev.occasion})`;
}

/* Combine an event's name with its milestone, e.g. "Emma & David (8th Anniversary)". */
function eventLabel(ev, renderYear) {
  const milestone = milestoneLabel(ev, renderYear);
  return milestone ? `${ev.name} ${milestone}` : ev.name;
}

/* Build the badge markup for a single event in a day cell. */
function eventBadge(ev, renderYear) {
  return `<div class="badge" style="background:${ev.color}"><span>${iconForOccasion(ev.occasion)}</span> ${eventLabel(ev, renderYear)}</div>`;
}

/* Sidebar list of days that hold more than one event, with full details. */
function overlapListHTML(overlaps, mo) {
  if (!overlaps.length) return "";
  const items = overlaps.map(({ day, events }) => {
    const dateStr = `${MONTH_NAMES_SHORT[mo.month]} ${day}`;
    return events.map((ev) =>
      `<div class="overlap-item"><span class="overlap-date">${dateStr}</span> <span>${iconForOccasion(ev.occasion)}</span> ${eventLabel(ev, mo.year)}</div>`
    ).join("");
  }).join("");
  return `<div class="overlap-list">${items}</div>`;
}

function buildMonthCard(mo, eventsByMonthDay) {
  const firstDay = new Date(mo.year, mo.month, 1).getDay();
  const totalDays = new Date(mo.year, mo.month + 1, 0).getDate();
  const overlaps = [];
  let cells = "";
  for (let i = 0; i < firstDay; i++) cells += `<div class="cell empty"></div>`;
  for (let d = 1; d <= totalDays; d++) {
    const key = `${pad2(mo.month + 1)}-${pad2(d)}`;
    const evs = eventsByMonthDay[key] || [];
    let content;
    if (evs.length > 1) {
      overlaps.push({ day: d, events: evs });
      content = `<div class="badge-icons">${evs.map((ev) => `<span>${iconForOccasion(ev.occasion)}</span>`).join("")}</div>`;
    } else {
      content = evs.map((ev) => eventBadge(ev, mo.year)).join("");
    }
    cells += `<div class="cell"><span class="date-num">${d}</span><div class="events">${content}</div></div>`;
  }
  const section = document.createElement("section");
  section.className = "month-card";
  section.innerHTML =
    `<span class="sticker sticker-tl">${randomSticker(true)}</span>` +
    `<span class="sticker sticker-tr">${randomSticker(false)}</span>` +
    `<header class="planner-header">` +
      `<h1>🎉 ${mo.label} 🎉</h1>` +
      `<p id="quote">${randomQuote(MONTH_NAMES[mo.month])}</p>` +
    `</header>` +
    `<div class="month-body">` +
      `<div class="cal-col">` +
        `<div class="weekdays">${WEEKDAYS.map((w) => `<div>${w}</div>`).join("")}</div>` +
        `<div class="grid">${cells}</div>` +
      `</div>` +
      `<aside class="sidebar">` +
      `<h3>📝 Notes for ${MONTH_NAMES[mo.month]}</h3>` +
        overlapListHTML(overlaps, mo) +
        `<div class="notes">${notesHTML()}</div>` +
      `</aside>` +
    `</div>` +
    `<footer class="month-footer">Made with Love ❤️</footer>`;
  return section;
}

function loadQuotes() {
  allQuotes = normalizeQuoteData(readStore("plannerQuotes") || (typeof CALENDAR_QUOTES !== "undefined" ? CALENDAR_QUOTES : (typeof QUOTES_DATA !== "undefined" ? QUOTES_DATA : {})));
}

/* Return a random quote string wrapped in quotation marks, or "" if none. */
function randomQuote(monthLabel) {
  const monthQuotes = quoteOptionsForMonth(monthLabel);
  if (!monthQuotes.length) return "";
  const q = monthQuotes[Math.floor(Math.random() * monthQuotes.length)];
  const text = typeof q === "string" ? q : (q.quote || q.text || "");
  return `“${text}”`;
}

function printPlanner() {
  window.print();
}

/* Number of blank dotted lines shown in each month's notes sidebar. */
const NOTE_LINE_COUNT = 20;

function notesHTML() {
  return Array.from({ length: NOTE_LINE_COUNT }, () => `<div class="note-line"></div>`).join("");
}

function loadPhotos() {
  monthPhotos = readStore("plannerPhotos") || (typeof PHOTOS_DATA !== "undefined" ? PHOTOS_DATA : (typeof PHOTOS !== "undefined" ? PHOTOS.photos : {}));
}

/* Polaroid-style photo for a month; shows a placeholder when none is set. */ 
function photoHTML(month) { 
  const src = monthPhotos[month]; const inner = src ? `<img src="${src}" alt="${MONTH_NAMES[month]} photo">` : `<div class="photo-placeholder">📷<span>Add a photo</span></div>`; return `<div class="month-photo">${inner}<span class="photo-caption">${MONTH_NAMES[month]}</span></div>`; 
}

async function init() {
  loadEvents();
  loadQuotes();
  loadPhotos();
  populateControls();
  ["fromMonth", "fromYear", "toMonth", "toYear"].forEach((id) =>
    document.getElementById(id).addEventListener("change", renderCalendar));
  document.getElementById("printBtn").addEventListener("click", printPlanner);
  renderCalendar();
}

document.addEventListener("DOMContentLoaded", init);
