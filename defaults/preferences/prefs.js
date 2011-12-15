/////////// Relates only to the case when first installed
pref("extensions.piigeon.hasShownStartingPage", false);  // Show first run page for 4.0 once

/////////// Other preferences to control piigeon monitoring and reporting
// Send to our server (users can choose in "Preferences")
pref("extensions.piigeon.measure.server", true);
// Monitor form inputs besides passwords (users can choose in "Preferences")
pref("extensions.piigeon.input.monitor", false);
// Show only unprotected login in reports (we decide to show all reports now)
pref("extensions.piigeon.login.unprotected", false);
// 0: best guess; 1: ask you; 2: geolocatioin (we decide to use 2 now)
pref("extensions.piigeon.locatioin.choice", 2);
// 0: according to firefox; 1: always; 2: never (we decide to use 0 now)
pref("extensions.piigeon.history", 0);
// Don't save any historical info to sqlite db. This is calculated based on several factors (e.g., whether on
// private browsing, whether the user chooses to do so, etc.
pref("extensions.piigeon.historyblock", true);
// Try to use this bit as shared storage that solves the multiple-browser problem
pref("extensions.piigeon.multiple.browser", 0);

/////////// For internal versions only. We turn off this in public versions
// Whether or not show the debugging info.
pref("extensions.piigeon.dev", false);
