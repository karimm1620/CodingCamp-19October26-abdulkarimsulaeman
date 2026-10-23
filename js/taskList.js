// taskList.js — Task List module

import { save, load } from './storage.js';

// ---------------------------------------------------------------------------
// Constants & state
// ---------------------------------------------------------------------------

const TASK_KEY = 'tld_tasks';
const SORT_KEY = 'tld_tasks_sort';

/** @type {import('./taskList.js').Task[]} */
let tasks = [];

/** @type {'date-asc' | 'date-desc' | 'alpha-asc' | 'alpha-desc' | 'status'} */
let currentSort = 'date-asc';

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Validates a raw task description string.
 *
 * @param {string} raw - The raw input string to validate.
 * @returns {{ valid: boolean, trimmed: string, error: string }}
 */
export function validateDescription(raw) {
  const trimmed = typeof raw === 'string' ? raw.trim() : '';

  if (trimmed.length === 0) {
    return { valid: false, trimmed, error: 'Task description cannot be empty.' };
  }

  if (trimmed.length > 250) {
    return { valid: false, trimmed, error: 'Task description must be 250 characters or fewer.' };
  }

  return { valid: true, trimmed, error: '' };
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/**
 * Serialises the in-memory task array to localStorage.
 * Shows the global storage-error banner when the write fails.
 */
function persist() {
  const ok = save(TASK_KEY, tasks);
  if (!ok) {
    const banner = document.getElementById('storage-error-banner');
    const msg    = document.getElementById('storage-error-message');
    if (banner) banner.classList.remove('hidden');
    if (msg)    msg.textContent =
      'Your data could not be saved. Changes may be lost if you close this tab.';
  }
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

/**
 * Returns a sorted copy of the tasks array based on `currentSort`.
 * The original array is never mutated.
 * @returns {Array}
 */
function getSortedTasks() {
  const sorted = [...tasks];
  switch (currentSort) {
    case 'date-asc':
      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case 'date-desc':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case 'alpha-asc':
      return sorted.sort((a, b) =>
        a.description.localeCompare(b.description, undefined, { sensitivity: 'base' })
      );
    case 'alpha-desc':
      return sorted.sort((a, b) =>
        b.description.localeCompare(a.description, undefined, { sensitivity: 'base' })
      );
    case 'status':
      // Pending tasks first, completed tasks last
      return sorted.sort((a, b) => Number(a.completed) - Number(b.completed));
    default:
      return sorted;
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/**
 * Creates and returns the `<li>` DOM element for a single task in normal
 * (non-edit) mode.  Does NOT append to the DOM itself.
 *
 * @param {{ id: string, description: string, completed: boolean }} task
 * @returns {HTMLLIElement}
 */
function renderTask(task) {
  const li = document.createElement('li');
  li.dataset.id = task.id;
  li.classList.add('task-item');
  if (task.completed) li.classList.add('task-item--completed');

  // Checkbox — aria-label communicates both action and description
  const checkbox = document.createElement('input');
  checkbox.type    = 'checkbox';
  checkbox.id      = `task-check-${task.id}`;
  checkbox.checked = task.completed;
  checkbox.setAttribute(
    'aria-label',
    task.completed
      ? `Mark "${task.description}" as incomplete`
      : `Mark "${task.description}" as complete`
  );

  // Label — includes a visually-hidden completion indicator for screen readers
  const label = document.createElement('label');
  label.htmlFor = `task-check-${task.id}`;

  if (task.completed) {
    // Screen-reader users hear "Completed: <description>" via the visually-hidden span
    const statusSpan = document.createElement('span');
    statusSpan.className = 'visually-hidden';
    statusSpan.textContent = 'Completed: ';
    label.appendChild(statusSpan);
  }

  const descSpan = document.createElement('span');
  descSpan.textContent = task.description;
  label.appendChild(descSpan);

  // Edit button
  const editBtn = document.createElement('button');
  editBtn.type           = 'button';
  editBtn.dataset.action = 'edit';
  editBtn.setAttribute('aria-label', `Edit task: ${task.description}`);
  editBtn.textContent    = 'Edit';

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.type           = 'button';
  deleteBtn.dataset.action = 'delete';
  deleteBtn.setAttribute('aria-label', `Delete task: ${task.description}`);
  deleteBtn.textContent    = 'Delete';

  li.append(checkbox, label, editBtn, deleteBtn);
  return li;
}

/**
 * Clears the `#task-items` container and re-renders every task from the
 * in-memory array, applying the current sort order.
 */
function renderAll() {
  const container = document.getElementById('task-items');
  if (!container) return;

  container.innerHTML = '';
  for (const task of getSortedTasks()) {
    container.appendChild(renderTask(task));
  }
}

// ---------------------------------------------------------------------------
// Task operations
// ---------------------------------------------------------------------------

/**
 * Creates a new Task object from a trimmed description string.
 *
 * @param {string} trimmedDescription
 * @returns {{ id: string, description: string, completed: boolean, createdAt: number }}
 */
function createTask(trimmedDescription) {
  const id = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : Date.now().toString();

  return {
    id,
    description: trimmedDescription,
    completed:   false,
    createdAt:   Date.now(),
  };
}

/**
 * Validates `description`, creates a Task on success, persists, and
 * re-renders.  Shows an inline validation message on failure.
 *
 * @param {string} description
 * @returns {boolean} `true` if the task was added, `false` if rejected.
 */
function addTask(description) {
  const errorEl = document.getElementById('task-input-error');

  const { valid, trimmed, error } = validateDescription(description);

  if (!valid) {
    if (errorEl) {
      errorEl.textContent = error;
      errorEl.classList.remove('hidden');
    }
    return false;
  }

  // Clear any previous error
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
  }

  tasks.push(createTask(trimmed));
  persist();
  renderAll();
  return true;
}

// ---------------------------------------------------------------------------
// Task operations — toggle, delete, and edit mode (task 6.6)
// ---------------------------------------------------------------------------

/**
 * Flips the `completed` boolean on the matching task, persists, and
 * re-renders only that single `<li>` (not the entire list).
 *
 * @param {string} id
 */
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  task.completed = !task.completed;
  persist();

  // Replace only the affected <li> instead of re-rendering the whole list.
  const li = document.querySelector(`li[data-id="${id}"]`);
  if (li) li.replaceWith(renderTask(task));
}

/**
 * Removes the matching task from the array, persists, and removes its
 * `<li>` from the DOM (no full re-render).
 *
 * @param {string} id
 */
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  persist();

  const li = document.querySelector(`li[data-id="${id}"]`);
  if (li) li.remove();
}

/**
 * Switches the task `<li>` into edit mode: replaces its contents with a
 * text input pre-filled with the current description, an inline error
 * paragraph, and save / discard buttons.  Focuses the input after rendering.
 *
 * @param {string} id
 */
function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const li = document.querySelector(`li[data-id="${id}"]`);
  if (!li) return;

  // Build edit-mode contents
  const input = document.createElement('input');
  input.type      = 'text';
  input.className = 'task-edit-input';
  input.value     = task.description;
  input.setAttribute('aria-label', 'Edit task description');

  const errorEl = document.createElement('p');
  errorEl.className = 'task-edit-error hidden';
  errorEl.setAttribute('aria-live', 'assertive');
  errorEl.setAttribute('role', 'alert');

  const saveBtn = document.createElement('button');
  saveBtn.type              = 'button';
  saveBtn.dataset.action    = 'save-edit';
  saveBtn.setAttribute('aria-label', 'Save edit');
  saveBtn.textContent       = 'Save';

  const discardBtn = document.createElement('button');
  discardBtn.type              = 'button';
  discardBtn.dataset.action    = 'discard-edit';
  discardBtn.setAttribute('aria-label', 'Discard edit');
  discardBtn.textContent       = 'Discard';

  // Swap contents
  li.innerHTML = '';
  li.append(input, errorEl, saveBtn, discardBtn);

  // Focus the input for immediate keyboard entry
  input.focus();
}

