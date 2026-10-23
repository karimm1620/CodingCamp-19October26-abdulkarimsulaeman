// greetingWidget.js — Greeting Widget module

import { load, save } from './storage.js';

const NAME_KEY = 'tld_user_name';

// ─── Pure helper functions ────────────────────────────────────────────────────

/**
 * Maps a 0–23 hour integer to one of four greeting strings.
 * @param {number} hour - Integer in the range 0–23
 * @returns {string}
 */
export function getGreetingForHour(hour) {
  if (hour >= 5 && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 17) return 'Good Afternoon';
  if (hour >= 18 && hour <= 20) return 'Good Evening';
  // hours 21–23 and 00–04 all map to Good Night
  return 'Good Night';
}

/**
 * Formats a Date object as a zero-padded 24-hour HH:MM string.
 * Returns "--:--" if the Date is invalid.
 * @param {Date} date
 * @returns {string}
 */
export function formatTime(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '--:--';
  }
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Formats a Date object as "Weekday, DD Month YYYY" (e.g., "Monday, 26 October 2025").
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// ─── DOM rendering ────────────────────────────────────────────────────────────

/**
 * Returns the stored user name, or an empty string if none is set.
 * @returns {string}
 */
function getUserName() {
  const name = load(NAME_KEY, '');
  return typeof name === 'string' ? name.trim() : '';
}

/**
 * Reads the current system time, formats it, and writes to the #greeting-widget DOM elements.
 * Falls back to "--:--" and hides date/greeting if the clock returns an invalid value.
 */
function renderGreeting() {
  const date = new Date();

  const timeEl    = document.getElementById('time-display');
  const dateEl    = document.getElementById('date-display');
  const greetEl   = document.getElementById('greeting-text');

  if (isNaN(date.getTime())) {
    // Clock unavailable — show placeholder, hide date and greeting
    if (timeEl)  timeEl.textContent  = '--:--';
    if (dateEl)  dateEl.textContent  = '';
    if (greetEl) greetEl.textContent = '';
    return;
  }

  if (timeEl)  {
    const timeStr = formatTime(date);
    timeEl.textContent = timeStr;
    timeEl.setAttribute('aria-label', `Current time: ${timeStr}`);
  }
  if (dateEl)  {
    const dateStr = formatDate(date);
    dateEl.textContent = dateStr;
    dateEl.setAttribute('aria-label', `Current date: ${dateStr}`);
  }
  if (greetEl) {
    const base = getGreetingForHour(date.getHours());
    const name = getUserName();
    greetEl.textContent = name ? `${base}, ${name}!` : `${base}!`;
  }
}

// ─── Name editor ──────────────────────────────────────────────────────────────

/**
 * Wires up the name-edit form inside #greeting-widget.
 * Saves the name to localStorage on submit and re-renders the greeting.
 */
function attachNameEditor() {
  const form    = document.getElementById('greeting-name-form');
  const input   = document.getElementById('greeting-name-input');
  const display = document.getElementById('greeting-name-display');
  const editBtn = document.getElementById('greeting-name-edit-btn');

  if (!form || !input || !display || !editBtn) return;

  // Populate the display and input with any stored name
  const stored = getUserName();
  if (stored) {
    display.textContent = stored;
  }

  // Show form / hide display when "Edit" is clicked
  editBtn.addEventListener('click', () => {
    input.value = getUserName();
    form.classList.remove('hidden');
    editBtn.classList.add('hidden');
    display.classList.add('hidden');
    input.focus();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const trimmed = input.value.trim();
    save(NAME_KEY, trimmed);

    display.textContent = trimmed || '';
    form.classList.add('hidden');
    editBtn.classList.remove('hidden');
    display.classList.remove('hidden');

    // Re-render greeting immediately
    renderGreeting();
  });

  // Allow cancelling with Escape
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      form.classList.add('hidden');
      editBtn.classList.remove('hidden');
      display.classList.remove('hidden');
    }
  });
}

// ─── Public interface ─────────────────────────────────────────────────────────

/**
 * Bootstraps the Greeting Widget: renders immediately, then refreshes every 60 seconds.
 */
export function init() {
  attachNameEditor();
  renderGreeting();
  setInterval(renderGreeting, 60_000);
}
