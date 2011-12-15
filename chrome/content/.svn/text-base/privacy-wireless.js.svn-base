/* See license.txt for terms of usage */
/**
 * This file handles the detection of wifi network so that
 * we can predict the location and reflect in the "Report" if any.
 */

netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
var wifi_service = Components.classes["@mozilla.org/wifi/monitor;1"].getService(Components.interfaces.nsIWifiMonitor);
wifi_service.startWatching(piigeon.wireless);

if (!piigeon) {
    var piigeon = {};
}

piigeon.wireless = {
    values: null,
    
    onChange: function(accessPoints){
        netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
        var maxMac = "";
        var maxSSID = "";
        var maxSignal = -999999;
        for (var i = 0; i < accessPoints.length; i++) {
			if (accessPoints[i].signal == 0)
				continue;
            if (accessPoints[i].signal > maxSignal) {
                maxMac = accessPoints[i].mac;
                maxSSID = accessPoints[i].ssid;
                maxSignal = accessPoints[i].signal;
            }
        }
        this.values = [];
        for (var i = 0; i < accessPoints.length; i++) {
			if (accessPoints[i].signal == 0 || accessPoints[i].ssid == "")
				continue;
            this.values.push({
                maxSSID: maxSSID,
                maxMac: maxMac,
                ssid: accessPoints[i].ssid,
				mac: accessPoints[i].mac,
				ss: accessPoints[i].signal
            });
        }
    },
    
    onError: function(value){
    },
    
    QueryInterface: function(iid){
        netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
        if (iid.equals(Components.interfaces.nsIWifiListener) ||
        iid.equals(Components.interfaces.nsISupports)) 
            return this;
        throw Components.results.NS_ERROR_NO_INTERFACE;
    }
};
