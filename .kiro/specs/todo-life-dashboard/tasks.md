# Implementation Plan: To-Do List Life Dashboard

## Overview

Implement a zero-dependency, single-page personal productivity dashboard using HTML, CSS, and Vanilla JavaScript ES modules. The app combines four widgets — Greeting, Focus Timer, Task List, and Quick Links — persisted via `localStorage`. The build follows the module structure defined in the design: `storage.js`, `greetingWidget.js`, `focusTimer.js`, `taskList.js`, `quickLinks.js`, and `main.js`, wired together from a single `index.html`.

## Tasks

- [x] 1. Scaffold project structure and base HTML
  - Create `index.html` with semantic HTML5 structure and four widget sections: `#greeting-widget`, `#focus-timer`, `#task-list`, `#quick-links`
  - Include `<link>` for `css/styles.css` and `<script type="module" src="js/main.js">`
  - Add a global dismissible storage-error banner element (hidden by default)
  - Create empty placeholder files: `css/styles.css`, `js/main.js`, `js/storage.js`, `js/greetingWidget.js`, `js/focusTimer.js`, `js/taskList.js`, `js/quickLinks.js`
  - Each widget section must include all input fields, buttons, and list/container elements referenced by JS modules
  - _Requirements: 6.3_

- [x] 2. Implement `storage.js` — localStorage wrapper
  - [x] 2.1 Implement `load(key, defaultValue = [])` and `save(key, value)` functions
    - Wrap all `localStorage` calls in `try/catch`
    - `load` returns `defaultValue` if key is absent, storage unavailable, or JSON parse fails
    - `save` returns `true` on success, `false` on failure (quota exceeded or storage unavailable)
    - Export both functions as named ES module exports
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]\* 2.2 Write unit tests for `storage.js`
    - Test `load` returns default value when key is absent
    - Test `load` returns default value when stored string is invalid JSON
    - Test `save` returns `false` when `localStorage.setItem` throws
    - Test `save` returns `true` and persists the value on success

- [x] 3. Implement `greetingWidget.js` — Greeting Widget
  - [x] 3.1 Implement pure helper functions: `getGreetingForHour(hour)`, `formatTime(date)`, `formatDate(date)`
    - `getGreetingForHour`: maps 0–23 to "Good Morning" / "Good Afternoon" / "Good Evening" / "Good Night" per the design table
    - `formatTime`: returns `HH:MM` zero-padded 24-hour string; renders `--:--` for invalid Date
    - `formatDate`: returns `"Weekday, DD Month YYYY"` string
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [ ]\* 3.2 Write property test for `getGreetingForHour` — Property 1
    - **Property 1: Greeting mapping is total and exhaustive**
    - **Validates: Requirements 1.4, 1.5, 1.6, 1.7, 1.8**
    - Use `fc.integer({ min: 0, max: 23 })`, assert result is one of the four valid strings
    - Tag: `// Feature: todo-life-dashboard, Property 1: Greeting mapping is total and exhaustive`

  - [ ]\* 3.3 Write property test for `formatTime` — Property 2
    - **Property 2: Time formatting round-trip**
    - **Validates: Requirements 1.1, 1.2**
    - Use `fc.date()`, assert output matches `HH:MM` pattern and round-trips hours/minutes
    - Tag: `// Feature: todo-life-dashboard, Property 2: Time formatting round-trip`

  - [x] 3.4 Implement `renderGreeting()` and `init()` functions
    - `renderGreeting()` reads `new Date()`, checks validity with `isNaN(date.getTime())`, writes to `#greeting-widget` DOM elements
    - `init()` calls `renderGreeting()` immediately and sets a 60-second `setInterval`
    - _Requirements: 1.1, 1.2, 1.3, 1.9_

