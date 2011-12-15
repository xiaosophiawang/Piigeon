/* See license.txt for terms of usage */
/**
 * This file contains logic to capture user interaction with Piigeon. For now,
 * we focus only on whether Piigeon warnings about unencrypted logins cause users 
 * to avoid logging in.
 */
if (!piigeon) {
    var piigeon = {};
}

piigeon.feedback = {
    timeoutInterval: 60000, // 1 min
    inProgress: false,
    doc: null,
    enc: null, // whether a login is encrypted
    t: null,
    
    init: function() {
    },
    
    // This is called when a login is focused which means that the user wants to log in
    start: function(doc, enc){
        this.inProgress = true;
        
        this.doc = doc;
        this.enc = enc;
        
        // Set up timer
        this.t = setTimeout(function(){
            piigeon.feedback.end();
        }, this.timeoutInterval);
    },
    
    nostop: function() {
        // The user logged in and didn't stop!
        piigeon.server.evaluateStopLoggingIn(this.doc, "N-" + this.enc + "-" + (new Date()));
        
        // Cancel the timer
        clearTimeout(this.t);
    },
    
    // After a timeout since the login is focused, we check whether the user submitted the login
    end: function(){
        this.inProgress = false;
        
        // The user didn't log in...
        piigeon.server.evaluateStopLoggingIn(this.doc, "Y-" + this.enc + "-" + (new Date()));
        
        // Cancel the timer
        clearTimeout(this.t);
    }
};
