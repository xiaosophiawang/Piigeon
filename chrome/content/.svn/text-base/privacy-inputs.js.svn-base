/* See license.txt for terms of usage */
/**
 * This file handles the case when the user chooses to have Piigeon check 
 * whether /all/ inputs (not just passwords) are sent encrypted. This 
 * is disabled by default.
 */

if ("undefined" == typeof (piigeon)) {
	var piigeon = {};
};

piigeon.inputs = {
	hasNotified: false,

	findInputs : function(doc) {

		this.hasNotified = false;
		
		// 1 <input type='text'>
		var inputs = doc.getElementsByTagName('input');
		for ( var i = 0; i < inputs.length; i++) {
			if (inputs[i].getAttribute('type') == null
					|| inputs[i].getAttribute('type').toUpperCase() == 'TEXT') {
				var t = piigeon.inputs.domPredictAction(inputs[i], doc, "text");
				if (t && inputs[i].focus) {
					piigeon.inputs.onFocusElement(inputs[i], doc, "text");
				}
			}
		}

		// 2 <select>
		var inputs = doc.getElementsByTagName('select');
		for ( var i = 0; i < inputs.length; i++) {
			var t = piigeon.inputs.domPredictAction(inputs[i], doc, "select");
			if (t && inputs[i].focus) {
				piigeon.inputs.onFocusElement(inputs[i], doc, "select");
			}
		}

		// 3 <textarea>
		var inputs = doc.getElementsByTagName('textarea');
		for ( var i = 0; i < inputs.length; i++) {
			var t = piigeon.inputs.domPredictAction(inputs[i], doc, "textarea");
			if (t && inputs[i].focus) {
				piigeon.inputs.onFocusElement(inputs[i], doc, "textarea");
			}
		}
	},

	domPredictAction : function(element, doc, type) {
		try {
			piigeon.debug.methodCounter("piigeon.inputs.domPredictAction");
		} catch (e) {
		}
		var form = element.form;
		var feature = piigeon.utils.hashElement(element);
		var returnValue = "";
		var hasURL = null;
		var hasNoURL = null;

		if (form == null) {
			var predictUrl = piigeon.searchPrediction(doc.location.href
					.split("?")[0]);

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
			var predictUrl = piigeon
					.searchPrediction(form.baseURI.split("?")[0]);
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
			piigeon.actionUrls.push({
				feature : feature,
				actionUrl : form.action
			});
			returnValue = "action=" + form.action;
		}

		element.addEventListener("focus", function() {
			piigeon.inputs.onFocus(element, doc, type);
		}, false);
		element.addEventListener("blur", function() {
			piigeon.inputs.onBlur(element, doc);
		}, false);

		return returnValue;
	},

	onFocus : function(element, doc, type) {
		piigeon.inputs.currentFocusElement = element;
		piigeon.inputs.onFocusElement(piigeon.inputs.currentFocusElement, doc,
				type);
	},

	onFocusElement : function(element, doc, type) {
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

		var parentDoc = gBrowser.selectedBrowser.contentDocument;
		var host = piigeon.utils.findSite(parentDoc.location.href.split("/")[2]
				.split(":")[0]);

		var anchor = doc.getElementById("presBubble");

		var height = box.bottom - box.top;
		
		if (type == "textarea" && height > 24)
			height = 24;

		if (actionUrl == "") {
			anchor.innerHTML = "<img src='" + piigeon.utils.questImageURI + "' width='"
					+ height + "px' height='" + height
					+ "px' style='opacity:0.4;filter:alpha(opacity=40)'/>";
		} else if (actionUrl.split("/")[0] == "https:") {
			anchor.innerHTML = "<img src='" + piigeon.utils.checkImageURI + "' width='"
					+ height + "px' height='" + height
					+ "px' style='opacity:0.4;filter:alpha(opacity=40)'/>";
		} else if (actionUrl.split("/")[0] == "http:") {
			anchor.innerHTML = "<img src='" + piigeon.utils.crossImageURI + "' width='"
					+ height + "px' height='" + height
					+ "px' style='opacity:0.4;filter:alpha(opacity=40)'/>";
		}
		anchor.style.visibility = "visible";
		var newX, newY;

		switch (type) {
		case "text":
			newX = box.right - height
					+ gBrowser.selectedBrowser.contentWindow.pageXOffset;
			newY = box.top + gBrowser.selectedBrowser.contentWindow.pageYOffset;
			break;
		case "checkbox":
			newX = box.right - height
					+ gBrowser.selectedBrowser.contentWindow.pageXOffset;
			newY = box.top + gBrowser.selectedBrowser.contentWindow.pageYOffset;
			break;
		case "select":
			newX = box.right - 2*height
					+ gBrowser.selectedBrowser.contentWindow.pageXOffset;
			newY = box.top + gBrowser.selectedBrowser.contentWindow.pageYOffset;
			break;
		case "textarea":
			newX = box.right - height
					+ gBrowser.selectedBrowser.contentWindow.pageXOffset;
			newY = box.top + gBrowser.selectedBrowser.contentWindow.pageYOffset;
			break;
		default:
			newX = box.right - height
					+ gBrowser.selectedBrowser.contentWindow.pageXOffset;
			newY = box.top + gBrowser.selectedBrowser.contentWindow.pageYOffset;
		}

		anchor.style.left = newX.toString() + "px";
		anchor.style.top = newY.toString() + "px";
	},

	onBlur : function(element, doc) {
		piigeon.inputs.currentFocusElement = null;
		var anchor = doc.getElementById("presBubble");
		anchor.style.visibility = "hidden";
	}
};
