const eventNameElement = document.getElementById("event-name");
const countdownDisplayElement = document.getElementById("countdown-display");
const resetBtn = document.getElementById("reset-btn");
const messageElement = document.getElementById("message");

let countdownInterval = null;

function formatTimeUnit(unit) {
  return unit < 10 ? "0" + unit : unit;
}

function formatMilliseconds(ms) {
  if (ms < 10) {
    return "00" + ms;
  } else if (ms < 100) {
    return "0" + ms;
  } else {
    return ms;
  }
}

function updateCountdown() {
  chrome.storage.sync.get(["targetDateTime", "eventName"], (res) => {
    if (!countdownDisplayElement || !eventNameElement || !messageElement) {
      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = null;
      return;
    }

    if (res.targetDateTime) {
      eventNameElement.textContent = res.eventName || "Registration Event";
      messageElement.textContent = "";

      const targetTime = new Date(res.targetDateTime).getTime();
      const now = new Date().getTime();
      const timeLeft = targetTime - now;

      if (timeLeft <= 0) {
        countdownDisplayElement.textContent = "Registration Open!";
        if (countdownInterval) {
          clearInterval(countdownInterval); // Stop the interval
          countdownInterval = null;
        }

        return;
      } else {
      }

      // Calculate days, hours, minutes, seconds
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      // Calculate milliseconds
      const milliseconds = Math.floor(timeLeft % 1000);

      // Display the countdown including milliseconds
      countdownDisplayElement.textContent = `${days}d ${formatTimeUnit(
        hours
      )}h ${formatTimeUnit(minutes)}m ${formatTimeUnit(
        seconds
      )}s ${formatMilliseconds(milliseconds)}ms`; // Added ms
    } else {
      eventNameElement.textContent = ""; // Clear event name
      countdownDisplayElement.textContent = "--:--:--:--.---"; // Add ms placeholder

      messageElement.textContent = "Set the registration time in options.";

      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
    }
  });
}

// Check if resetBtn exists before adding listener
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    chrome.storage.sync.remove(["targetDateTime", "eventName"], () => {
      console.log("Target time cleared.");
      if (chrome.alarms) {
        chrome.alarms.clear("registrationAlarm", (wasCleared) => {
          console.log("Alarm cleared:", wasCleared);
        });
      }
      // Update display immediately
      updateCountdown();
    });
  });
} else {
  console.warn("Reset button not found in popup.html");
}

// --- Run the countdown ---
const UPDATE_INTERVAL_MS = 100; // Update every 100ms for smoother ms display

// Initial update and start interval only if not already running
if (!countdownInterval) {
  updateCountdown();
  countdownInterval = setInterval(updateCountdown, UPDATE_INTERVAL_MS);
}

window.addEventListener("unload", () => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
    console.log("Popup closed, interval cleared.");
  }
});
