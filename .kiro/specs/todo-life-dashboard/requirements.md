# Requirements Document

## Introduction

The To-Do List Life Dashboard is a client-side web application built with HTML, CSS, and Vanilla JavaScript. It provides a personal productivity hub in a single browser page, combining a live date/time greeting, a Pomodoro-style focus timer, a task list, and a quick-links launcher. All data is persisted exclusively in the browser's Local Storage — no backend server is required. The application can be used as a standalone HTML file or packaged as a browser extension.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Widget**: The UI section that displays the current time, date, and a time-of-day greeting message.
- **Focus_Timer**: The UI section that implements a 25-minute countdown timer with start, stop, and reset controls.
- **Task_List**: The UI section that manages the collection of user tasks.
- **Task**: A single item in the Task_List, consisting of a text description and a completion state.
- **Quick_Links**: The UI section that displays user-defined shortcut buttons that open URLs in a new browser tab.
- **Link**: A single entry in the Quick_Links section, consisting of a display label and a URL.
- **Local_Storage**: The browser's `localStorage` API used as the sole persistence layer.
- **Session**: The period from when the Dashboard page is loaded until it is closed or navigated away from.

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a contextual greeting when I open the Dashboard, so that I am immediately oriented and welcomed.

#### Acceptance Criteria

1. WHEN the Dashboard is loaded, THE Greeting_Widget SHALL immediately display the current time in 24-hour HH:MM format derived from the local system clock.
2. THE Greeting_Widget SHALL update the displayed time every 60 seconds to reflect the current local system clock.
3. THE Greeting_Widget SHALL display the current date in the format "Weekday, DD Month YYYY" (e.g., "Monday, 26 October 2025").
4. WHEN the local hour is between 05 and 11 (inclusive), THE Greeting_Widget SHALL display the greeting "Good Morning".
5. WHEN the local hour is between 12 and 17 (inclusive), THE Greeting_Widget SHALL display the greeting "Good Afternoon".
6. WHEN the local hour is between 18 and 20 (inclusive), THE Greeting_Widget SHALL display the greeting "Good Evening".
7. WHEN the local hour is between 21 and 23 (inclusive), THE Greeting_Widget SHALL display the greeting "Good Night".
8. WHEN the local hour is between 00 and 04 (inclusive), THE Greeting_Widget SHALL display the greeting "Good Night".
9. IF the local system clock is unavailable or returns an invalid value, THEN THE Greeting_Widget SHALL display a placeholder message (e.g., "--:--") in place of the time and omit the date and greeting.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can manage focused work sessions without leaving the Dashboard.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialise with a countdown value of 25 minutes and 00 seconds (25:00) on every page load.
2. WHEN the user activates the start control and the Focus_Timer is not already counting down, THE Focus_Timer SHALL begin counting down from the current displayed time in one-second intervals.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second.
4. IF the user activates the start control while the Focus_Timer is already counting down, THEN THE Focus_Timer SHALL continue counting down without interruption.
5. WHEN the user activates the stop control, THE Focus_Timer SHALL pause the countdown at the current remaining time.
6. WHEN the user activates the reset control, THE Focus_Timer SHALL stop any active countdown and restore the display to 25:00.
7. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a visible on-page message indicating the session has ended.
8. IF the user activates the start control while the displayed time is 00:00, THEN THE Focus_Timer SHALL take no action until the reset control is activated.
9. THE Focus_Timer SHALL display the remaining time in MM:SS format at all times.

---

### Requirement 3: Task Management

**User Story:** As a user, I want to add, edit, mark as done, and delete tasks that persist across browser sessions, so that I can track my to-do items reliably.

#### Acceptance Criteria

1. WHEN the user submits a non-empty task description of at most 250 characters (after trimming leading and trailing whitespace), THE Task_List SHALL add a new Task with the trimmed description and a default completion state of incomplete.
2. IF the user submits an empty, whitespace-only, or greater-than-250-character task description, THEN THE Task_List SHALL reject the submission and display an inline validation message.
3. WHEN the user activates the edit control for a Task, THE Task_List SHALL present the existing description in an editable field alongside a save control and a discard control.
4. WHEN the user activates the save control for an edited Task with a non-empty description of at most 250 characters (after trimming), THE Task_List SHALL update that Task's description with the trimmed value and exit edit mode.
5. IF the user attempts to save an edited Task with an empty, whitespace-only, or greater-than-250-character description, THEN THE Task_List SHALL reject the save and display an inline validation message.
6. WHEN the user activates the discard control during an edit, THE Task_List SHALL exit edit mode and restore the original description without saving any changes.
7. WHEN the user toggles the completion control for a Task, THE Task_List SHALL update that Task's completion state to the opposite of its current state.
8. WHEN the user activates the delete control for a Task, THE Task_List SHALL permanently remove that Task from the list.
9. WHEN any Task is added, edited, toggled, or deleted, THE Task_List SHALL write the updated task collection to Local_Storage.
10. WHEN the Dashboard is loaded, THE Task_List SHALL read the task collection from Local_Storage and render all previously saved Tasks.
11. IF the data retrieved from Local_Storage for the task collection cannot be parsed as valid JSON, THEN THE Task_List SHALL discard the corrupted data and render an empty Task_List.

