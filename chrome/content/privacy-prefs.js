/* See license.txt for terms of usage */
/**
 * This file handles user preferences
 */
var prefService = Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefBranch).QueryInterface(
				Components.interfaces.nsIPrefService);
var pbs = Components.classes["@mozilla.org/privatebrowsing;1"]
		.getService(Components.interfaces.nsIPrivateBrowsingService);

if (!piigeon) {
	var piigeon = {};
}

piigeon.prefs = {
	historyExpireDays : null,
	sanitizeTimeSpan : null,

    // This is called when the browser is opened to see whether we should delete something
    // in the local db according to the privacy policy.
	init : function() {

		// Whether the user chooses not to record any historical information in local DB
		var prefHistory = prefService.getIntPref("extensions.piigeon.history");

		if (prefHistory == 1)
			prefService.setBoolPref("extensions.piigeon.historyblock", false);
		else if (prefHistory == 2)
			prefService.setBoolPref("extensions.piigeon.historyblock", true);
		else if (pbs.privateBrowsingEnabled ||
		// prefService.getBoolPref("privacy.clearOnShutdown.history") ||
		prefService.getBoolPref("privacy.sanitize.sanitizeOnShutdown"))
			prefService.setBoolPref("extensions.piigeon.historyblock", true);
		else
			prefService.setBoolPref("extensions.piigeon.historyblock", false);

		// check time used to clear history when init
		this.historyExpireDays = prefService
				.getIntPref("browser.history_expire_days");

		// check the time span when clear recent history
		this.sanitizeTimeSpan = prefService
				.getIntPref("privacy.sanitize.timeSpan");

		// delete expired items
		var currentTime = new Date();
        
		// logindetected
		var times = piigeon.dbController.selectLogindetectedTime();
		for ( var i = 0; i < times.length; i++) {
			if (piigeon.utils.compareTimeOffset(times[i], currentTime,
					this.historyExpireDays))
				piigeon.dbController.deleteLogindetectedTime(times[i]);
		}
		// loginactual
		var times = piigeon.dbController.selectLoginactualTime();
		for ( var i = 0; i < times.length; i++) {
			if (piigeon.utils.compareTimeOffset(times[i], currentTime,
					this.historyExpireDays))
				piigeon.dbController.deleteLoginactualTime(times[i]);
		}
		// prediction
		var times = piigeon.dbController.selectPredictionTime();
		for ( var i = 0; i < times.length; i++) {
			if (piigeon.utils.compareTimeOffset(times[i], currentTime,
					this.historyExpireDays))
				piigeon.dbController.deletePredictionTime(times[i]);
		}
		// comparison
		var times = piigeon.dbController.selectComparisonTime();
		for ( var i = 0; i < times.length; i++) {
			if (piigeon.utils.compareTimeOffset(times[i], currentTime,
					this.historyExpireDays))
				piigeon.dbController.deleteComparisonTime(times[i]);
		}
	},

	// This is called when users click "Clear history" in FF which also clears Piigeon local data.
    // It looks identical to the above function because FF uses identical concepts ("browser.history_expire_days"
    // and "privacy.sanitize.timeSpan") to sanitize historical data.
	sanitize : function() {
		if (!prefService.getBoolPref("privacy.cpd.history"))
			return;

		// Whether the user chooses not to record any historical information in local DB
		var prefHistory = prefService.getIntPref("extensions.piigeon.history");

		if (prefHistory == 1)
			prefService.setBoolPref("extensions.piigeon.historyblock", false);
		else if (prefHistory == 2)
			prefService.setBoolPref("extensions.piigeon.historyblock", true);
		else if (pbs.privateBrowsingEnabled ||
		// prefService.getBoolPref("privacy.clearOnShutdown.history") ||
		prefService.getBoolPref("privacy.sanitize.sanitizeOnShutdown"))
			prefService.setBoolPref("extensions.piigeon.historyblock", true);
		else
			prefService.setBoolPref("extensions.piigeon.historyblock", false);

		if (!prefService.getBoolPref("extensions.piigeon.historyblock"))
			return;

		// check the time span when clear recent history
		this.sanitizeTimeSpan = prefService
				.getIntPref("privacy.sanitize.timeSpan");

		// delete expired items
		var currentTime = new Date();

        // Init DB
		piigeon.dbController.init();
        
		// logindetected
		try {
			var times = piigeon.dbController.selectLogindetectedTime();
			for ( var i = 0; i < times.length; i++) {
				if (piigeon.utils.compareTimeSanitize(times[i], currentTime,
						this.sanitizeTimeSpan))
					piigeon.dbController.deleteLogindetectedTime(times[i]);
			}
		} catch (e) {
		}
		// loginactual
		try {
			var times = piigeon.dbController.selectLoginactualTime();
			for ( var i = 0; i < times.length; i++) {
				if (piigeon.utils.compareTimeSanitize(times[i], currentTime,
						this.sanitizeTimeSpan))
					piigeon.dbController.deleteLoginactualTime(times[i]);
			}
		} catch (e) {
		}
		// prediction
		try {
			var times = piigeon.dbController.selectPredictionTime();
			for ( var i = 0; i < times.length; i++) {
				if (piigeon.utils.compareTimeSanitize(times[i], currentTime,
						this.sanitizeTimeSpan))
					piigeon.dbController.deletePredictionTime(times[i]);
			}
		} catch (e) {
		}
		// comparison
		try {
			var times = piigeon.dbController.selectComparisonTime();
			for ( var i = 0; i < times.length; i++) {
				if (piigeon.utils.compareTimeSanitize(times[i], currentTime,
						this.sanitizeTimeSpan))
					piigeon.dbController.deleteComparisonTime(times[i]);
			}
		} catch (e) {
		}
	}
};
