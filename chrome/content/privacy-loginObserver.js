/* See license.txt for terms of usage */
/**
 * This file implements the observer for login submission, which is triggered 
 * by the submission of a password field
 */
if (!piigeon) {
	piigeon = {};
}

piigeon.LoginObserver = {

    pwmgr: null,
	
    observerService : null,
    
	init: function() {
		
        this.observer.pwmgr = this;

        if (!this.observerService)
            this.observerService = Cc["@mozilla.org/observer-service;1"].
                                     getService(Ci.nsIObserverService);
		
        this.prefBranch = Cc["@mozilla.org/preferences-service;1"].
                           getService(Ci.nsIPrefService).getBranch("signon.");
        this.prefBranch.QueryInterface(Ci.nsIPrefBranch2);
        this.prefBranch.addObserver("", this.observer, false);
		
        this.observerService.addObserver(this.observer, "earlyformsubmit", false);
        this.observerService.addObserver(this.observer, "xpcom-shutdown", false);
	},

    observer : {
        pwmgr : null,

        QueryInterface : XPCOMUtils.generateQI([Ci.nsIObserver, 
                                                Ci.nsIFormSubmitObserver,
                                                Ci.nsISupportsWeakReference]),

        notify : function (formElement, aWindow, actionURI) {
            try {
                this.pwmgr.onFormSubmit(formElement);
            } catch (e) {
            }

            return true; // Always return true, or form submit will be canceled.
        }
    },

    onFormSubmit : function (form) {
    	
    	try {
			var usernameField = null;
			var passwordField = null;
			var pwFields = [];
			
            // Locate the password fields in the form.
            var pwFields = [];
            for (var i = 0; i < form.elements.length; i++) {
                var element = form.elements[i];
                if (!(element instanceof Ci.nsIDOMHTMLInputElement) ||
                    element.type != "password")
                    continue;

                if (!element.value)
                    continue;

                pwFields.push({index: i, element: element});
            }
            
            // Simply choose the first password
            passwordField = pwFields[0].element;
            
            // Locate the username fields in the form.
			for ( var i = pwFields[0].index - 1; i >= 0; i--) {
				if (!form.elements[i].type)
					continue;
				if (form.elements[i].type.toUpperCase() == "TEXT") {
					usernameField = form.elements[i];
					break;
				}
			}

			// piigeon: call back
			if (passwordField) {
				piigeon.onLoginSubmit(usernameField, passwordField, form);
			}

			try {
				piigeon.debug.methodCounter("piigeon.LoginObserver.onLoginSubmit");
			}
			catch(ee){
			}
			
    	}
    	catch(e){
    		return;
    	}
    	return;
    }

};

