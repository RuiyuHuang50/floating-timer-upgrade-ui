// content.js - Minor updates for structure/accessibility
(function () {
  // Prevent double-injection
  if (window.__timerInjected) return;
  window.__timerInjected = true;

  // 1) Build the widget UI
  const container = document.createElement("div");
  container.id = "registration-timer-container";
  // Start hidden - display: none is now handled by CSS default
  container.innerHTML = `
      <div id="timer-header">
        <span id="timer-event-name">⏳ No Event Set</span>
        <div class="hdr-buttons">
          <button id="timer-lock-btn" title="Toggle Lock Position" aria-label="Toggle Lock Position">🔓</button>
          <button id="theme-toggle-btn" title="Toggle Theme" aria-label="Toggle Theme">🌙</button>
          <button id="timer-close-btn" title="Close Timer" aria-label="Close Timer">&times;</button>
        </div>
      </div>

      <div id="timer-display">
        <div id="timer-countdown-display">--:--:--.---</div>
      </div>

      <div id="timer-controls">
        <button id="timer-pause-btn" class="secondary" title="Pause/Resume Timer" aria-label="Pause or Resume timer">⏸️</button>
        <button id="timer-reset-btn" class="secondary" title="Reset Timer" aria-label="Reset timer">Reset</button>
        <button id="timer-edit-btn" class="secondary" title="Edit Settings" aria-label="Edit settings">✏️</button>
      </div>

      <form id="timer-settings-form"> <input id="timer-event-input" type="text" placeholder="Event name" aria-label="Event Name" />
        <input id="timer-datetime-input" type="datetime-local" aria-label="Target Date and Time" />
        <div class="form-buttons"> <button id="timer-cancel-btn" type="button" class="secondary">Cancel</button>
            <button id="timer-save-btn" type="button" class="primary">Save</button>
        </div>
      </form>
    `;
  document.body.appendChild(container);

  // 2) Element references
  const header = container.querySelector("#timer-header");
  const eventNameEl = container.querySelector("#timer-event-name");
  const lockBtn = container.querySelector("#timer-lock-btn");
  const themeBtn = container.querySelector("#theme-toggle-btn");
  const closeBtn = container.querySelector("#timer-close-btn");
  const pauseBtn = container.querySelector("#timer-pause-btn");
  const resetBtn = container.querySelector("#timer-reset-btn");
  const editBtn = container.querySelector("#timer-edit-btn");
  const display = container.querySelector("#timer-countdown-display");
  const controls = container.querySelector("#timer-controls");
  const settingsForm = container.querySelector("#timer-settings-form");
  const eventInput = container.querySelector("#timer-event-input");
  const datetimeInput = container.querySelector("#timer-datetime-input");
  const saveBtnForm = container.querySelector("#timer-save-btn"); // Renamed variable slightly
  const cancelBtn = container.querySelector("#timer-cancel-btn");

  // 3) Theme handling
  function applyTheme(theme) {
    container.classList.toggle("light-theme", theme === "light");
    container.classList.toggle("dark-theme", theme !== "light");
    themeBtn.textContent = theme === "light" ? "🌙" : "☀️";
    // Store theme preference for next load
    chrome.storage.sync.set({ theme: theme });
  }

  // Load initial theme preference
  chrome.storage.sync.get("theme", ({ theme }) => {
    applyTheme(theme || "dark"); // Default to dark if not set
  });

  themeBtn.addEventListener("click", () => {
    const currentTheme = container.classList.contains("light-theme")
      ? "light"
      : "dark";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    applyTheme(newTheme);
  });

  // 4) Restore saved position (if any)
  chrome.storage.local.get("timerPosition", ({ timerPosition }) => {
    if (timerPosition) {
      container.style.top = timerPosition.top + "px";
      container.style.left = timerPosition.left + "px";
      container.style.bottom = "auto";
      container.style.right = "auto";
    } else {
      // Default position if none saved (e.g., bottom right)
      container.style.bottom = "20px";
      container.style.right = "20px";
      container.style.top = "auto";
      container.style.left = "auto";
    }
  });

  // 5) Drag logic with lock
  let dragging = false,
    offsetX = 0,
    offsetY = 0,
    isLocked = false;

  function setLockedState(locked) {
    isLocked = locked;
    lockBtn.textContent = isLocked ? "🔒" : "🔓";
    header.style.cursor = isLocked ? "default" : "move";
    header.classList.toggle("locked", isLocked);
  }

  header.addEventListener("mousedown", (e) => {
    if (isLocked || e.target.closest("button")) return;
    dragging = true;
    container.classList.add("dragging");
    const rect = container.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    document.body.style.userSelect = "none"; // Prevent text selection during drag
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    // Ensure timer stays within viewport boundaries (optional but recommended)
    const newX = e.clientX - offsetX;
    const newY = e.clientY - offsetY;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = container.getBoundingClientRect();

    container.style.left = Math.min(Math.max(0, newX), vw - rect.width) + "px";
    container.style.top = Math.min(Math.max(0, newY), vh - rect.height) + "px";
    container.style.right = "auto";
    container.style.bottom = "auto";
  });

  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    container.classList.remove("dragging"); // Remove visual feedback class
    document.body.style.userSelect = ""; // Re-enable text selection
    // Save position relative to top-left corner
    const rect = container.getBoundingClientRect();
    chrome.storage.local.set({
      timerPosition: { top: rect.top, left: rect.left },
    });
  });

  // 6) Control buttons
  closeBtn.addEventListener("click", () => {
    container.style.display = "none";
    chrome.runtime
      .sendMessage({ type: "timerVisibility", visible: false })
      .catch((e) => {});
  });

  lockBtn.addEventListener("click", () => setLockedState(!isLocked));

  let intervalId = null,
    isPaused = false,
    targetTime = null;

  pauseBtn.addEventListener("click", () => {
    if (targetTime === null) return;
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? "▶️" : "⏸️";
    pauseBtn.setAttribute(
      "aria-label",
      isPaused ? "Resume timer" : "Pause timer"
    );
    pauseBtn.setAttribute("title", isPaused ? "Resume Timer" : "Pause Timer");

    if (isPaused) {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
    } else {
      update();
      if (!intervalId) {
        intervalId = setInterval(update, 100); // Update every 100ms
      }
    }
  });

  resetBtn.addEventListener("click", () => {
    chrome.storage.sync.remove(["eventName", "targetDateTime"], () => {
      targetTime = null;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      eventNameEl.textContent = "⏳ No Event Set";
      display.textContent = "--:--:--.---";
      display.classList.remove("expired");
      isPaused = false; // Reset pause state
      pauseBtn.textContent = "⏸️";
      pauseBtn.setAttribute("aria-label", "Pause timer");
      pauseBtn.setAttribute("title", "Pause Timer");
    });
  });

  // 7) Inline settings panel
  editBtn.addEventListener("click", () => {
    settingsForm.style.display = "flex"; // Use flex for column layout
    controls.style.display = "none";
    chrome.storage.sync.get(
      ["eventName", "targetDateTime"],
      ({ eventName, targetDateTime }) => {
        eventInput.value = eventName || "";
        if (targetDateTime) {
          try {
            const dt = new Date(targetDateTime);
            const year = dt.getFullYear();
            const month = String(dt.getMonth() + 1).padStart(2, "0");
            const day = String(dt.getDate()).padStart(2, "0");
            const hours = String(dt.getHours()).padStart(2, "0");
            const minutes = String(dt.getMinutes()).padStart(2, "0");
            datetimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
          } catch (e) {
            console.error("Error parsing stored date:", targetDateTime, e);
            datetimeInput.value = "";
          }
        } else {
          datetimeInput.value = "";
        }
      }
    );
  });

  cancelBtn.addEventListener("click", () => {
    settingsForm.style.display = "none";
    controls.style.display = "flex";
  });

  saveBtnForm.addEventListener("click", () => {
    const name = eventInput.value.trim() || "Countdown";
    const dtValue = datetimeInput.value;
    if (!dtValue) return alert("Please select a valid date and time.");

    try {
      const localDate = new Date(dtValue);
      if (isNaN(localDate)) throw new Error("Invalid date input");
      const isoString = localDate.toISOString();

      chrome.storage.sync.set(
        { eventName: name, targetDateTime: isoString },
        () => {
          eventNameEl.textContent = name;
          targetTime = new Date(isoString);
          if (intervalId) clearInterval(intervalId);
          isPaused = false;
          pauseBtn.textContent = "⏸️";
          pauseBtn.setAttribute("aria-label", "Pause timer");
          pauseBtn.setAttribute("title", "Pause Timer");
          update();
          intervalId = setInterval(update, 100);
          settingsForm.style.display = "none";
          controls.style.display = "flex";
          if (container.style.display === "none") {
            container.style.display = "block";
            chrome.runtime
              .sendMessage({ type: "timerVisibility", visible: true })
              .catch((e) => {});
          }
        }
      );
    } catch (e) {
      console.error("Error saving date:", e);
      alert(
        "Could not save the selected date and time. Please check the format."
      );
    }
  });

  // 8) Countdown logic with ms
  function update() {
    if (targetTime === null || isPaused) return;

    const now = new Date();
    let diffMs = targetTime - now;

    if (diffMs <= 0) {
      display.textContent = "🎉 Time’s Up!";
      display.classList.add("expired");
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      return;
    }

    display.classList.remove("expired");

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = String(
      Math.floor((totalSeconds % (3600 * 24)) / 3600)
    ).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0"
    );
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    const milliseconds = String(diffMs % 1000).padStart(3, "0");

    let timeString = `${hours}:${minutes}:${seconds}.${milliseconds}`;
    if (days > 0) {
      timeString = `${days}d ${timeString}`;
    }

    display.textContent = timeString;
  }

  // 9) Load settings & start ticking if applicable
  function loadSettingsAndStart() {
    chrome.storage.sync.get(
      ["eventName", "targetDateTime"],
      ({ eventName, targetDateTime: storedTargetDateTime }) => {
        eventNameEl.textContent = eventName || "⏳ No Event Set";
        if (storedTargetDateTime) {
          try {
            targetTime = new Date(storedTargetDateTime);
            if (isNaN(targetTime)) throw new Error("Invalid stored date");

            if (intervalId) clearInterval(intervalId);
            isPaused = false;
            pauseBtn.textContent = "⏸️";
            pauseBtn.setAttribute("aria-label", "Pause timer");
            pauseBtn.setAttribute("title", "Pause Timer");
            update();
            intervalId = setInterval(update, 100);
          } catch (e) {
            console.error(
              "Error loading stored date:",
              storedTargetDateTime,
              e
            );
            targetTime = null;
            display.textContent = "--:--:--.---";
            display.classList.remove("expired");
          }
        } else {
          targetTime = null;
          display.textContent = "--:--:--.---";
          display.classList.remove("expired");
          if (intervalId) clearInterval(intervalId);
          intervalId = null;
        }
      }
    );
  }

  loadSettingsAndStart();

  // 10) Listen for messages
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "toggleTimer") {
      const isVisible = container.style.display === "block";
      container.style.display = isVisible ? "none" : "block";

      chrome.runtime
        .sendMessage({ type: "timerVisibility", visible: !isVisible })
        .catch((e) => {});

      if (!isVisible) {
        loadSettingsAndStart();
      }
      sendResponse({ status: "toggled", visible: !isVisible });
    } else if (msg.type === "settingsUpdated") {
      loadSettingsAndStart();
      sendResponse({ status: "settings reloaded" });
    }
    return true;
  });

  // 11) Storage changes fallback
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && (changes.targetDateTime || changes.eventName)) {
      loadSettingsAndStart();
    }
    if (area === "sync" && changes.theme) {
      applyTheme(changes.theme.newValue || "dark");
    }
  });
})();
