// main.js — entry point
import { init as initGreeting } from "./greetingWidget.js";
import { init as initTimer } from "./focusTimer.js";
import { init as initTasks } from "./taskList.js";
import { init as initLinks } from "./quickLinks.js";

document.addEventListener("DOMContentLoaded", () => {
  initGreeting();
  initTimer();
  initTasks();
  initLinks();
});
