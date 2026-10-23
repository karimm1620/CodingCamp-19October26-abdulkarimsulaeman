// focusTimer.js — Focus Timer module

/**
 * Converts a seconds integer (0–1500) to a zero-padded MM:SS string.
 * @param {number} seconds - Integer in the range 0–1500
 * @returns {string} Zero-padded string in "MM:SS" format
 * @example
 * formatMMSS(0)    // "00:00"
 * formatMMSS(90)   // "01:30"
 * formatMMSS(1500) // "25:00"
 */
export function formatMMSS(seconds) {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

// ─── Internal state ───────────────────────────────────────────────────────────

const DEFAULT_MINUTES = 25;

const state = {
  totalSeconds: DEFAULT_MINUTES * 60,
  intervalId: null,
  isRunning: false,
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Writes the current remaining time to #timer-display, updating aria-label for screen readers. */
function renderDisplay() {
  const display = document.getElementById('timer-display');
  if (display) {
    const mm = Math.floor(state.totalSeconds / 60);
    const ss = state.totalSeconds % 60;
    display.textContent = formatMMSS(state.totalSeconds);
    // Human-readable aria-label so screen readers announce "25 minutes 0 seconds" etc.
    display.setAttribute(
      'aria-label',
      `Time remaining: ${mm} minute${mm !== 1 ? 's' : ''} ${ss} second${ss !== 1 ? 's' : ''}`
    );
  }
}

/** Makes the session-end message visible. */
function renderEndMessage() {
  const msg = document.getElementById('timer-end-message');
  if (msg) {
    msg.classList.remove('hidden');
  }
}

/** Hides the session-end message. */
function hideEndMessage() {
  const msg = document.getElementById('timer-end-message');
  if (msg) {
    msg.classList.add('hidden');
  }
}

// ─── Timer state machine ──────────────────────────────────────────────────────

/**
 * Decrements totalSeconds by one each tick.
 * When the countdown reaches 0, stops the interval and shows the end message.
 * Requirement 2.3, 2.7
 */
function tick() {
  state.totalSeconds -= 1;
  renderDisplay();

  if (state.totalSeconds === 0) {
    clearInterval(state.intervalId);
    state.intervalId = null;
    state.isRunning = false;
    // Re-enable the duration input
    const durationInput = document.getElementById('timer-duration-input');
    if (durationInput) durationInput.disabled = false;
    renderEndMessage();
  }
}

/**
 * Starts the countdown.
 * No-op if already running or if totalSeconds is 0.
 * Requirements 2.2, 2.4, 2.8
 */
function startTimer() {
  if (state.isRunning || state.totalSeconds === 0) {
    return;
  }
  state.isRunning = true;
  state.intervalId = setInterval(tick, 1000);

  // Lock the duration input while running
  const durationInput = document.getElementById('timer-duration-input');
  if (durationInput) durationInput.disabled = true;
}

/**
 * Pauses the countdown at the current remaining time.
 * Requirement 2.5
 */
function stopTimer() {
  clearInterval(state.intervalId);
  state.intervalId = null;
  state.isRunning = false;

  // Re-enable the duration input
  const durationInput = document.getElementById('timer-duration-input');
  if (durationInput) durationInput.disabled = false;
}

/**
 * Stops any active countdown and restores the display to the currently-set duration.
 * Requirement 2.6
 */
function resetTimer() {
  stopTimer();
  const minutes = getCustomMinutes();
  state.totalSeconds = minutes * 60;
  hideEndMessage();
  renderDisplay();
  updateResetAriaLabel(minutes);
}

/**
 * Reads the custom-minutes input and returns a validated integer (1–99).
 * Falls back to DEFAULT_MINUTES when the field is absent or out of range.
 * @returns {number}
 */
function getCustomMinutes() {
  const input = document.getElementById('timer-duration-input');
  if (!input) return DEFAULT_MINUTES;
  const val = parseInt(input.value, 10);
  if (!Number.isFinite(val) || val < 1) return 1;
  if (val > 99) return 99;
  return val;
}

/** Keeps the Reset button aria-label in sync with the current duration. */
function updateResetAriaLabel(minutes) {
  const btn = document.getElementById('timer-reset');
  if (btn) btn.setAttribute('aria-label', `Reset timer to ${minutes} minutes`);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Bootstraps the Focus Timer widget.
 * Sets the display to the configured duration and attaches button event listeners.
 * Requirement 2.1
 */
export function init() {
  // Ensure end message is hidden on load
  hideEndMessage();

  // Sync state to whatever value is in the duration input
  const durationInput = document.getElementById('timer-duration-input');
  if (durationInput) {
    const mins = parseInt(durationInput.value, 10);
    if (Number.isFinite(mins) && mins >= 1) {
      state.totalSeconds = mins * 60;
    }
  }

  // Render initial display
  renderDisplay();

  // Attach button listeners
  document.getElementById('timer-start')?.addEventListener('click', startTimer);
  document.getElementById('timer-stop')?.addEventListener('click', stopTimer);
  document.getElementById('timer-reset')?.addEventListener('click', resetTimer);

  // Re-set timer when duration input changes (only when not running)
  if (durationInput) {
    durationInput.addEventListener('change', () => {
      if (!state.isRunning) {
        resetTimer();
      }
    });
  }
}
