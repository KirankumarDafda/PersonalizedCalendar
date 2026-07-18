const STORAGE_KEYS = {
  events: "plannerEvents",
  quotes: "plannerQuotes",
  photos: "plannerPhotos"
};

const MONTH_NAMES = [
  "january","february","march","april","may","june",
  "july","august","september","october","november","december"
];

let currentEvents = [];
let currentQuotes = { quotes: {} };
let currentPhotos = {};
let editEventIndex = -1;
let editQuoteMonth = "";
let editQuoteIndex = -1;

function safeParse(raw) {
  try { return raw ? JSON.parse(raw) : null; } catch (err) { return null; }
}

function normalizeQuoteData(raw) {
  if (!raw) return { quotes: {} };
  if (raw && typeof raw === "object") {
    if (raw.quotes && typeof raw.quotes === "object" && !Array.isArray(raw.quotes)) {
      return { quotes: raw.quotes };
    }
    const monthObject = {};
    Object.entries(raw).forEach(([key, value]) => {
      const keyLower = String(key).toLowerCase();
      if (Array.isArray(value)) {
        monthObject[keyLower] = value.map((quote) => String(quote || ""));
      } else if (typeof value === "string") {
        monthObject[keyLower] = [value];
      }
    });
    if (Object.keys(monthObject).length) {
      return { quotes: monthObject };
    }
  }
  if (Array.isArray(raw)) {
    return { quotes: { fallback: raw.map((item) => String(item || "")) } };
  }
  return { quotes: {} };
}

function getQuoteRows() {
  const rows = [];
  const quotes = (currentQuotes && currentQuotes.quotes) ? currentQuotes.quotes : {};
  Object.entries(quotes).forEach(([month, items]) => {
    if (!Array.isArray(items)) return;
    items.forEach((quote, index) => {
      rows.push({ month, quote: String(quote || ""), index });
    });
  });
  return rows;
}

function loadInitialData() {
  currentEvents = safeParse(localStorage.getItem(STORAGE_KEYS.events)) || (typeof EVENTS_DATA !== "undefined" ? EVENTS_DATA.slice() : []);
  const storedQuotes = safeParse(localStorage.getItem(STORAGE_KEYS.quotes));
  const defaultQuotes = typeof CALENDAR_QUOTES !== "undefined" ? CALENDAR_QUOTES : (typeof QUOTES_DATA !== "undefined" ? QUOTES_DATA : null);
  currentQuotes = normalizeQuoteData(storedQuotes || defaultQuotes);
  currentPhotos = safeParse(localStorage.getItem(STORAGE_KEYS.photos)) || (typeof PHOTOS_DATA !== "undefined" ? PHOTOS_DATA : {});
}

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function renderEventsTable() {
  const tbody = document.querySelector("#evTable tbody");
  tbody.innerHTML = currentEvents.map((ev, index) => `
    <tr>
      <td>${ev.name || ""}</td>
      <td>${ev.occasion || ""}</td>
      <td>${formatDate(ev.date)}</td>
      <td><span class="swatch" style="background:${ev.color || '#ffffff'}"></span>${ev.color || ""}</td>
      <td class="row-actions">
        <button class="btn btn-mini" type="button" data-action="edit-event" data-index="${index}">Edit</button>
        <button class="btn btn-mini btn-ghost" type="button" data-action="delete-event" data-index="${index}">Delete</button>
      </td>
    </tr>`).join("");
}

function formatMonthLabel(monthKey) {
  return monthKey ? monthKey.charAt(0).toUpperCase() + monthKey.slice(1) : "";
}

function renderQuotesTable() {
  const tbody = document.querySelector("#qTable tbody");
  const rows = getQuoteRows();
  tbody.innerHTML = rows.map((row) => `
    <tr>
      <td>${formatMonthLabel(row.month)}</td>
      <td>${row.quote}</td>
      <td class="row-actions">
        <button class="btn btn-mini" type="button" data-action="edit-quote" data-month="${row.month}" data-index="${row.index}">Edit</button>
        <button class="btn btn-mini btn-ghost" type="button" data-action="delete-quote" data-month="${row.month}" data-index="${row.index}">Delete</button>
      </td>
    </tr>`).join("");
}

function renderPhotosGrid() {
  const container = document.getElementById("photosGrid");
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  container.innerHTML = months.map((month, monthIndex) => `
    <div class="photo-item">
      <label for="photo-${monthIndex}">${month}</label>
      <input type="text" id="photo-${monthIndex}" data-month="${monthIndex}" value="${currentPhotos[monthIndex] || ""}" placeholder="Image URL or path">
    </div>
  `).join("");
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(currentEvents));
  localStorage.setItem(STORAGE_KEYS.quotes, JSON.stringify(currentQuotes));
  localStorage.setItem(STORAGE_KEYS.photos, JSON.stringify(currentPhotos));
  const status = document.getElementById("status");
  if (status) {
    status.textContent = "Saved successfully.";
    status.classList.remove("warn");
    setTimeout(() => { status.textContent = ""; }, 2400);
  }
}

