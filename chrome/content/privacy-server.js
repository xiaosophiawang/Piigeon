/* See license.txt for terms of usage */
/**
 * This file implements all code that interacts with our servers for anonymous data reporting and time synchronization.
 * We do not collect any personally identifiable information from users.
 * We first cache everything in local DB and then send data in a batch
 * 1) when users open firefox and/or 2) when 24 hours have passed since 
 * the last report.
 */
if (!piigeon) {
	var piigeon = {};
}

var prefService = Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefBranch).QueryInterface(
				Components.interfaces.nsIPrefService);

piigeon.server = {

    /* Don't modify this area BEGIN */
	version : "publicxxx", // alpha, beta, public
	piigeonVersion : "1.5.0",
    /* Don't modify this area END */

	fid : null,

	dbInit : false,

	timer : 1000,

	url_server : "https://secure.piigeon.org/server/", // data is sent over secure channels

	url_start : null,
	url_basic : null,
	url_time_sync_ms : null,
	url_passwd : null,
	url_session : null,

	notifyBasicStatus : null,

	syncTime : null,
	lastSentTime : null,
	lastLocalTime : null,
	localTime : null,
	offsetTimezone : null,

	// Send to the server when browser is opened
	start : function() {

		// retrieve submission urls from server
		this.url_basic = this.url_server + "piigeon_basic.php";
		this.url_time_sync_ms = this.url_server + "piigeon_time_sync_ms.php";
		this.url_session = this.url_server + "piigeon_session.php";
		this.url_passwd = this.url_server + "piigeon_passwd.php";

		// sync time
		this.lastSentTime = this.syncTime = this.getServerTime();
		this.lastLocalTime = (new Date()).valueOf();
		try {
			piigeon.debug.print2ErrorConsole("lastLocalTime: "
					+ this.lastLocalTime + "\nlocalTime: "
					+ (new Date()).toString() + "\nsyncTime: "
					+ (new Date(this.syncTime)).toString());
		} catch (e) {
		}

		setInterval("piigeon.server.checkClock();", 60000);
	},

    // Sync local clock to server clock and adjust the difference if there is any.
    // If we haven't sent reports to the server for more than one day, we should send them.
	checkClock : function() {
		// the user has changed the time, we should sync with the server
		this.localTime = (new Date()).valueOf();
		if (this.localTime - this.lastLocalTime > 70000
				|| this.localTime - this.lastLocalTime < 50000) {
			this.syncTime = this.getServerTime();
		} else {
			this.syncTime += this.localTime - this.lastLocalTime;
		}
        
		try {
			piigeon.debug.print2ErrorConsole("diffTime: "
					+ (this.localTime - this.lastLocalTime).toString()
					+ "\nlocalTime: " + (new Date()).toString()
					+ "\nsyncTime: " + (new Date(this.syncTime)).toString());
		} catch (e) {
		}
        
		this.lastLocalTime = this.localTime;

		if (this.syncTime - this.lastSentTime >= 86400000) {
			this.update("1440", true, true);
			this.lastSentTime = this.syncTime;
		}
	},

	// ///////////////////////////////////////////////////////
	// callbacks
	// ///////////////////////////////////////////////////////

	// send to the server on log in
	phpLoginactual : function(site, page, actionp, action, mechanism, passenc,
			pageenc, referrer, cookies) {
		var r = (referrer) ? referrer : site;

		var cTime = this.printServerTime();
		try {
			piigeon.debug.print2ErrorConsole("printServerTime: " + cTime);
		} catch (e) {
		}

		piigeon.dbController.insertTempLogin(site, page, action, actionp, r,
				mechanism, passenc, pageenc, "", cTime);
	},

	// evaluate the login elements
	evaluateLoginElements : function(doc, predictedLoginButtons) {
		var type = "loginElements";
		var url = doc.location.href.split("?")[0];
		piigeon.dbController.insertTempEvaluation(type, url,
				predictedLoginButtons, "");
	},

	// evaluate actions
	evaluateActionPredicts : function(doc, predictedActions) {
		var type = "actionPredicts";
		var url = doc.location.href.split("?")[0];
		piigeon.dbController.insertTempEvaluation(type, url, predictedActions,
				"");

	},

	// evaluate wireless usage
	evaluateWirelessUsage : function(wirelessUsage) {
		var type = "wirelessUsage";
		piigeon.dbController.insertTempEvaluation(type, "", wirelessUsage, "");
	},

	// evaluate location cache
	evaluateLocationCache : function(locationCache) {
		var type = "locationCache";
		piigeon.dbController.insertTempEvaluation(type, "", locationCache, "");
	},

	// error reports
	evaluateErrorReports : function(doc, error) {
		var type = "errorReports";
		var url = doc.location.href.split("?")[0];
		piigeon.dbController.insertTempEvaluation(type, url, error, "");

	},

	// evaluate whether users stop logging in based on feedback from Piigeon
	evaluateStopLoggingIn : function(doc, check) {
		var type = "stopLoggingIn";
        var url = doc.location.href.split("?")[0];
		piigeon.dbController.insertTempEvaluation(type, url, check, "");
	},

	// ///////////////////////////////////////////////////////
	// functions that make http requests
	// ///////////////////////////////////////////////////////

	update : function(st, isBrowserClose, isReportingLogins) {
		var sessionTime = (st == null) ? Math.floor(
				(this.syncTime - this.lastSentTime) / 60000).toString() : st;

		if (isBrowserClose) {
			this.sendSession(sessionTime);
		}

		if (!this.dbInit)
			this.dbInit = piigeon.dbController.init();

		if (isReportingLogins) {
			// check whether we should send the login info
			var records = piigeon.dbController.selectTempRecord();

			var validate = false;

			var cTime = this.printServerTime();
			try {
				piigeon.debug.print2ErrorConsole("printServerTime: " + cTime);
			} catch (e) {
			}

			if (records.length > 0) {
				if (records[records.length - 1].loginlast == cTime)
					validate = false;
				else
					validate = true;
			}

			// send login data
			var logins = piigeon.dbController.selectTempLogin();

			if (logins.length > 0) {
				var param = "version=" + this.piigeonVersion + "&data="
						+ this.version;
				for ( var i = 0; i < logins.length; i++) {
					if (logins[i].reserved.substring(0, 3) == "old")
						continue;

					param += logins[i].site + "\t";
					param += logins[i].page + "\t";
					param += logins[i].action + "\t";
					param += logins[i].actionp + "\t";
					param += logins[i].referrer + "\t";
					param += logins[i].mechanism + "\t";
					param += logins[i].passenc + "\t";
					param += logins[i].pageenc + "\t";
					param += logins[i].cookies + "\n";
				}

				if (param.split("data=")[1] != this.version) {

					var evals = piigeon.dbController.selectTempEvaluation();
					param += "&evals=";
					for ( var i = 0; i < evals.length; i++) {
						param += evals[i].type + "\t\t\t" + evals[i].url
								+ "\t\t\t" + evals[i].data + "\t\t\t"
								+ evals[i].reserved + "\n";
					}

					var ch = serverxhr(this.url_basic, param);
					try {
						piigeon.debug.print2ErrorConsole(param);
					} catch (e) {
					}
					if (ch) {
						piigeon.dbController.updateTempLogin(logins);
						piigeon.dbController.deleteTempEvaluation();
					}
				}
			}
		}

		// if a new day: send password info, delete logins
		if (records.length == 0 || validate) {
			// insert record
			piigeon.dbController.insertTempRecord(cTime, "");
			piigeon.dbController.deleteAllTempLogin();

		}
	},

    // A session here is counted as each time the user opens FF. This is for us
    // to estimate how many active users there are. Note that we do not use 
    // any identifiers for this, so we cannot (and do not) associate data with users.
	sendSession : function(sessionTime) {
		
		// detect whether it's the last browser opened
		prefService.setIntPref("extensions.piigeon.multiple.browser", 0);
		var num, doc = gBrowser.selectedBrowser.contentDocument;
		if (doc) {
			num = prefService.getIntPref("extensions.piigeon.multiple.browser");
			prefService.setIntPref("extensions.piigeon.multiple.browser", num + 1);
		}
		num = prefService.getIntPref("extensions.piigeon.multiple.browser");
		if (num > 1)
			return;
		
		// send session to the server
		var param = "session=" + sessionTime + "&data=" + this.version + "&version=" + this.piigeonVersion;
		try {
			serverxhr(this.url_session, param);
		} catch (e) {
		}
	},

	// ///////////////////////////////////////////////////////
	// utility functions
	// ///////////////////////////////////////////////////////

	printServerTime : function() {

		// create Date object for current location
		var d = new Date(this.syncTime);

		// convert to msec
		// add local time zone offset
		// get UTC time in msec
		var utc = d.getTime() + (d.getTimezoneOffset() * 60000);

		// create new Date object for different city
		// using supplied offset
		var nd = new Date(utc - (3600000 * this.offsetTimezone));

		var t = nd.getFullYear() + "-" + (nd.getMonth() + 1).toString() + "-"
				+ nd.getDate();

		return t;
	},

	getServerTime : function() {
		var t = serverxhr(this.url_time_sync_ms, null);
		var temp = t.split(" ");
		try {
			this.offsetTimezone = parseInt(temp[1][2], 10);
			try {
				piigeon.debug.print2ErrorConsole("offset timezone: "
						+ this.offsetTimezone + "\nint time: " + temp[0]);
			} catch (e) {
			}
		} catch (e) {
		}
		return parseInt(temp[0], 10) * 1000;
	}
};

// ///////////////////////////////////////////////////////
// utility functions
// ///////////////////////////////////////////////////////

// This handles XMLHttpRequest (the http version of socket) that sends
// data to our server
function serverxhr(url, data) {
	var ch;
	var req = new XMLHttpRequest();
	if (data != null)
		ch = true;
	else
		ch = false;
	req.open('POST', url, ch);
	req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	if (data == null)
		req.setRequestHeader("Content-length", 0);
	else
		req.setRequestHeader("Content-length", data.length);
	req.setRequestHeader("Connection", "close");

	req.send(data);
	wait(200);

	req.onreadystatechange = function() {
	};

	try {
		if (req.status == 200)
			return req.responseText;
	} catch (e) {
	}

	return true;
}

function wait(msecs) {
	var start = new Date().getTime();
	var cur = start;
	while (cur - start < msecs) {
		cur = new Date().getTime();
	}
}
