// quickLinks.js — Quick Links module

import { save, load } from './storage.js';

// ---------------------------------------------------------------------------
// Constants & state
// ---------------------------------------------------------------------------

const LINKS_KEY = 'tld_links';

/** @type {Array<{ id: string, label: string, url: string, createdAt: number }>} */
let links = [];

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Validates a link's label and URL against all rules.
 *
 * @param {string} label
 * @param {string} url
 * @returns {{ valid: boolean, errors: { label?: string, url?: string } }}
 */
export function validateLink(label, url) {
  const errors = {};

  // --- Label validation ---
  const trimmedLabel = typeof label === 'string' ? label.trim() : '';
  if (trimmedLabel.length === 0) {
    errors.label = 'Label is required.';
  } else if (trimmedLabel.length > 200) {
    errors.label = 'Label must be 200 characters or fewer.';
  }

  // --- URL validation ---
  const trimmedUrl = typeof url === 'string' ? url.trim() : '';
  if (trimmedUrl.length === 0) {
    errors.url = 'URL is required.';
  } else if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    errors.url = 'URL must begin with http:// or https://.';
  } else if (trimmedUrl.length > 2048) {
    errors.url = 'URL must be 2048 characters or fewer.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/**
 * Serialises the in-memory links array to localStorage.
 * Shows the global storage-error banner when the write fails.
 */
function persist() {
  const ok = save(LINKS_KEY, links);
  if (!ok) {
    const banner = document.getElementById('storage-error-banner');
    const msg    = document.getElementById('storage-error-message');
    if (banner) banner.classList.remove('hidden');
    if (msg)    msg.textContent =
      'Your data could not be saved. Changes may be lost if you close this tab.';
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/**
 * Opens a URL in a new browser tab, with rel="noopener noreferrer" protection.
 *
 * @param {string} url
 */
function openLink(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Creates and returns the DOM element for a single link — a button that
 * opens the URL and a delete control.  Does NOT append to the DOM itself.
 *
 * @param {{ id: string, label: string, url: string }} link
 * @returns {HTMLDivElement}
 */
function renderLink(link) {
  const item = document.createElement('div');
  item.dataset.id = link.id;
  item.classList.add('link-item');
  item.setAttribute('role', 'listitem');

  // Link launch button
  const launchBtn = document.createElement('button');
  launchBtn.type      = 'button';
  launchBtn.className = 'link-launch-btn';
  launchBtn.textContent = link.label;
  launchBtn.setAttribute('aria-label', `Open ${link.label}`);
  launchBtn.addEventListener('click', () => openLink(link.url));

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.type      = 'button';
  deleteBtn.className = 'link-delete-btn';
  deleteBtn.dataset.action = 'delete';
  deleteBtn.setAttribute('aria-label', `Delete ${link.label}`);
  deleteBtn.textContent = '×';

  item.append(launchBtn, deleteBtn);
  return item;
}

/**
 * Clears the `#link-items` container and re-renders every link from the
 * in-memory array.
 */
function renderAll() {
  const container = document.getElementById('link-items');
  if (!container) return;

  container.innerHTML = '';
  for (const link of links) {
    container.appendChild(renderLink(link));
  }
}

// ---------------------------------------------------------------------------
// Link operations
// ---------------------------------------------------------------------------

/**
 * Validates inputs, enforces the 50-link cap, creates a new Link object,
 * persists, and re-renders.  Shows inline validation messages on failure.
 *
 * @param {string} label
 * @param {string} url
 * @returns {boolean} `true` if the link was added, `false` if rejected.
 */
function addLink(label, url) {
  const labelErrorEl = document.getElementById('link-label-error');
  const urlErrorEl   = document.getElementById('link-url-error');

  // Clear previous errors
  if (labelErrorEl) { labelErrorEl.textContent = ''; labelErrorEl.classList.add('hidden'); }
  if (urlErrorEl)   { urlErrorEl.textContent   = ''; urlErrorEl.classList.add('hidden');   }

  const { valid, errors } = validateLink(label, url);

  if (!valid) {
    if (errors.label && labelErrorEl) {
      labelErrorEl.textContent = errors.label;
      labelErrorEl.classList.remove('hidden');
    }
    if (errors.url && urlErrorEl) {
      urlErrorEl.textContent = errors.url;
      urlErrorEl.classList.remove('hidden');
    }
    return false;
  }

  // Enforce the 50-link cap
  if (links.length >= 50) {
    if (labelErrorEl) {
      labelErrorEl.textContent = 'You have reached the maximum of 50 links.';
      labelErrorEl.classList.remove('hidden');
    }
    return false;
  }

  const id = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : Date.now().toString();

  links.push({
    id,
    label: label.trim(),
    url:   url.trim(),
    createdAt: Date.now(),
  });

  persist();
  renderAll();
  return true;
}

/**
 * Removes the matching link from the array, persists, and removes its
 * DOM element.
 *
 * @param {string} id
 */
function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  persist();

  const item = document.querySelector(`div[data-id="${id}"].link-item`);
  if (item) item.remove();
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------

/**
 * Attaches all event listeners for the Quick Links widget.
 * Called once during module initialisation.
 */
function attachEventListeners() {
  // ── Form submit ──────────────────────────────────────────────────────────
  const form       = document.getElementById('link-add-form');
  const labelInput = document.getElementById('link-label-input');
  const urlInput   = document.getElementById('link-url-input');

  if (form && labelInput && urlInput) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const added = addLink(labelInput.value, urlInput.value);
      if (added) {
        labelInput.value = '';
        urlInput.value   = '';
      }
    });
  }

  // ── Delegated click for delete buttons ──────────────────────────────────
  const linkItems = document.getElementById('link-items');
  if (!linkItems) return;

  linkItems.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action="delete"]');
    if (!btn) return;

    const item = btn.closest('div[data-id]');
    if (!item) return;

    deleteLink(item.dataset.id);
  });
}

// ---------------------------------------------------------------------------
// Public init
// ---------------------------------------------------------------------------

/**
 * Bootstraps the Quick Links widget.
 * Loads persisted links from localStorage and renders them, then attaches
 * all event listeners.
 *
 * Requirements: 4.7, 4.8, 5.3, 5.5
 */
export function init() {
  links = load(LINKS_KEY, []);
  if (!Array.isArray(links)) links = [];
  renderAll();
  attachEventListeners();
}
