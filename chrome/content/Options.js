/* See license.txt for terms of usage */
/**
 * This file handles the window opened by clicking "Preferences"
 */
var prefService = Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefBranch).QueryInterface(Components.interfaces.nsIPrefService);
var pbs = Components.classes["@mozilla.org/privatebrowsing;1"]
            .getService(Components.interfaces.nsIPrivateBrowsingService);

if (!piigeon) {
    var piigeon = {};
}

// This is called when the preference page is opened
function init(){
    document.title = "Piigeon Preferences";
    
    // Read from preferences whether we should send data to our server
    var pref = prefService.getBoolPref("extensions.piigeon.measure.server");
    var allow = document.getElementById("allow");
    var notallow = document.getElementById("notallow");
	if (pref) {
		allow.setAttribute("selected", "true");
		notallow.setAttribute("selected", "false");
    }
	else {
		allow.setAttribute("selected", "false");
		notallow.setAttribute("selected", "true");
    }
        
    // Read from preferences whether we should monitor other inputs
    pref = prefService.getBoolPref("extensions.piigeon.input.monitor");
    var monitor_0 = document.getElementById("monitor-0");
	if (pref)
		monitor_0.setAttribute("checked", "true");
	else
		monitor_0.setAttribute("checked", "false");
	
    // Init DB
	piigeon.dbController.init();
}

function OK(){
	return true;
}

// This is called when the user clicks on the radio buttons that allow us to send
// anonymized data to our server
function selectServer() {
	var allow = document.getElementById("allow");
	var ch = false;
	if (allow.getAttribute("selected"))
		ch = true;
	prefService.setBoolPref("extensions.piigeon.measure.server", ch);
}

// This is called when the users toggles to monitor all form inputs (not only passwords).
function inputMonitor() {
	var monitor_0 = document.getElementById("monitor-0");
	var ch = false;
	if (monitor_0.getAttribute("checked"))
		ch = true;
	prefService.setBoolPref("extensions.piigeon.input.monitor", ch);
}

//////////////// 
/** The functions below provide more control over Piigeon, but
 *  these features are not implemented in this version.
 */
///////////////
function selectHistory(index){
    prefService.setIntPref("extensions.piigeon.history", index);
    
    if (index == 1) 
		prefService.setBoolPref("extensions.piigeon.history.block", false);
    else 
        if (index == 2) 
			prefService.setBoolPref("extensions.piigeon.history.block", true);
        else 
            if (pbs.privateBrowsingEnabled ||
            prefService.getBoolPref("piigeon.sanitize.sanitizeOnShutdown")) 
				prefService.setBoolPref("extensions.piigeon.history.block", true);
            else 
				prefService.setBoolPref("extensions.piigeon.history.block", false);
}


function selectLocation(index){
    prefService.setIntPref("extensions.piigeon.locatioin.choice", index);
	if (index == 1){
		piigeon.utils.askLocation();
	}
}
