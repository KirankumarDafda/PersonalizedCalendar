/* Personal Calendar — Theme 2 (desk-calendar design, two months per A4 page). */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/* Number of month blocks placed on a single A4 page. */
const BLOCKS_PER_PAGE = 2;

let allEvents = [];
let allQuotes = [];
let monthPhotos = {};

/* Zero-pad a number to two digits, e.g. 3 -> "03". */
function pad2(n) {
  return String(n).padStart(2, "0");
}

/* Read and JSON-parse a localStorage key, returning null if missing/invalid. */
function readStore(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
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

/* Load working state, preferring data saved from the home page (localStorage)
   and falling back to the bundled data (events.js, quotes.js, photos.js). */
function loadData() {
  allEvents = readStore("plannerEvents") || (typeof EVENTS_DATA !== "undefined" ? EVENTS_DATA : []);
  allQuotes = normalizeQuoteData(readStore("plannerQuotes") || (typeof CALENDAR_QUOTES !== "undefined" ? CALENDAR_QUOTES : (typeof QUOTES_DATA !== "undefined" ? QUOTES_DATA : {})));
  monthPhotos = readStore("plannerPhotos") || (typeof PHOTOS_DATA !== "undefined" ? PHOTOS_DATA : {});
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
  toMonth.value = String(now.getMonth()+1);
  toYear.value = String(currentYear + 1);
}

/* Total months since year 0, used to compare and iterate over ranges. */
function toAbsMonth(year, month) {
  return year * 12 + month;
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
  "Death Anniversary": "🕯️"
};

function iconForOccasion(occasion) {
  return OCCASION_ICONS[occasion] || "🎉";
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

/* Return a random quote string wrapped in quotation marks, or "" if none. */
function randomQuote() {
  const monthQuotes = quoteOptionsForMonth(MONTH_NAMES[new Date().getMonth()]);
  if (!monthQuotes.length) return "";
  const q = monthQuotes[Math.floor(Math.random() * monthQuotes.length)];
  const text = typeof q === "string" ? q : (q.quote || q.text || "");
  return `“${text}”`;
}

/* Photo or a placeholder for a month. */
function photoHTML(month) {
  const src = monthPhotos[month];
  const media = src
    ? `<img src="${src}" alt="${MONTH_NAMES[month]} photo">`
    : `<div class="photo-placeholder">📷<span>Add a photo</span></div>`;
  return (
    `<div class="photo-wrap">${media}` +
    `</div>`
  );
}

/* "Celebrations" date listing for a single month, sorted by day. */
function eventsListHTML(mo, eventsByMonthDay) {
  const totalDays = new Date(mo.year, mo.month + 1, 0).getDate();
  const items = [];
  for (let d = 1; d <= totalDays; d++) {
    const evs = eventsByMonthDay[`${pad2(mo.month + 1)}-${pad2(d)}`] || [];
    evs.forEach((ev) => {
      items.push(
        `<li><span class="ev-day">${d}</span>` +
        `<span class="ev-ico">${iconForOccasion(ev.occasion)}</span>` +
        `<span class="ev-name">${eventLabel(ev, mo.year)}</span></li>`
      );
    });
  }
  const body = items.length
    ? `<ul>${items.join("")}</ul>`
    : `<div class="no-events">No special dates this month.</div>`;
  return `<div class="events-card"><h4>✨ Important Dates</h4>${body}</div>`;
}

/* Build the 7-column day grid, greying out leading/trailing adjacent-month days. */
function daysGridHTML(mo, eventsByMonthDay) {
  const firstDay = new Date(mo.year, mo.month, 1).getDay();
  const totalDays = new Date(mo.year, mo.month + 1, 0).getDate();
  const prevDays = new Date(mo.year, mo.month, 0).getDate();
  let cells = "";

  for (let i = firstDay - 1; i >= 0; i--) {
    cells += `<div class="day other">${prevDays - i}</div>`;
  }
  for (let d = 1; d <= totalDays; d++) {
    const evs = eventsByMonthDay[`${pad2(mo.month + 1)}-${pad2(d)}`] || [];
    const dots = evs.length
      ? `<span class="dots">${evs.map((ev) => `<span class="dot" style="background:${ev.color}"></span>`).join("")}</span>`
      : "";
    cells += `<div class="day${evs.length ? " has-event" : ""}">${d}${dots}</div>`;
  }
  const trailing = (7 - ((firstDay + totalDays) % 7)) % 7;
  for (let d = 1; d <= trailing; d++) {
    cells += `<div class="day other">${d}</div>`;
  }
  return `<div class="days-grid">${cells}</div>`;
}

/* Build one month block matching the shared desk-calendar design. */
function buildCalBlock(mo, eventsByMonthDay) {
  const block = document.createElement("div");
  block.className = "cal-block";
  block.innerHTML =
    `<div class="cal-inner">` +
      `<div class="left-panel">` +
        photoHTML(mo.month) +
        eventsListHTML(mo, eventsByMonthDay) +
        `<div class="quote">${randomQuote()}</div>` +
      `</div>` +
      `<div class="right-panel">` +
        `<div class="cal-head">` +
          `<span class="month-name">${MONTH_NAMES[mo.month]}</span>` +
          `<span class="year">${mo.year}</span>` +
        `</div>` +
        `<div class="weekdays">${WEEKDAYS.map((w) => `<div>${w}</div>`).join("")}</div>` +
        daysGridHTML(mo, eventsByMonthDay) +
      `</div>` +
    `</div>`;
  return block;
}

/* Render every month in the selected range, two blocks to an A4 page. */
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

  let page = null;
  let count = 0;
  for (let abs = start; abs <= end; abs++) {
    if (count % BLOCKS_PER_PAGE === 0) {
      page = document.createElement("section");
      page.className = "page";
      container.appendChild(page);
    }
    const mo = { year: Math.floor(abs / 12), month: abs % 12 };
    page.appendChild(buildCalBlock(mo, eventsByMonthDay));
    count++;
  }
}

function printPlanner() {
  window.print();
}

function init() {
  loadData();
  populateControls();
  ["fromMonth", "fromYear", "toMonth", "toYear"].forEach((id) =>
    document.getElementById(id).addEventListener("change", renderCalendar));
  document.getElementById("printBtn").addEventListener("click", printPlanner);
  renderCalendar();
}

document.addEventListener("DOMContentLoaded", init);
