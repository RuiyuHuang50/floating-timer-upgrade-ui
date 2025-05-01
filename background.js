// background.js

// 1️⃣ Alarm listener: fires once, notifies, clears, sets badge
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log("Alarm fired:", alarm);
  if (alarm.name === "registrationAlarm") {
    chrome.storage.sync.get(["eventName"], (res) => {
      const eventName = res.eventName || "Registration";
      chrome.notifications.create(
        "registrationTime",
        {
          type: "basic",
          iconUrl: chrome.runtime.getURL("icon.png"),
          title: "Registration Alert!",
          message: `${eventName} registration is now open!`,
          priority: 2,
        },
        (notificationId) => {
          console.log("Notification shown:", notificationId);
        }
      );
      chrome.alarms.clear("registrationAlarm");
      chrome.action.setBadgeText({ text: "!" });
      chrome.action.setBadgeBackgroundColor({ color: "#d23f31" });
    });
  }
});

// 2️⃣ Clear badge when notification is clicked or closed
chrome.notifications.onClicked.addListener((id) => {
  if (id === "registrationTime") {
    chrome.notifications.clear(id);
    chrome.action.setBadgeText({ text: "" });
  }
});
chrome.notifications.onClosed.addListener((id) => {
  if (id === "registrationTime") {
    chrome.action.setBadgeText({ text: "" });
  }
});

// 3️⃣ Toolbar-icon click → toggle widget, with fallback injection
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "toggleTimer" }).catch(() => {
    // inject if not already
    chrome.scripting
      .insertCSS({ target: { tabId: tab.id }, files: ["content.css"] })
      .then(() =>
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        })
      )
      .then(() => chrome.tabs.sendMessage(tab.id, { type: "toggleTimer" }))
      .catch((err) =>
        console.error("Injection failed, cannot toggle timer:", err)
      );
  });
});

// 4️⃣ Messages from content.js
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "openOptionsPage") {
    chrome.runtime.openOptionsPage();
  } else if (msg.type === "timerVisibility") {
    chrome.action.setBadgeText({ text: msg.visible ? "ON" : "" });
  }
});

// 5️⃣ Clear badge on install/update
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: "" });
});
