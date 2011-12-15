/* See license.txt for terms of usage */
/**
 * This file implements the feature of using previous login results 
 * to predict future login if a login can't be predicted or
 * the prediction was incorrect.
 */
var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch).QueryInterface(Components.interfaces.nsIPrefService);

if (!piigeon) {
    var piigeon = {};
}

piigeon.prediction = {
    timeoutInterval: 5000,
    inProgress: false,
    status: null,
    httpTraffic: null, // http traffic with password
    httpReq: null, // http request with password
    t1: null,
    sanitizeCharacters: "       ",
    
    init: function(){
        // Init DB
        piigeon.dbController.init();
    },
    
    // This is called when a login has just been submitted, called by piigeon.onLoginSubmit()
    start: function(site, siteUrl, actionUrl, enc, time, password, username, referer, pageenc, t1){
        this.inProgress = true;
        this.t1 = t1;
        
        // Sanitize username in urls
        var r = (referer != null) ? referer.replace(username, this.sanitizeCharacters) : null;
        this.status = {
            site: site.replace(username, this.sanitizeCharacters),
            siteUrl: siteUrl.replace(username, this.sanitizeCharacters),
            actionUrl: actionUrl.replace(username, this.sanitizeCharacters),
            enc: enc,
            timep: time,
            password: password,
            username: username,
            referer: r,
			pageenc: pageenc
        };
        
        // Init
        this.httpTraffic = [];
        this.httpReq = [];

        // Start to listen to http traffic
		piigeon.http.init();
        
        // Set up status
        this.status = {
            site: site,
            siteUrl: siteUrl,
            actionUrl: actionUrl,
            enc: enc,
            timep: time,
            password: password
        };
        
        // Set up timer
        setTimeout(function(){
            piigeon.prediction.end();
        }, this.timeoutInterval);
    },
    
    // After a timeout since the login is submitted, we check whether there is an actual
    // login sent in the http traffic. If there is, we'll record to db and will record it
    // to rectify incorrect prediction data. We'll also send this information to our server
    // with the predicted login if the user enables this feature.
    end: function(){
    	// Stop listening to http
        piigeon.http.shut();
        
        this.inProgress = false;
        
		var s = this.status;
        if (this.httpTraffic.length != 0) {
            for (var i = 0; i < this.httpTraffic.length; i++) {
            	var h = this.httpTraffic[i];
				if (s.enc.toString() == h.IsHTTPS.toString()) // correct prediction
					continue;
                
                // Wrong prediction, needs update
				piigeon.updatePrediction(s.actionUrl, s.site, s.siteUrl, h.Url.split("?")[0], h.IsHTTPS, s.timep);
				
            }
        } else {
            // Wrong prediction, needs update
            piigeon.updatePrediction(s.actionUrl, s.site, s.siteUrl, h.Url.split("?")[0], h.IsHTTPS, s.timep);
            
            // Compare
            if (prefService.getBoolPref("extensions.piigeon.dev") &&
                !prefService.getBoolPref("extensions.piigeon.historyblock")) {
                piigeon.dbController.insertLoginComparison(s.site, s.siteUrl, s.actionUrl, s.enc, s.timep, "", "", "", "", "", "", "false", "");
            }
        }
    },
    
    // This is called by the http observer that detects whether there is a login sent in the http traffic.
    // We collect this information and will process them after the timeout in the end() function.
    callback: function(HttpHandle){
        if (!this.inProgress) {
			return;
		}
		
		if (this.status == null){
			return;
		}
		
 		HttpHandle.Site = piigeon.utils.findSite(HttpHandle.Host);
        
        // Search for the password in the HTTP data stream. If found, then 
        // this stream has the login data and we should check if it's encrypted.
        var confItem = {
            Content: this.status.password,
            Pattern: new RegExp(this.status.password, "g") // case sensitive
        };
        
        if (HttpHandle.Name == "In" && this.httpReq.length > 0) {
        	
            var ch = false, c = [];
            // Match http response with http requests
            for (var i = 0; i < this.httpReq.length; i++) {
                if (HttpHandle.Url == this.httpReq[i].Url) {
                    ch = true;
                    break;
                }
            }
            // If there is a match ...
            if (ch) {
                var domain = piigeon.utils.findSite(HttpHandle.Url.split("/")[2].split(":")[0]);

                var s = this.status;
                var h = this.httpReq[i];
                var penc = (s.pageenc == "https:") ? "true" : "false";
                var mech = h.Name + " ";
                mech += (h.FromUrl) ? "Url " : "";
                mech += (h.FromCookie) ? "Cookie " : "";
                mech += (h.FromData) ? "Data " : "";
                mech += (h.FromReferrer) ? "Referrer " : "";
                var correct = ((h.Name == "Out") && (s.actionUrl == h.Url.split("?")[0]) && 
                		(s.enc == h.IsHTTPS) && (!h.FromCookie) && (!h.FromReferrer));
                
                // Compare
                if (prefService.getBoolPref("extensions.piigeon.dev") &&
                    !prefService.getBoolPref("extensions.piigeon.historyblock")) {
                    piigeon.dbController.insertLoginComparison(s.site, s.siteUrl, s.actionUrl, 
                		s.enc, s.timep, h.Site, h.Url.split("?")[0], h.IsHTTPS, h.Name, mech,
                		h.Time, correct, "");
                }
                
                // Cache locally and wait for updating to server
                if (prefService.getBoolPref("extensions.piigeon.measure.server")) {
                    // We only need to de-anonymize h here because the others have already been
                    // anonymized in start().
                    piigeon.server.phpLoginactual(s.site, s.siteUrl, 
                    		h.Url.split("?")[0].replace(s.username, this.sanitizeCharacters), s.actionUrl, 
                    		mech, h.IsHTTPS, penc, s.referer, "");
                }
            }
        }
        
        // Match this traffic with password
        var HttpHandle = piigeon.utils.patternMatch(HttpHandle, confItem);
        
        // If there is a match ...
        if (HttpHandle != null) {
            this.httpTraffic.push(HttpHandle);
            if (HttpHandle.Name == "Out") {
                this.httpReq.push(HttpHandle);

                // Debug use only
        		if (prefService.getBoolPref("extensions.piigeon.dev")) {
        			var t = (new Date()).getTime();
        			var doc = gBrowser.selectedBrowser.contentDocument;
        			piigeon.test.append("submit\t" + doc.location.href + "\t" + 
        					(t - this.t1).toString() + "\n");
        		}
            }
        }
    }
};

