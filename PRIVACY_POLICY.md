# Privacy Policy for Floating Countdown Timer

**Effective Date:** [Date - May 1, 2025]

Thank you for using Floating Countdown Timer (the "Extension"). This policy describes the information the Extension collects and how it is used and stored.

## Information We Collect

The Extension collects and stores the following information solely for its core functionality:

1.  **Timer Settings:**
    - **Event Name:** The optional name you assign to a countdown event.
    - **Target Date and Time:** The specific date and time you set for the countdown target.
    - _(Stored using `chrome.storage.sync`)_
2.  **User Preferences:**
    - **Theme:** Your preference for the light or dark theme of the timer widget.
    - _(Stored using `chrome.storage.sync`)_
3.  **Timer Position:**
    - The screen coordinates (top, left) where you last placed the floating timer widget.
    - _(Stored using `chrome.storage.local`)_

## How We Use Information

The collected information is used exclusively to:

- Save your countdown timer settings so they persist between browser sessions and across your devices (when Chrome sync is enabled).
- Remember your preferred theme (light/dark).
- Restore the floating timer widget to its last known position on the screen.

## Data Storage and Security

- **`chrome.storage.sync`:** Timer Settings (Event Name, Target Time) and User Preferences (Theme) are stored using Chrome's sync storage API. This data is automatically synced by Google Chrome to your Google Account, allowing you to access your settings across different devices where you are logged in. The developer of this Extension **does not** have access to this synced data.
- **`chrome.storage.local`:** Timer Position is stored using Chrome's local storage API. This data remains only on the specific computer where you set the position and is not synced across devices or accessed by the developer.

We rely on the security mechanisms provided by Google Chrome and your operating system to protect this stored data.

## Data Sharing

We **do not** collect any personal information beyond what is described above. The information stored by the Extension (Timer Settings, Preferences, Position) is **never** shared with the developer or any third parties. It is used solely within your browser for the operation of the Extension.

## Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy within the extension description or on the extension's support page. You are advised to review this Privacy Policy periodically for any changes.

## Contact Us

If you have any questions about this Privacy Policy, please contact us:

- Via Email: thinknovatech@gmail.com
