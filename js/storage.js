// storage.js — localStorage wrapper

/**
 * Reads and JSON-parses a value from localStorage.
 * Returns `defaultValue` if the key is absent, storage is unavailable,
 * or the stored string cannot be parsed as valid JSON.
 *
 * @param {string} key
 * @param {*} defaultValue
 * @returns {*}
 */
export function load(key, defaultValue = []) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

/**
 * JSON-serialises `value` and writes it to localStorage.
 * Returns `true` on success, `false` on failure (storage unavailable / quota exceeded).
 * Callers are responsible for displaying an error message when `false` is returned.
 *
 * @param {string} key
 * @param {*} value
 * @returns {boolean}
 */
export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
