/* See license.txt for terms of usage */
/**
 * This implements the main features of this extension.
 */

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cr = Components.results;
var prefService = Components.classes["@mozilla.org/preferences-service;1"]
	.getService(Components.interfaces.nsIPrefBranch).QueryInterface(
				Components.interfaces.nsIPrefService);
var pbs = Components.classes["@mozilla.org/privatebrowsing;1"]
	.getService(Components.interfaces.nsIPrivateBrowsingService);

if (!piigeon) {
	var piigeon = {};
}

piigeon = {
	confItems : [],
	patt : [],
	actionUrls : [],
	currentPageMeta : true,
	currentFocusElement : null,
	cbAnalyzePageSuccess : false,
	timeoutTotal : 10000, // 10 seconds
	timeoutInterval : 2000, // 2 seconds
	currentTimeout : 0,
	countWireless : null,
	performance : [],

	// ///////////////////////////////////////////////////////
	// listeners
	// ///////////////////////////////////////////////////////
	// Main entrance of this ff extension and initialization
	init : function() {
		// Debug use only
		piigeon.test.open();
		piigeon.unitTest.open();
		piigeon.debug.open();

		// Add listeners
		window.addEventListener("unload", piigeon.onUnload, false);
		window.addEventListener("pagehide", piigeon.onPagehide, false);
		
		// When a page is loaded, run piigeon.cbAnalyzePage
		// This fires the major feature of this extension
		var appcontent = document.getElementById("appcontent");
		if (appcontent)
			appcontent.addEventListener("load", piigeon.cbAnalyzePage, true);

		// Init db so that we can use the local sqlite db on user browsers
		piigeon.dbController.init();

		// Handle different versions if users update from an old version
		piigeon.dbController.handleVersion();
		this.countWireless = piigeon.dbController.readCountWireless();

		// Init login observer which detects whether there is a login on a page
		piigeon.LoginObserver.init();

		// Init prefs, low priority.
		try {
			piigeon.prefs.init();
		} catch (e) {
		}

		// Show preference window on install so that users can choose whether or
		// not send data to our server
		if (!prefService.getBoolPref("extensions.piigeon.hasShownStartingPage")) {
			window.openDialog('chrome://piigeon/content/Options.xul', '', 'chrome,centerscreen');
			prefService.setBoolPref("extensions.piigeon.hasShownStartingPage", true);
		}

		// If users choose to send data to our server, we should establish the connection to our server
		if (prefService.getBoolPref("extensions.piigeon.measure.server")) {
			piigeon.server.start();
			piigeon.server.update(null, false, true);
		}
	},

	// This is fired when the current page is gone (tab is closed,
	// or a new page is loaded)
	onPagehide : function() {
		var loginText = document.getElementById("p_loginAlert");
		var loginImage = document.getElementById("p_loginImage");
		loginText.setAttribute('collapsed', 'true');
		loginImage.setAttribute('collapsed', 'true');
	},

	// This is fired when the browser is closed
	onUnload : function() {
		// detect whether it's the last browser opened
		// TODO
		prefService.setIntPref("extensions.piigeon.multiple.browser", 0);
		var num, doc = gBrowser.selectedBrowser.contentDocument;
		if (doc) {
			num = prefService.getIntPref("extensions.piigeon.multiple.browser");
			prefService.setIntPref("extensions.piigeon.multiple.browser", num + 1);
		}
		num = prefService.getIntPref("extensions.piigeon.multiple.browser");
		if (num > 1)
			return;
		
		// server mode
		if (prefService.getBoolPref("extensions.piigeon.measure.server")) {
			piigeon.server.update(null, true, false);
		}
		window.removeEventListener("unload", piigeon.onUnload, false);
		piigeon.test.close();
		piigeon.unitTest.close();
		piigeon.debug.close();
	},

	// This is fired when users mouse over the login button.
	// It will show a red/green icon near the mouse and will also show
	// explanatory text in the status bar
	onMouseover : function(element, doc) {
		var actionUrl = "";
		var feature = piigeon.utils.hashElement(element);

		for (i = piigeon.actionUrls.length - 1; i >= 0; i--) {
			if (feature == piigeon.actionUrls[i].feature) {
				actionUrl = piigeon.actionUrls[i].actionUrl;
				if (actionUrl != "")
					break;
			}
		}
		piigeon.closePresBubble();
		var loginText = document.getElementById("p_loginAlert");
		var loginImage = document.getElementById("p_loginImage");
		var parentDoc = gBrowser.selectedBrowser.contentDocument;
		var host = piigeon.utils.findSite(parentDoc.location.href.split("/")[2]
				.split(":")[0]);

		try {
			var anchor = doc.getElementById("presBubble");
			if (actionUrl == "") {
				anchor.innerHTML = "<img src='" + piigeon.utils.questImageURI
						+ "' width='20px' height='20px'/>";
				loginText.setAttribute('value',
						'Sorry, Piigeon cannot tell whether your password will be encrypted.');
				loginImage.setAttribute('src', piigeon.utils.questImageURI);
			} else if (actionUrl.split("/")[0] == "https:") {
				anchor.innerHTML = "<img src='" + piigeon.utils.checkImageURI
						+ "' width='20px' height='20px'/>";
				loginText.setAttribute('value',
						'This page sends your password with encryption.');
				loginImage.setAttribute('src', piigeon.utils.checkImageURI);

			} else if (actionUrl.split("/")[0] == "http:") {
				anchor.innerHTML = "<img src='" + piigeon.utils.crossImageURI
						+ "' width='20px' height='20px'/>";
				loginText.setAttribute('value',
						'This page lets eavesdroppers see your password.');
				loginImage.setAttribute('src', piigeon.utils.crossImageURI);
			}
			anchor.style.visibility = "visible";
			loginText.setAttribute('collapsed', 'false');
			loginImage.setAttribute('collapsed', 'false');
		} catch (e) {
		}
	},

	// This is fired when users mouse out the login button
	// This will remove the red/green icon and the explanary text on the status bar
	onMouseout : function(element, doc) {
		var loginText = document.getElementById("p_loginAlert");
		var loginImage = document.getElementById("p_loginImage");
		loginText.setAttribute('collapsed', 'true');
		loginImage.setAttribute('collapsed', 'true');

		// var doc = gBrowser.selectedBrowser.contentDocument;
		var anchor = doc.getElementById("presBubble");
		anchor.style.visibility = "hidden";

		// re-focus
		if (piigeon.currentFocusElement != null) {
			piigeon.onFocusElement(piigeon.currentFocusElement, doc);
		}
	},

	// This is fired when mouse is on the login button and is moving
	onMousemove : function(event, element, doc) {
		var pltsoffsetX = 15;
		var pltsoffsetY = 0;
		var pltsTipLayer = doc.getElementById("presBubble");
		if (pltsTipLayer.innerHTML == '')
			return true;
		var MouseX = event.clientX;
		var MouseY = event.clientY;
		var popHeight = pltsTipLayer.clientHeight;
		var popWidth = pltsTipLayer.clientWidth;
		if (MouseY + pltsoffsetY + popHeight > doc.body.clientHeight) {
			popTopAdjust = -popHeight - pltsoffsetY * 1.5;
		} else {
			popTopAdjust = 0;
		}
		if (MouseX + pltsoffsetX + popWidth > doc.body.clientWidth) {
			popLeftAdjust = -popWidth - pltsoffsetX * 2;
		} else {
			popLeftAdjust = 0;
		}
		var x = MouseX + pltsoffsetX + popLeftAdjust
				+ gBrowser.selectedBrowser.contentWindow.pageXOffset;
		var y = MouseY + pltsoffsetY + popTopAdjust
				+ gBrowser.selectedBrowser.contentWindow.pageYOffset;
		pltsTipLayer.style.left = x.toString() + "px";
		pltsTipLayer.style.top = y.toString() + "px";
		return true;
	},

	onFocus : function(element, doc, encryption) {
        // Start watch whether users stop logging in with our safety info
        piigeon.feedback.start(doc, encryption);
        
		piigeon.currentFocusElement = element;
		piigeon.onFocusElement(piigeon.currentFocusElement, doc);
	},

	// This is fired when users focus on the password box or when users
	// switch the tab. Similarly, we will show a red/green icon and explanary
	// text on the status bar
	onFocusElement : function(element, doc) {
		var box = element.getBoundingClientRect();
		var actionUrl = "";
		var feature = piigeon.utils.hashElement(element);
		for (i = piigeon.actionUrls.length - 1; i >= 0; i--) {
			if (feature == piigeon.actionUrls[i].feature) {
				actionUrl = piigeon.actionUrls[i].actionUrl;
				break;
			}
		}
		piigeon.closePresBubble();
		var loginText = document.getElementById("p_loginAlert");
		var loginImage = document.getElementById("p_loginImage");
		var parentDoc = gBrowser.selectedBrowser.contentDocument;
		var host = piigeon.utils.findSite(parentDoc.location.href.split("/")[2]
				.split(":")[0]);
		var anchor = doc.getElementById("presBubble");
		var height = box.bottom - box.top;

		if (actionUrl == "") {
			anchor.innerHTML = "<img src='" + piigeon.utils.questImageURI + "' width='"
					+ height + "px' height='" + height + "px'/>";
			loginText.setAttribute('value',
					'Sorry, Piigeon cannot tell whether your password will be encrypted.');
			loginImage.setAttribute('src', piigeon.utils.questImageURI);
		} else if (actionUrl.split("/")[0] == "https:") {
			anchor.innerHTML = "<img src='" + piigeon.utils.checkImageURI + "' width='"
					+ height + "px' height='" + height + "px'/>";
			loginText.setAttribute('value',
					'This page sends your password with encryption.');
			loginImage.setAttribute('src', piigeon.utils.checkImageURI);
		} else if (actionUrl.split("/")[0] == "http:") {
			anchor.innerHTML = "<img src='" + piigeon.utils.crossImageURI + "' width='"
					+ height + "px' height='" + height + "px'/>";
			loginText.setAttribute('value',
					'This page lets eavesdroppers see your password.');
			loginImage.setAttribute('src', piigeon.utils.crossImageURI);
		}
		loginText.setAttribute('collapsed', 'false');
		loginImage.setAttribute('collapsed', 'false');
		anchor.style.visibility = "visible";
		var newX = box.right - height
				+ gBrowser.selectedBrowser.contentWindow.pageXOffset;
		var newY = box.top + gBrowser.selectedBrowser.contentWindow.pageYOffset;
		anchor.style.left = newX.toString() + "px";
		anchor.style.top = newY.toString() + "px";
	},

	// This is fired when users unfocus the password box
	onBlur : function(element, doc) {
		piigeon.currentFocusElement = null;
		var loginText = document.getElementById("p_loginAlert");
		var loginImage = document.getElementById("p_loginImage");
		loginText.setAttribute('collapsed', 'true');
		loginImage.setAttribute('collapsed', 'true');
		var anchor = doc.getElementById("presBubble");
		anchor.style.visibility = "hidden";
	},

	// Callback on tab change
	cbAnalyzePageTab : function(event) {
		piigeon.cbAnalyzePageSuccess = false;
		piigeon.cbAnalyzePage(event, true);
	},

	// Callback on 'pageshow'
	cbAnalyzePage : function(event, fromTab) {
        // Filter out unrelated pageshows
		if (!fromTab && gBrowser.selectedBrowser.contentDocument.location.href != event.originalTarget.location.href)
			return;
		if (!fromTab && event.originalTarget.location.href == "about:blank")
			return;

		if (prefService.getBoolPref("extensions.piigeon.dev")) {
			var t1 = (new Date()).getTime();
		}

		try {
			piigeon.debug.methodCounter("piigeon.cbAnalyzePage");
		} catch (e) {
		}
		var hasPasswds = false;
		var predictedLoginButtons = "";
		var predictedActions = "";

		// In case that this is called before piigeon is initialized
		try {
			if (!piigeon)
				piigeon = {};
		} catch (e) {
		}
		piigeon.actionUrls = [];

		var loginText = document.getElementById("p_loginAlert");
		var loginImage = document.getElementById("p_loginImage");
		loginText.setAttribute('collapsed', 'true');
		loginImage.setAttribute('collapsed', 'true');

		var globalDoc = gBrowser.selectedBrowser.contentDocument;
		var docs = [ globalDoc ];// .documentElement;
		var docsProcess = [ gBrowser.selectedBrowser.contentDocument ];
		var iframes = null, frames = null;

		// Count all the iframes in by using BFS
		while (docsProcess.length > 0) {
			doc = docsProcess.pop();

			// embed bubble
			piigeon.embedBubble(doc);

			iframes = doc.getElementsByTagName("iframe");
			for (i = 0; i < iframes.length; i++) {
				docsProcess.push(iframes[i].contentDocument);
				docs.push(iframes[i].contentDocument);
			}
			frames = doc.getElementsByTagName("frame");
			for (i = 0; i < frames.length; i++) {
				docsProcess.push(frames[i].contentDocument);
				docs.push(frames[i].contentDocument);
			}
		}

		// Examine all possible login buttons and password boxes which are easier
		for (ii = 0; ii < docs.length; ii++) {
			var doc = docs[ii];

			// find general inputs
			if (prefService.getBoolPref("extensions.piigeon.input.monitor"))
				piigeon.inputs.findInputs(doc);

			// when focus on password inputs
			var inputs = doc.getElementsByTagName('input');

			for ( var i = 0; i < inputs.length; i++) {
				if (inputs[i].getAttribute('type') == null)
					continue;
				if (inputs[i].getAttribute('type').toUpperCase() == 'PASSWORD') {
					hasPasswds = true;
					var t = piigeon.domPredictAction(inputs[i], doc);
					if (t) {
						predictedActions += t.split("?")[0] + "\t\t";
					}
				}
			}

			// when mouse over the "submit" button
			// 1. 2. <input type='image'/> <input type='submit'/>
			var inputs = doc.getElementsByTagName('input');
			for ( var i = 0; i < inputs.length; i++) {
				if (inputs[i].getAttribute('type') == null)
					continue;
				if (inputs[i].getAttribute('type').toUpperCase() == 'IMAGE'
						|| inputs[i].getAttribute('type').toUpperCase() == 'SUBMIT') {
					var t = piigeon.domFindLogin(inputs[i], doc);
					if (t) {
						predictedLoginButtons += t + "\t\t";
					}
				}
			}

			// 3. <button type='submit'/>
			var inputs = doc.getElementsByTagName('button');
			for ( var i = 0; i < inputs.length; i++) {
				if (inputs[i].getAttribute('type') == null)
					continue;
				if (inputs[i].getAttribute('type').toUpperCase() == 'SUBMIT') {
					var t = piigeon.domFindLogin(inputs[i], doc);
					if (t) {
						predictedLoginButtons += t + "\t\t";
					}
				}
			}

			// 4. js (inaccurate), <a href='javascript:...'/>
			var inputs = doc.getElementsByTagName('a');
			for ( var i = 0; i < inputs.length; i++) {
				var checkHref = piigeon.domCheckHeuristicsLogin(inputs[i],
						'href');
				if (checkHref) {
					var t = piigeon.domFindLogin(inputs[i], doc);
					if (t) {
						predictedLoginButtons += t + "\t\t";
					}
				}
			}

			// 5. js (inaccurate), <xxx onclick='...'/>
			var elementList = [ "img", "input#type=button", "span", "a" ];
			for ( var j = 0; j < elementList.length; j++) {
				var parseList = elementList[j].split("#");
				var inputs = doc.getElementsByTagName(parseList[0]);
				for ( var i = 0; i < inputs.length; i++) {
					for ( var k = 1; k < parseList.length; k++) {
						var attr = parseList[k].split("=")[0];
						var attrValue = parseList[k].split("=")[1];
						if (inputs[i].getAttribute(attr) == null)
							continue;
						if (inputs[i].getAttribute(attr).toUpperCase() != attrValue)
							continue;
					}
					var checkOnclick = piigeon.domCheckHeuristicsLogin(
							inputs[i], 'onclick');
					if (checkOnclick) {
						var t = piigeon.domFindLogin(inputs[i], doc);
						if (t) {
							predictedLoginButtons += t + "\t\t";
						}
					}
				}

			}

			// Record evaluation data if users agreed to send data to our server
			if (prefService.getBoolPref("extensions.piigeon.measure.server")) {
				if (hasPasswds) {
					piigeon.server.evaluateActionPredicts(globalDoc,
							predictedActions);
					piigeon.server.evaluateLoginElements(globalDoc,
							predictedLoginButtons);
				}
			}

		}

		// Debug use only
		if (prefService.getBoolPref("extensions.piigeon.dev")) {
			var t = (new Date()).getTime();
			var doc = gBrowser.selectedBrowser.contentDocument;
			for (var i = piigeon.performance.length - 1; i>0 ; i--){
				if (piigeon.performance[i].url == doc.location.href) {
					piigeon.unitTest.append(doc.location.href + "\t" + (t - piigeon.performance[i].time).toString() + "\n");
					break;
				}
			}
			piigeon.test.append("visit\t" + doc.location.href + "\t" + (t - t1).toString() + "\n");
		}
	},

	// ///////////////////////////////////////////////////////
	// callbacks
	// ///////////////////////////////////////////////////////
	// Called when a login is submitted.
	// We compare whether we correctly predict the safety of login
	// and we record data to the browser if users agreed to send data
	// to our server
	onLoginSubmit : function(usernameField, newPasswordField, form) {
    
        // The user didn't stop logging in with our info
        piigeon.feedback.nostop();
    
		var t1 = (new Date()).getTime();
		var usernameValue = usernameField ? usernameField.value : null;
		if (!usernameValue)
			usernameValue = null;

		if (pbs.privateBrowsingEnabled)
			return;

		var doc = gBrowser.selectedBrowser.contentDocument;
		var site = piigeon.utils.findSite(doc.location.href.split("/")[2]
				.split(":")[0]);

		// eliminate the "multiple browser" bug
		// if there are multiple windows, gBrowser will trigger all the opened windows
		var od = form, cd;
		while (od) {
			cd = od;
			od = od.ownerDocument;
		}
		if (cd.location.href != doc.location.href)
			return;
		// done with eliminating the "multiple browser" bug
		
		var referer = (doc.referrer) ? doc.referrer.split("?")[0] : null;
		var siteUrl = doc.location.href.split("?")[0];
		var url = "";
		var enc = "";
		var time = new Date();
		var pageenc = doc.location.href.split("/")[0];

		var feature = piigeon.utils.hashElement(newPasswordField);
		var actionUrl = "";
		for (i = piigeon.actionUrls.length - 1; i >= 0; i--) {
			if (feature == piigeon.actionUrls[i].feature) {
				actionUrl = piigeon.actionUrls[i].actionUrl;
				if (actionUrl != "")
					break;
			}
		}

		try {
			// we use actionUrl, but not form.action here, because form.action
			// could have changed as to page load.
			if (actionUrl) {
				url = form.action.split("?")[0];
				enc = (url.split("/")[0] == "https:");

				// insert into db: loginactual
				var wv = null;
				try {
					wv = piigeon.wireless.values;
				} catch (e) {
				}
                piigeon.insertLoginactual(site, siteUrl.split("/")[2].split(":")[0], url, enc, time, wv);
			}
		} catch (e) {
		}
        
		// Predict the login and record to the browser
		piigeon.prediction.start(site, siteUrl, url, enc, time, newPasswordField.value, usernameValue, referer, pageenc, t1);
	},

	// ///////////////////////////////////////////////////////
	// other functions
	// ///////////////////////////////////////////////////////
	// Check login heuristics
	domCheckHeuristicsLogin : function(element, attribute) {
		var text = element.getAttribute(attribute);
		if (text == null)
			return;
		if (attribute == 'href' && text.substring(0, 10) != "JAVASCRIPT")
			return false;
		var innerhtml = element.innerHTML;

		text = text.toUpperCase();
		innerhtml = innerhtml.toUpperCase();

		// match particular texts
		var cl = text.match(new RegExp(
				'SUBMIT|SIGNIN|LOGIN|SIGNON|LOGON|CHECK|GO[^A-Z0-9]|VALIDATE',
				'gi'));

		// exclude particular texts
		var il = innerhtml.match(new RegExp(
				'FORGET|FORGOT|CANCEL|KEEP|REMEMBER|LOOK', 'gi'));

		if (cl)
			piigeon.debug.print2ErrorConsole(attribute + "\n" + text + "\n"
					+ cl + "\n" + il);

		if (il != null)
			return false;

		il = text.match(new RegExp('FORGET|FORGOT|CANCEL|KEEP|REMEMBER|LOOK',
				'gi'));
		if (il != null)
			return false;

		if (cl == null)
			return false;

		return true;
	},

	// Find logins and hook on events such as 'mouseover'
	domFindLogin : function(element, doc) {
		var temp = element;
		var feature = piigeon.utils.hashElement(element);
		var success = false;
		var ch = 0;

		if (element.tagName.toUpperCase() == "INPUT") {
			var f = element.form, ch = 0;
			if (f) {
				for ( var i = 0; i < f.elements.length; i++) {
					if (!f.elements[i].type)
						continue;
					if (f.elements[i].type.toUpperCase() == "PASSWORD") {
						if (!piigeon.utils.checkVisibility(f.elements[i]))
							continue;
						ch = ch + 1;
					}
				}
				if (ch > 0) {
					if (f.action) {
						piigeon.actionUrls.push({
							feature : feature,
							actionUrl : f.action
						});
					} else {
						var predictUrl = this.searchPrediction(f.baseURI
								.split("?")[0]);
						piigeon.actionUrls.push({
							feature : feature,
							actionUrl : predictUrl
						});
					}

					element.addEventListener("mouseover", function() {
						piigeon.onMouseover(element, doc);
					}, false);
					element.addEventListener("mouseout", function() {
						piigeon.onMouseout(element, doc);
					}, false);
					element.addEventListener("mousemove", function(event) {
						piigeon.onMousemove(event, element, doc);
					}, false);

					success = true;
				}
				if (success) {
					if (prefService.getBoolPref("extensions.piigeon.dev")) {
						return piigeon.utils.hashElement(element);
					} else
						return element.tagName;
				} else
					return false;
			}
		}

		while (temp.parentNode && temp.parentNode.tagName) {
			temp = temp.parentNode;
			if (temp.tagName.toString().toUpperCase() == "FORM") {
				for (j = 0; j < doc.forms.length; j++) {
					if (doc.forms[j].action == temp.action) {
						var ch = 0;
						for ( var k = 0; k < doc.forms[j].elements.length; k++) {
							if (!doc.forms[j].elements[k].type)
								continue;
							if (doc.forms[j].elements[k].type.toUpperCase() == "PASSWORD") {
								if (!piigeon.utils
										.checkVisibility(doc.forms[j].elements[k]))
									continue;
								ch = ch + 1;
							}
						}
						if (ch > 0) {
							if (doc.forms[j].action) {
								piigeon.actionUrls.push({
									feature : feature,
									actionUrl : doc.forms[j].action
								});
							} else {
								var predictUrl = this
										.searchPrediction(doc.forms[j].baseURI
												.split("?")[0]);
								piigeon.actionUrls.push({
									feature : feature,
									actionUrl : predictUrl
								});
							}

							element.addEventListener("mouseover", function() {
								piigeon.onMouseover(element, doc);
							}, false);
							element.addEventListener("mouseout", function() {
								piigeon.onMouseout(element, doc);
							}, false);
							element.addEventListener("mousemove", function(
									event) {
								piigeon.onMousemove(event, element, doc);
							}, false);

							success = true;
						}
					}
				}
			}
		}

		if (success) {
			if (prefService.getBoolPref("extensions.piigeon.dev")) {
				return piigeon.utils.hashElement(element);
			} else
				return element.tagName;
		} else
			return false;

	},

	// Find out whether the page uses http or https to submit logins
	// This is based on the action field of the form element
	domPredictAction : function(element, doc) {
		var form = element.form;
		var feature = piigeon.utils.hashElement(element);
		var returnValue = "";
		var hasURL = null;
		var hasNoURL = null;
        var encryption = "U"; // Unknown

		if (form == null) {
			try {
				piigeon.debug.print2ErrorConsole("[no error] "
						+ "form == null "
						+ doc.location.href.split("/")[2].split(":")[0]);
			} catch (e) {
			}
			var predictUrl = this
					.searchPrediction(doc.location.href.split("?")[0]);

			piigeon.actionUrls.push({
				feature : feature,
				actionUrl : predictUrl
			});
			if (predictUrl) {
				hasURL = predictUrl;
				returnValue = "noForm=history";
			} else {
				returnValue = "noForm=nohistory";
			}
		} else if (!form.action || form.action.length < 3) {
			try {
				piigeon.debug.print2ErrorConsole("[no error] "
						+ "form.action == null "
						+ form.baseURI.split("/")[2].split(":")[0]);
			} catch (e) {
			}
			var predictUrl = this.searchPrediction(form.baseURI.split("?")[0]);

			piigeon.actionUrls.push({
				feature : feature,
				actionUrl : predictUrl
			});
			if (predictUrl) {
				hasURL = predictUrl;
				returnValue = "noAction=history";
			} else {
				returnValue = "noAction=nohistory";
			}
		} else {
			hasURL = form.action;
			try {
				piigeon.debug.print2ErrorConsole("[no error] " + "form.action "
						+ form.action);
			} catch (e) {
			}
			piigeon.actionUrls.push({
				feature : feature,
				actionUrl : form.action
			});
			returnValue = "action=" + form.action;

			// Insert a login item into db
			if (!pbs.privateBrowsingEnabled) {
				var site = piigeon.utils.findSite(form.baseURI.split("/")[2]
						.split(":")[0]);
				var siteUrl = form.baseURI.split("/")[2].split(":")[0];
				var url = form.action.split("?")[0];
				var enc = (url.split("/")[0] == "https:");
                encryption = enc ? "Y" : "N";
				var time = new Date();
				if (!prefService.getBoolPref("extensions.piigeon.historyblock") && 
                    prefService.getBoolPref("extensions.piigeon.dev")) {
                        piigeon.dbController.insertLogindetected(site, siteUrl, url, enc, time);
                }
			}
		}

        element.addEventListener("focus", function() {
			piigeon.onFocus(element, doc, encryption);
		}, false);
		element.addEventListener("blur", function() {
			piigeon.onBlur(element, doc);
		}, false);

		if (form == null)
			return returnValue;

		// hook login buttons, for those with no form, but do have <input .../>
		var s = "";
		for (i = 0; i < form.elements.length; i++) {
			if (form.elements[i].getAttribute('type') == null)
				continue;
			if (form.elements[i].getAttribute('type').toUpperCase() == 'SUBMIT'
					|| form.elements[i].getAttribute('type').toUpperCase() == 'IMAGE') {
				piigeon.domFindLoginSub(form.elements[i], doc);
			}
			s += form.elements[i].getAttribute('type') + "\n";
		}

		return returnValue;
	},

	// This is for login buttons which have no associated form
    // domFindLogin() assumes that the target elements have associated form with them
	domFindLoginSub : function(element, doc) {

		try {
			piigeon.debug.methodCounter("piigeon.domFindLoginSub");
		} catch (e) {
		}
		var form = element.form;
		var feature = piigeon.utils.hashElement(element);
		var success = false;

		if (form.action && form.action.length > 2) {
			piigeon.actionUrls.push({
				feature : feature,
				actionUrl : form.action
			});

			success = true;

		}

		if (!success) {
			var predictUrl = this.searchPrediction(form.baseURI.split("?")[0]);
			piigeon.actionUrls.push({
				feature : feature,
				actionUrl : predictUrl
			});
		}

		element.addEventListener("mouseover", function() {
			piigeon.onMouseover(element, doc);
		}, false);
		element.addEventListener("mouseout", function() {
			piigeon.onMouseout(element, doc);
		}, false);
		element.addEventListener("mousemove", function(event) {
			piigeon.onMousemove(event, element, doc);
		}, false);

	},

	closePresBubble : function() {
		try {
			var doc = gBrowser.selectedBrowser.contentDocument;

			if (doc) {
				// Dismiss bubble if already exists
				el = doc.getElementById("presBubble");
				if (el) {
					el.style.visibility = "hidden";
				}
			}
		} catch (e) {
		}
	},

	// ///////////////////////////////////////////////////////
	// functions that access local DB
	// ///////////////////////////////////////////////////////

    // Search in DB that can be used to predict undetected logins
	searchPrediction : function(siteUrl) {
		var predictUrl = "";
		var actionUrls = piigeon.dbController.selectPrediction(siteUrl);
		if (actionUrls.length > 0)
			predictUrl = actionUrls[actionUrls.length - 1];
		return predictUrl;
	},

    // If a previous prediction is incorrect, we need to adjust it by the actual login
	updatePrediction : function(url, site, siteUrl, actionUrl, enc, time) {
        // This should be prevented if the user chooses not to save any historical info
		if (!prefService.getBoolPref("extensions.piigeon.historyblock")) {
            return;
        }
        
        // Debug use only
        try {
            piigeon.debug.print2ErrorConsole("[no error] "
                    + "updatePrediction " + site + " " + siteUrl + " "
                    + actionUrl);
        } catch (e) {
        }
        
        // Update prediction
        piigeon.dbController.deletePrediction(siteUrl, actionUrl);
        piigeon.dbController.insertPrediction(site, siteUrl, actionUrl, enc, time);

		// insert into db: loginactual
		if (url == "" && !piigeon.prefs.boolBlockRecord) {
			var wv = null;
			try {
				wv = piigeon.wireless.values;
			} catch (e) {
			}
			piigeon.insertLoginactual(site, siteUrl.split("/")[2].split(":")[0], actionUrl, enc, time, wv);
			if (prefService.getBoolPref("extensions.piigeon.dev")) {
				Components.utils.reportError("[no error] " + "updatePrediction");
            }
		}
	},

    // Insert the actual login that'll be shown in Piigeon Report
	insertLoginactual : function(site, siteUrl, url, enc, time, values) {
        // This should be prevented if the user chooses not to save any historical info
		if (!prefService.getBoolPref("extensions.piigeon.historyblock")) {
            return;
        }
        
        // Debug use only
		try {
			piigeon.debug.methodCounter("piigeon.insertLoginactual");
		} catch (e) {
		}

		if (site != piigeon.utils.findSite(siteUrl))
			return;

		// insert loginactual item into db
		if (values == null) {
			piigeon.dbController.insertLoginactual(site, siteUrl, url, enc, time, "");
		} else if (values.length == 0) {
			piigeon.dbController.insertLoginactual(site, siteUrl, url, enc, time, "");
		} else {
			var mac = values[0].maxMac;
			var ssid = values[0].maxSSID;
			var geolocation = Components.classes["@mozilla.org/geolocation;1"]
					.getService(Components.interfaces.nsIDOMGeoGeolocation);
			geolocation.getCurrentPosition(function(position) {
				var wls = mac + " " + ssid + " " + position.coords.latitude
						+ " " + position.coords.longitude;
				piigeon.dbController.insertLoginactual(site, siteUrl, url, enc, time, wls);
				piigeon.findAddress(position.coords.latitude, position.coords.longitude);
			});
		}

        // Send evaluation info to our server
		if (prefService.getBoolPref("extensions.piigeon.measure.server")) {
			if (values == null || values.length == 0) {
				piigeon.server.evaluateWirelessUsage("noWireless");
			} else {
				piigeon.server.evaluateWirelessUsage("wireless");
			}
		}

		// not on a wireless network
		if (values == null || values.length == 0)
			return;

		// Insert wireless data
		if (this.countWireless == null)
			this.countWireless = piigeon.dbController.readCountWireless();
		this.countWireless += 1;
		for ( var i = 0; i < values.length; i++)
			piigeon.dbController.insertWireless(this.countWireless,
					values[i].maxSSID, values[i].maxMac, values[i].ssid,
					values[i].mac, values[i].ss, time);

	},

	// ///////////////////////////////////////////////////////
	// utility functions
	// ///////////////////////////////////////////////////////

    // Embed the red/green/orange icon on a Web page
	embedBubble : function(doc) {

		// embed the bubble
		var body = doc.getElementsByTagName("body")[0];
		try {
			var dgf = document.getElementById("presBubble");
			body.removeChild(dgf);
		} catch (e) {
		}
		try {
			// presentation bubble
			var anchor = doc.createElement('div');
			anchor.id = "presBubble";
			anchor.style.visibility = "hidden";
			anchor.style.zIndex = "2147483647";
			anchor.style.position = "absolute";
			anchor.style.textDecoration = "none";
			body.appendChild(anchor);
		} catch (e) {
		}

	},

	// This translates lat/long to street address and caches this information in local db.
    // We use this information to remind users where they logged in in order to indicate
    // whether their logins were potentially insecure (e.g., in an airport, or a hotel)
    // Note that this information is kept local and we do not send it to our server.
	findAddress : function(lat, lng) {
		var latitude = Math.round(lat * 10000) / 10000;
		var longitude = Math.round(lng * 10000) / 10000;

		// if has cached, doesn't have to cache again
		var vals = piigeon.dbController
				.selectLocationcache(latitude, longitude);

		if (prefService.getBoolPref("extensions.piigeon.measure.server")) {
			if (vals.length > 0) {
				piigeon.server.evaluateLocationCache("hasCached");
			} else {
				piigeon.server.evaluateLocationCache("notCached");
			}
		}

		if (vals.length > 0)
			return;

		var url = "http://ws.geonames.org/findNearestIntersection?lat="
				+ latitude + "&lng=" + longitude;
		var req = new XMLHttpRequest();
		var responseText = "";
		req.open('GET', url, false);
		req.overrideMimeType('text/plain; charset=x-user-defined');
		req.send(null);
		if (req.status == 200)
			responseText = req.responseText;
		else
			return lat + ", " + lng;
		var parser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
				.createInstance(Components.interfaces.nsIDOMParser);
		var doc = parser.parseFromString(responseText, "text/xml");

		var street1 = doc.getElementsByTagName("street1")[0].childNodes[0].nodeValue;
		var street2 = doc.getElementsByTagName("street2")[0].childNodes[0].nodeValue;
		var placename = doc.getElementsByTagName("placename")[0].childNodes[0].nodeValue;
		var adminCode1 = doc.getElementsByTagName("adminCode1")[0].childNodes[0].nodeValue;
		try {
			var postalcode = doc.getElementsByTagName("postalcode")[0].childNodes[0].nodeValue;
		} catch (e) {
			var postalcode = "";
		}

		var address = street1 + " and " + street2 + ", " + placename + " "
				+ adminCode1;
		piigeon.dbController.insertLocationcache(latitude, longitude, address);
	}
};

// hook our install
window.addEventListener("load", piigeon.init, false);

// Add listener for tab selection
gBrowser.tabContainer.addEventListener("TabSelect", piigeon.cbAnalyzePageTab, false);