- [x] 4. Implement `focusTimer.js` — Focus Timer
  - [x] 4.1 Implement `formatMMSS(seconds)` pure function
    - Converts integer 0–1500 to zero-padded `MM:SS` string
    - _Requirements: 2.9_

  - [ ]\* 4.2 Write property test for `formatMMSS` — Property 11
    - **Property 11: `formatMMSS` is correct for all valid inputs**
    - **Validates: Requirements 2.9**
    - Use `fc.integer({ min: 0, max: 1500 })`, assert 5-char `MM:SS` pattern and `MM * 60 + SS === s`
    - Tag: `// Feature: todo-life-dashboard, Property 11: formatMMSS is correct for all valid inputs`

  - [x] 4.3 Implement timer state machine and `init()` with all controls
    - Internal state: `{ totalSeconds: 1500, intervalId: null, isRunning: false }`
    - `startTimer()`: no-op if `isRunning` or `totalSeconds === 0`; sets interval calling `tick()` every 1000 ms
    - `stopTimer()`: clears interval, sets `isRunning = false`
    - `resetTimer()`: calls `stopTimer()`, restores `totalSeconds = 1500`, re-renders
    - `tick()`: decrements `totalSeconds`; on reaching 0, clears interval and calls `renderEndMessage()`
    - `init()` sets up display to 25:00 and attaches Start, Stop, Reset button listeners
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 5. Checkpoint — Core widgets complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement `taskList.js` — Task List
  - [x] 6.1 Implement `validateDescription(raw)` pure function
    - Returns `{ valid: boolean, trimmed: string, error: string }`
    - Rejects empty/whitespace-only strings and strings with trimmed length > 250
    - Error messages per design validation table
    - _Requirements: 3.1, 3.2, 3.5_

  - [ ]\* 6.2 Write property test for `validateDescription` — Property 4
    - **Property 4: Whitespace and oversized task descriptions are rejected**
    - **Validates: Requirements 3.2, 3.5**
    - Use `fc.string()` filtered for whitespace-only and `fc.string({ minLength: 251 })`, assert task array unchanged
    - Tag: `// Feature: todo-life-dashboard, Property 4: Whitespace and oversized task descriptions are rejected`

  - [ ]\* 6.3 Write property test for `validateDescription` consistency — Property 12
    - **Property 12: `validateDescription` is consistent with `addTask`**
    - **Validates: Requirements 3.1, 3.2**
    - Use `fc.string()`, assert `validateDescription` returning `valid: true` is necessary and sufficient for `addTask` appending to the array
    - Tag: `// Feature: todo-life-dashboard, Property 12: validateDescription is consistent with addTask`

  - [x] 6.4 Implement `addTask(description)`, internal Task object creation, and `persist()` / `renderAll()` / `renderTask(task)`
    - Task shape: `{ id, description, trimmed, completed: false, createdAt }`; use `crypto.randomUUID()` or `Date.now().toString()` for id
    - `persist()` calls `storage.save(TASK_KEY, tasks)`; shows global error banner if `save` returns `false`
    - `renderTask` creates DOM element for normal mode (checkbox toggle, edit button, delete button)
    - Inline validation message shown on rejection; cleared on next valid submit
    - _Requirements: 3.1, 3.2, 3.9_

  - [ ]\* 6.5 Write property test for task addition — Property 3
    - **Property 3: Task addition grows the list**
    - **Validates: Requirements 3.1**
    - Use `fc.string({ minLength: 1, maxLength: 250 })`, assert array length increases by exactly 1 and `description` equals trimmed input
    - Tag: `// Feature: todo-life-dashboard, Property 3: Task addition grows the list`

  - [x] 6.6 Implement `toggleTask(id)`, `deleteTask(id)`, edit mode: `editTask(id)`, `saveEdit(id, newDescription)`, `discardEdit(id)`
    - `toggleTask`: flips `completed`, persists, re-renders the single item
    - `deleteTask`: removes from array, persists, removes DOM element
    - `editTask`: switches task DOM element into edit mode (editable field + save/discard controls)
    - `saveEdit`: validates new description, updates task, persists, exits edit mode; shows inline error on failure
    - `discardEdit`: exits edit mode, restores original description
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [ ]\* 6.7 Write property test for toggle involution — Property 5
    - **Property 5: Task toggle is an involution**
    - **Validates: Requirements 3.7**
    - Use `fc.boolean()` for initial state, assert double-toggle returns `completed` to original value
    - Tag: `// Feature: todo-life-dashboard, Property 5: Task toggle is an involution`

  - [ ]\* 6.8 Write property test for task persistence round-trip — Property 6
    - **Property 6: Task persistence round-trip**
    - **Validates: Requirements 3.9, 3.10, 5.4**
    - Use `fc.array(taskArbitrary)`, assert `JSON.parse(JSON.stringify(arr))` produces structurally equivalent array
    - Tag: `// Feature: todo-life-dashboard, Property 6: Task persistence round-trip`

  - [x] 6.9 Implement `init()` for `taskList.js`
    - Calls `storage.load(TASK_KEY, [])` on page load; renders all saved tasks; renders empty list on parse failure
    - _Requirements: 3.10, 3.11, 5.3, 5.5_

