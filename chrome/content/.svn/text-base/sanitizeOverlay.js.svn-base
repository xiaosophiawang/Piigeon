/* See license.txt for terms of usage */
// This is an overlay to the existing FF dialog that ask users to sanitize their private data
// This purpose of this overlay is to sanitize Piigeon data even when users click to sanitize 
// private data on FF
function init(){
	// the original window is this overlay's parent 
	var winElement = window.parent.document.getElementById("SanitizeDialog");
	
	winElement.setAttribute("ondialogaccept", "piigeon.prefs.sanitize();gSanitizePromptDialog.sanitize();");
}

// hook our install
window.addEventListener("load", init, false);
