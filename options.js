// options.js

const eventNameInput = document.getElementById("event-name-input");
const targetDateTimeInput = document.getElementById("target-datetime-input");
const saveBtn = document.getElementById("save-btn");

saveBtn.addEventListener("click", () => {
  const eventName = eventNameInput.value.trim();
  const rawValue = targetDateTimeInput.value;
  const targetDateTime = rawValue ? new Date(rawValue).toISOString() : null;

  if (targetDateTime) {
    // 1) Persist into storage
    chrome.storage.sync.set({ eventName, targetDateTime }, () => {
      console.log("Settings saved:", { eventName, targetDateTime });
      chrome.runtime.sendMessage({ type: "settingsUpdated" });
      alert("Settings Saved!");
    });

    // 3) Schedule the alarm
    chrome.alarms.create("registrationAlarm", {
      when: new Date(targetDateTime).getTime(),
    });
    console.log("Alarm set for:", new Date(targetDateTime));
  } else {
    alert("Please select a valid date and time.");
    chrome.alarms.clear("registrationAlarm", (wasCleared) => {
      console.log("Alarm cleared:", wasCleared);
    });
    chrome.storage.sync.remove(["eventName", "targetDateTime"], () => {
      chrome.runtime.sendMessage({ type: "settingsUpdated" });
    });
  }
});

// On load, populate the form
chrome.storage.sync.get(
  ["eventName", "targetDateTime"],
  ({ eventName, targetDateTime }) => {
    eventNameInput.value = eventName || "";
    if (targetDateTime) {
      const local = new Date(targetDateTime);
      const tzOffset = local.getTimezoneOffset() * 60000;
      const localISO = new Date(local - tzOffset).toISOString().slice(0, 16);
      targetDateTimeInput.value = localISO;
    } else {
      targetDateTimeInput.value = "";
    }
  }
);