function resetToDefaults() {
  localStorage.removeItem(STORAGE_KEYS.events);
  localStorage.removeItem(STORAGE_KEYS.quotes);
  localStorage.removeItem(STORAGE_KEYS.photos);
  loadInitialData();
  renderAll();
}

function clearEventForm() {
  document.getElementById("evName").value = "";
  document.getElementById("evOccasion").value = "";
  document.getElementById("evDate").value = "";
  document.getElementById("evColor").value = "#D6EEFF";
  document.getElementById("evCancelBtn").style.display = "none";
  document.getElementById("evAddBtn").textContent = "➕ Add";
  editEventIndex = -1;
}

function clearQuoteForm() {
  document.getElementById("qMonth").value = MONTH_NAMES[0];
  document.getElementById("qText").value = "";
  document.getElementById("qCancelBtn").style.display = "none";
  document.getElementById("qAddBtn").textContent = "➕ Add";
  editQuoteMonth = "";
  editQuoteIndex = -1;
}

function renderAll() {
  renderEventsTable();
  renderQuotesTable();
  renderPhotosGrid();
}

function initFormHandlers() {
  document.getElementById("evAddBtn").addEventListener("click", (event) => {
    event.preventDefault();
    const name = document.getElementById("evName").value.trim();
    const occasion = document.getElementById("evOccasion").value.trim();
    const date = document.getElementById("evDate").value;
    const color = document.getElementById("evColor").value;
    if (!name || !occasion || !date) return;
    const eventObj = { name, occasion, date, color };
    if (editEventIndex >= 0) {
      currentEvents[editEventIndex] = eventObj;
    } else {
      currentEvents.push(eventObj);
    }
    saveToStorage();
    renderEventsTable();
    clearEventForm();
  });

  document.getElementById("evCancelBtn").addEventListener("click", (event) => {
    event.preventDefault();
    clearEventForm();
  });

  document.getElementById("qAddBtn").addEventListener("click", (event) => {
    event.preventDefault();
    const month = document.getElementById("qMonth").value;
    const quoteText = document.getElementById("qText").value.trim();
    if (!month || !quoteText) return;
    if (!currentQuotes.quotes[month]) currentQuotes.quotes[month] = [];

    if (editQuoteIndex >= 0 && editQuoteMonth) {
      const targetMonth = editQuoteMonth;
      currentQuotes.quotes[targetMonth][editQuoteIndex] = quoteText;
      if (targetMonth !== month) {
        currentQuotes.quotes[month].push(quoteText);
        currentQuotes.quotes[targetMonth].splice(editQuoteIndex, 1);
      }
    } else {
      currentQuotes.quotes[month].push(quoteText);
    }

    saveToStorage();
    renderQuotesTable();
    clearQuoteForm();
  });

  document.getElementById("qCancelBtn").addEventListener("click", (event) => {
    event.preventDefault();
    clearQuoteForm();
  });

  document.getElementById("saveBtn").addEventListener("click", (event) => {
    event.preventDefault();
    currentPhotos = Array.from(document.querySelectorAll('#photosGrid input')).reduce((acc, input) => {
      if (input.value.trim()) acc[input.dataset.month] = input.value.trim();
      return acc;
    }, {});
    saveToStorage();
    renderPhotosGrid();
  });

  document.getElementById("resetBtn").addEventListener("click", (event) => {
    event.preventDefault();
    resetToDefaults();
  });

  document.getElementById("evTable").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const index = Number(button.dataset.index);
    if (button.dataset.action === "edit-event") {
      const ev = currentEvents[index];
      document.getElementById("evName").value = ev.name;
      document.getElementById("evOccasion").value = ev.occasion;
      document.getElementById("evDate").value = ev.date;
      document.getElementById("evColor").value = ev.color;
      document.getElementById("evCancelBtn").style.display = "inline-block";
      document.getElementById("evAddBtn").textContent = "Save";
      editEventIndex = index;
    }
    if (button.dataset.action === "delete-event") {
      currentEvents.splice(index, 1);
      saveToStorage();
      renderEventsTable();
    }
  });

  document.getElementById("qTable").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const month = button.dataset.month;
    const index = Number(button.dataset.index);
    if (button.dataset.action === "edit-quote") {
      const quote = currentQuotes.quotes[month] ? currentQuotes.quotes[month][index] : "";
      document.getElementById("qMonth").value = month;
      document.getElementById("qText").value = quote;
      document.getElementById("qCancelBtn").style.display = "inline-block";
      document.getElementById("qAddBtn").textContent = "Save";
      editQuoteMonth = month;
      editQuoteIndex = index;
      document.getElementById("qMonth").scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById("qText").focus();
    }
    if (button.dataset.action === "delete-quote") {
      if (currentQuotes.quotes[month]) {
        currentQuotes.quotes[month].splice(index, 1);
        if (!currentQuotes.quotes[month].length) delete currentQuotes.quotes[month];
      }
      saveToStorage();
      renderQuotesTable();
    }
  });
}

function init() {
  loadInitialData();
  renderAll();
  initFormHandlers();
}

document.addEventListener("DOMContentLoaded", init);
