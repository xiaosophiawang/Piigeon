/* See license.txt for terms of usage */
/**
 * This file implements the debugger for internal use only
 */
var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch).QueryInterface(Components.interfaces.nsIPrefService);
var signons = [];

if (!piigeon) {
	var piigeon = {};
}

piigeon.debug = {
	counterArray: [],
    filenameDebug: "debug",
    file: "",
    converter: null,
    foStream: null,
    
    open: function(){
    },
    
    close: function(){
    },
    
    append: function(data){
    },
	
	print2ErrorConsole: function(s){
	},
	
	methodCounter: function(name) {
	}
};

piigeon.unitTest = {
    filenameUnitTest: "unitTest",
    file: "",

    open: function(){
    },
    
    close: function(){
    },
    
    append: function(data){
    },
    
    remove: function(){
    }
};

piigeon.test = {
    filenameUnitTest: "test",
    file: "",

    open: function(){
    },
    
    close: function(){
    },
    
    append: function(data){
    },
    
    remove: function(){
    }
};