- [x] 7. Implement `quickLinks.js` — Quick Links
  - [x] 7.1 Implement `validateLink(label, url)` pure function
    - Returns `{ valid: boolean, errors: { label?: string, url?: string } }`
    - Validates label (non-empty, ≤ 200 chars), URL (non-empty, starts with `http://` or `https://`, ≤ 2048 chars)
    - Error messages per design validation table
    - _Requirements: 4.2, 4.3_

  - [ ]\* 7.2 Write property test for invalid link inputs — Property 8
    - **Property 8: Invalid link inputs are rejected**
    - **Validates: Requirements 4.2, 4.3**
    - Arbitraries targeting each invalid condition (empty label, empty URL, bad scheme, oversized label/URL); assert collection unchanged
    - Tag: `// Feature: todo-life-dashboard, Property 8: Invalid link inputs are rejected`

  - [x] 7.3 Implement `addLink(label, url)`, `deleteLink(id)`, `openLink(url)`, `persist()`, `renderAll()`, `renderLink(link)`
    - `addLink`: validates, checks count < 50, appends Link `{ id, label, url, createdAt }`, persists, renders button
    - `deleteLink`: removes from array, persists, removes DOM element
    - `openLink`: calls `window.open(url, '_blank', 'noopener,noreferrer')`
    - `renderLink`: creates button (triggers `openLink`) + delete control
    - Inline validation messages rendered adjacent to the relevant input field; cleared on next valid submit
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]\* 7.4 Write property test for link addition — Property 7
    - **Property 7: Link addition grows the collection**
    - **Validates: Requirements 4.1**
    - Use valid label + URL arbitraries with collection length < 50, assert length increases by 1 and fields match inputs
    - Tag: `// Feature: todo-life-dashboard, Property 7: Link addition grows the collection`

  - [ ]\* 7.5 Write property test for link count cap — Property 9
    - **Property 9: Link count cap is enforced**
    - **Validates: Requirements 4.1**
    - Seed collection with exactly 50 links, assert `addLink` with valid inputs leaves collection unchanged at 50
    - Tag: `// Feature: todo-life-dashboard, Property 9: Link count cap is enforced`

  - [ ]\* 7.6 Write property test for link persistence round-trip — Property 10
    - **Property 10: Link persistence round-trip**
    - **Validates: Requirements 4.6, 4.7, 5.4**
    - Use `fc.array(linkArbitrary)`, assert `JSON.parse(JSON.stringify(arr))` produces structurally equivalent array
    - Tag: `// Feature: todo-life-dashboard, Property 10: Link persistence round-trip`

  - [x] 7.7 Implement `init()` for `quickLinks.js`
    - Calls `storage.load(LINKS_KEY, [])` on page load; renders all saved links; renders empty collection on failure
    - _Requirements: 4.7, 4.8, 5.3, 5.5_

- [x] 8. Checkpoint — All widget logic complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement `main.js` and wire all modules together
  - [x] 9.1 Write `main.js` entry point
    - Import `init` from all four widget modules
    - Call each `init()` inside a `DOMContentLoaded` listener
    - _Requirements: 6.3_

- [x] 10. Apply full CSS styling in `css/styles.css`
  - [x] 10.1 Implement layout, typography, and widget separation
    - Responsive layout (320px–1920px): no horizontal overflow, no overlapping elements
    - Minimum body font size 14px; heading levels each at least 2px larger than the level below
    - Four widget sections separated by ≥ 16px whitespace or a visible divider
    - _Requirements: 7.1, 7.4, 7.5_

  - [x] 10.2 Implement visual states: completed tasks, timer end message, validation errors, storage error banner
    - Completed tasks: strikethrough text + opacity ≥ 50%, contrast ratio ≥ 4.5:1
    - Storage error banner: visible, dismissible
    - Timer end message: visible on session end, hidden otherwise
    - Inline validation error messages styled adjacent to their inputs
    - _Requirements: 7.2, 7.3_

- [x] 11. Accessibility pass
  - [x] 11.1 Add ARIA attributes, labels, and live regions throughout the HTML and JS-rendered DOM
    - All form inputs must have associated `<label>` elements
    - Inline validation messages placed in `aria-live="assertive"` regions
    - Completed tasks use `aria-label` or visually hidden text to communicate completion state
    - Logical tab order for all interactive controls
    - _Requirements: 7.2_

- [x] 12. Final checkpoint — Full integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use **fast-check** loaded via CDN in a dedicated test HTML runner page, or via a minimal Node.js ESM script — no bundler required; each property test runs a minimum of 100 iterations
- All JS files use `type="module"` ES module syntax — `import`/`export` only, no globals
- `crypto.randomUUID()` is available in all target browsers (Chrome, Firefox, Edge, Safari current stable)
- The global storage-error banner element in `index.html` is shared by both `taskList.js` and `quickLinks.js`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1", "4.1"] },
    { "id": 1, "tasks": ["2.2", "3.2", "3.3", "4.2"] },
    { "id": 2, "tasks": ["3.4", "4.3", "6.1", "7.1"] },
    { "id": 3, "tasks": ["6.2", "6.3", "6.4", "7.2", "7.3"] },
    { "id": 4, "tasks": ["6.5", "6.6", "7.4", "7.5", "7.6"] },
    { "id": 5, "tasks": ["6.7", "6.8", "6.9", "7.7"] },
    { "id": 6, "tasks": ["9.1"] },
    { "id": 7, "tasks": ["10.1", "10.2", "11.1"] }
  ]
}
```