/**
 * Validates `newDescription` and either shows an inline error (on failure)
 * or updates the task, persists, and exits edit mode (on success).
 *
 * @param {string} id
 * @param {string} newDescription
 */
function saveEdit(id, newDescription) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const { valid, trimmed, error } = validateDescription(newDescription);

  if (!valid) {
    const li = document.querySelector(`li[data-id="${id}"]`);
    if (!li) return;
    const errorEl = li.querySelector('.task-edit-error');
    if (errorEl) {
      errorEl.textContent = error;
      errorEl.classList.remove('hidden');
    }
    return;
  }

  // Apply the validated description and persist
  task.description = trimmed;
  persist();

  // Exit edit mode by replacing the <li> with normal-mode markup
  const li = document.querySelector(`li[data-id="${id}"]`);
  if (li) li.replaceWith(renderTask(task));
}

/**
 * Discards any pending edit and restores the task `<li>` to normal mode
 * without altering the task's stored description.
 *
 * @param {string} id
 */
function discardEdit(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const li = document.querySelector(`li[data-id="${id}"]`);
  if (li) li.replaceWith(renderTask(task));
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------

/**
 * Attaches all event listeners for the Task List widget.
 * Called once during module initialisation.
 */
function attachEventListeners() {
  // ── Sort selector ────────────────────────────────────────────────────────
  const sortSelect = document.getElementById('task-sort-select');
  if (sortSelect) {
    sortSelect.value = currentSort;
    sortSelect.addEventListener('change', () => {
      currentSort = sortSelect.value;
      save(SORT_KEY, currentSort);
      renderAll();
    });
  }

  // ── Form submit ──────────────────────────────────────────────────────────
  const form  = document.getElementById('task-add-form');
  const input = document.getElementById('task-input');

  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const added = addTask(input.value);
      if (added) input.value = '';
    });
  }

  // ── Delegated events on the task list ───────────────────────────────────
  const taskItems = document.getElementById('task-items');
  if (!taskItems) return;

  // Clicks: delete, edit, save-edit, and discard-edit buttons
  taskItems.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const li = btn.closest('li[data-id]');
    if (!li) return;

    const id = li.dataset.id;
    const action = btn.dataset.action;

    if (action === 'delete')       deleteTask(id);
    if (action === 'edit')         editTask(id);
    if (action === 'save-edit') {
      const input = li.querySelector('.task-edit-input');
      saveEdit(id, input ? input.value : '');
    }
    if (action === 'discard-edit') discardEdit(id);
  });

  // Changes: checkbox toggle
  taskItems.addEventListener('change', (e) => {
    if (e.target.type !== 'checkbox') return;

    const li = e.target.closest('li[data-id]');
    if (!li) return;

    toggleTask(li.dataset.id);
  });
}

// ---------------------------------------------------------------------------
// Public init (wired in task 6.9; module structure supports it)
// ---------------------------------------------------------------------------

/**
 * Bootstraps the Task List widget.
 * Loads persisted tasks from localStorage and renders them, then attaches
 * all event listeners.
 *
 * NOTE: full implementation (including the load call) lives in task 6.9.
 * The function is exported here so `main.js` can import it today; calling it
 * before task 6.9 is complete will simply render an empty list and wire events.
 */
export function init() {
  tasks = load(TASK_KEY, []);
  if (!Array.isArray(tasks)) tasks = [];

  const storedSort = load(SORT_KEY, 'date-asc');
  if (typeof storedSort === 'string') currentSort = storedSort;

  renderAll();
  attachEventListeners();

  // Dismiss the storage-error banner when the user clicks ×
  const dismissBtn = document.getElementById('storage-error-dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      const banner = document.getElementById('storage-error-banner');
      if (banner) banner.classList.add('hidden');
    });
  }
}
