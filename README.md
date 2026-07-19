# 🎉 Birthday & Anniversary Planner

A self-hosted, printable birthday & anniversary planner built with plain **HTML, CSS, and vanilla JavaScript** — no frameworks, no build step, no external libraries. Events, quotes, and month photos are defined in editable JavaScript data files, and the calendar renders one full-page month at a time, ready to print as a professional A4-landscape planner.

## Live Application

- [Personalized Calendar](https://personalized-calendar.vercel.app/)

## ✨ Features

- **Data-driven calendar** – events are read from `data/events.js`; add an entry and it appears automatically, no HTML changes required.
- **Custom date range** – pick any *From* and *To* month **and** year (current year up to +10 years) from the toolbar dropdowns; the calendar regenerates instantly. If the *To* date is before the *From* date it is auto-corrected and a warning is shown.
- **Milestone labels** – every event shows its milestone for the year being rendered, e.g. `John Smith (30th Birthday)` or `Emma & David (9th Anniversary)`, calculated from the year in the event's date.
- **Automatic icons & colors** – icons are mapped by occasion (🎂 Birthday, 💍 Anniversary, 💐 Engagement Anniversary, 🕯️ Death Anniversary; fallback 🎉) and each badge uses the `color` value from the event data. Support any new occasion type by adding a key to the `OCCASION_ICONS` map in `js/planner.js`.
- **Overlap handling** – days with multiple events show a compact row of icons in the cell, and the full details are listed in that month's Notes sidebar.
- **Per-month Notes sidebar** – a random inspirational quote (from `data/quotes.js`), the overlapping-event details, and dotted lines for handwritten notes after printing.
- **Decorative stickers** – random flower stickers in the top corners of every month page.
- **Print-ready** – `@media print` styling outputs one month per A4-landscape page, keeps colors, removes shadows, and prevents months from breaking across pages.
- **Works offline** – all data is bundled as plain JS files, so the planner runs by opening `index.html` directly — no local server or `fetch()` needed. Months without a configured photo show a placeholder.

## 📁 Project structure

```
Reminder Calendar/
├── data/               # Shared data, used by every theme
│   ├── events.js       # Birthday & anniversary entries (EVENTS_DATA)
│   ├── quotes.js       # Inspirational quotes (QUOTES_DATA)
│   └── photos.js       # Optional per-month photos (PHOTOS_DATA)
├── theme1/             # Theme 1: one full month per A4-landscape page
│   ├── index.html      # Markup + all CSS (layout, cards, print styles)
│   └── js/planner.js   # Vanilla JS: data loading, rendering, printing
└── theme2/             # Theme 2: desk-calendar look, two months per A4-portrait page
    ├── index.html      # Markup + all CSS (gradient card, photo, calendar, print)
    └── js/planner.js   # Vanilla JS: rendering, date listing, quotes, pagination
```

## 🎨 Themes

Both themes share the same `data/` files, so an event, quote, or photo you add
shows up in every theme automatically. Open the `index.html` of the theme you want.

- **Theme 1 (`theme1/index.html`)** – classic planner: one full month per
  A4-landscape page with a large day grid, a per-month notes sidebar, flower
  stickers, a polaroid photo, and a random quote.
- **Theme 2 (`theme2/index.html`)** – inspired by a printed **desk calendar**:
  each month is a card with a purple→blue gradient border, a photo (with an
  editable brand-logo overlay) on the left, an elegant pink month name & year,
  a clean 7-column grid that greys out the leading/trailing days of the adjacent
  months, and coloured dots marking celebration days. A **"✨ Celebrations"
  date listing** (every birthday/anniversary that month with its milestone) and
  a **random quote** sit under the photo. Two month cards are placed on each
  **A4-portrait** page. Edit the brand shown on the photo via the `BRAND`
  constant, and the months-per-page via `BLOCKS_PER_PAGE`, in `theme2/js/planner.js`.

## 🚀 Running it

The data is bundled as plain JavaScript, so you can just open a theme's `index.html`
(`theme1/index.html` or `theme2/index.html`) in your browser — no build step or local
server required. (The sample month photos are loaded from picsum.photos, so those specific
images need an internet connection.)

To serve it over HTTP instead, run from the project root:

```bash
# Python 3
python -m http.server 8000
```

Then open <http://localhost:8000/> in your browser. Any static file server works.

## 🗂️ Data format

### `data/events.js`

```js
const EVENTS_DATA = [
  { name: "John Smith",   occasion: "Birthday",    date: "1995-07-12", color: "#D6EEFF" },
  { name: "Emma & David", occasion: "Anniversary", date: "2016-07-18", color: "#FFE4EC" }
];
```

- `date` uses `YYYY-MM-DD`; the **year** is the original event year and drives the milestone label (e.g. a 2016 `Death Anniversary` shows `(10th Death Anniversary)` in 2026).
- `occasion` is free-form text. The icon is chosen from the `OCCASION_ICONS` map in `js/planner.js` (falling back to 🎉), so no `icon` field is needed — add a new key there to give a new occasion its own icon.
- Adding a new event only requires appending another object to the array.

Supported occasions out of the box: `Birthday`, `Anniversary`, `Engagement Anniversary`, `Death Anniversary`. Example entries:

```js
{ name: "Emma & David", occasion: "Engagement Anniversary", date: "2018-02-14", color: "#FFF3D6" },
{ name: "Grandpa Joe",  occasion: "Death Anniversary",      date: "2015-11-03", color: "#EDEDED" }
```

### `data/quotes.js`

```js
const QUOTES_DATA = [
  { id: 1, category: "Motivation", quote: "Every small step moves you closer to your dreams." }
];
```

A random `quote` is displayed under each month's title.

### `data/photos.js`

```js
const PHOTOS_DATA = {
  "6": "data/photos/july.jpg",            // local file
  "11": "https://example.com/winter.jpg"  // or a URL
};
```

Maps a month index (`0` = January … `11` = December) to an image path or URL. Any month left out shows a placeholder.

## 🧩 Key functions (`js/planner.js`)

| Function | Purpose |
| --- | --- |
| `loadData()` | Copy the bundled JS data (events, quotes, photos) into state. |
| `populateControls()` | Fill the From/To month & year dropdowns. |
| `renderCalendar()` | Build a month page for every month in the selected range. |
| `buildMonthCard()` | Render a single month: grid, badges, stickers, quote, photo, and notes sidebar. |
| `photoHTML()` | Build the polaroid photo (or placeholder) for a month. |
| `milestoneLabel()` | Compute the `(Nth Occasion)` label for the rendered year. |
| `printPlanner()` | Open the browser print dialog. |

## 🖨️ Printing

Click **🖨️ Print PDF** (or use the browser's print dialog) and choose *Save as PDF*. Each month prints on its own A4-landscape page with colors preserved and the notes sidebar intact.

## 🛠️ Tech

HTML • CSS • Vanilla JavaScript. No frameworks, no CDNs, no build tooling.