---

### Requirement 4: Quick Links Management

**User Story:** As a user, I want to save and launch favourite website shortcuts from the Dashboard, so that I can reach my most-used sites in one click without leaving the productivity hub.

#### Acceptance Criteria

1. WHEN the user submits a non-empty label of at most 200 characters and a valid URL of at most 2048 characters, and the total number of saved Links is fewer than 50, THE Quick_Links SHALL add a new Link and display it as a clickable button.
2. IF the user submits a missing label or a missing URL when adding a Link, THEN THE Quick_Links SHALL reject the submission and display an inline validation message adjacent to the empty field.
3. IF the user submits a URL that does not begin with "http://" or "https://", THEN THE Quick_Links SHALL reject the submission and display an inline validation message adjacent to the URL field indicating an invalid URL format.
4. WHEN the user activates a Link button, THE Quick_Links SHALL open the associated URL in a new browser tab.
5. WHEN the user activates the delete control for a Link, THE Quick_Links SHALL immediately and permanently remove that Link from the Quick_Links section without requiring confirmation.
6. WHEN a Link is added or deleted, THE Quick_Links SHALL write the updated link collection to Local_Storage.
7. WHEN the Dashboard is loaded, THE Quick_Links SHALL read the link collection from Local_Storage and render all previously saved Links.
8. IF Local_Storage is unavailable or contains malformed data when the Dashboard is loaded, THEN THE Quick_Links SHALL render an empty link collection and allow the user to add new Links.

---

### Requirement 5: Data Persistence and Storage

**User Story:** As a user, I want all my tasks and quick links to survive page refreshes and browser restarts, so that I never lose my data unexpectedly.

#### Acceptance Criteria

1. THE Dashboard SHALL use Local_Storage as the sole client-side persistence mechanism for Tasks and Links.
2. WHEN Local_Storage is unavailable or throws an exception during a write operation, THE Dashboard SHALL display an error message indicating that the data could not be saved and that changes may be lost.
3. WHEN Local_Storage is unavailable or throws an exception during a read operation on page load, THE Dashboard SHALL render an empty Task_List and empty Quick_Links, with all interactive elements remaining functional.
4. THE Dashboard SHALL store Tasks and Links as serialised JSON strings in Local_Storage.
5. IF the data retrieved from Local_Storage on page load cannot be parsed as valid JSON, THEN THE Dashboard SHALL discard the corrupted data, render an empty Task_List and empty Quick_Links, and display an error message indicating that saved data could not be loaded.

---

### Requirement 6: Performance and Compatibility

**User Story:** As a user, I want the Dashboard to load quickly and respond immediately to my interactions, so that it does not interrupt my workflow.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using only HTML, CSS, and Vanilla JavaScript with no external frameworks or libraries.
2. THE Dashboard SHALL function correctly in current stable releases of Chrome, Firefox, Edge, and Safari, where "function correctly" means no uncaught JavaScript exceptions are thrown, the layout renders as designed, and all interactive elements respond to user input.
3. THE Dashboard SHALL consist of exactly one HTML file, exactly one CSS file located in a css/ directory, and exactly one JavaScript file located in a js/ directory.
4. WHEN the Dashboard page is loaded over a broadband connection of 10 Mbps or faster, THE Dashboard SHALL render the full interface within 2 seconds.
5. WHEN a user interaction triggers a UI update (task add, delete, toggle, link add, delete), THE Dashboard SHALL update the DOM to visually reflect the new state within 100 milliseconds.

---

### Requirement 7: Visual Design and Usability

**User Story:** As a user, I want a clean, readable interface with clear visual hierarchy, so that I can use the Dashboard without confusion or visual fatigue.

#### Acceptance Criteria

1. THE Dashboard SHALL apply a typographic scale in which each heading level is visually distinct from body text, with a minimum body font size of 14px and each successive heading level at least 2px larger than the level below it.
2. THE Dashboard SHALL maintain a colour contrast ratio of at least 4.5:1 between text and its background, in accordance with WCAG 2.1 AA guidelines.
3. THE Dashboard SHALL visually distinguish completed Tasks from incomplete Tasks using strikethrough text and an opacity of no less than 50%, while still maintaining a colour contrast ratio of at least 4.5:1 between the Task text and its background.
4. THE Dashboard SHALL present the four widget sections (Greeting_Widget, Focus_Timer, Task_List, Quick_Links) as clearly separated regions with a minimum of 16px of whitespace or a visible divider between adjacent sections.
5. THE Dashboard SHALL be responsive such that, at any viewport width between 320px and 1920px, no content overflows its container horizontally, no elements overlap one another, and all interactive controls remain reachable without horizontal scrolling.
