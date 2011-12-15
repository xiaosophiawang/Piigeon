/* See license.txt for terms of usage */
/**
 * This file handles the window opened by clicking "Report"
 */
const Cc = Components.classes;
const Ci = Components.interfaces;

var prefService = Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefBranch).QueryInterface(
				Components.interfaces.nsIPrefService);
var loginItems = [];
var signons = [];
var currentLogins;
var currentPass;
var sgns;
var wirelessItems;
var lastSelectIndex = 0;
var sharedPasswds = [];
var addrs = [];
var stringsBundle;

if (!piigeon) {
	var piigeon = {};
}

// This is called when the report is opened. It'll handle all the scripts that are needed to render the report
// It reads and processes info from the local db and passes it to addListItem() which handles the visual part
// of the report
function init() {
	// Initialize DB
	piigeon.dbController.init();
    stringsBundle = document.getElementById("string-bundle");

	// Read login info from password manager for comparison with logins 
	// that are sent in the clear (and potentially compromised across multiple sites)
	var passwordmanager = Components.classes["@mozilla.org/login-manager;1"]
			.getService(Components.interfaces.nsILoginManager);
	try {
		signons = passwordmanager.getAllLogins({});
	} catch (e) {
	}

	var visibleData = [];
	var childData = [];
	var sites = piigeon.dbController.selectLoginSite();
	var currentTime = (new Date()).toString();
	var latestTime = "";

	for ( var i = 0; i < sites.length; i++) {
		var handleUrls = piigeon.dbController.selectLoginUrl(sites[i]);
		var pages = {}, g, b, num = 0, key;
		for ( var j = 0; j < handleUrls.length; j++) {
			if (pages[handleUrls[j].siteUrl]) {
				if (handleUrls[j].enc == "true")
					pages[handleUrls[j].siteUrl].good += 1;
				else
					pages[handleUrls[j].siteUrl].bad += 1;
			} else {
				g = (handleUrls[j].enc == "true") ? 1 : 0;
				b = 1 - g;
				pages[handleUrls[j].siteUrl] = {
					good : g,
					bad : b
				};
				num += 1;
			}
		}
		var isContainerEpt = (num == 1);
		var visit = 0;
		var encrypt = true;
		var enclevel = 0;
		var childElement = [];

		if (isContainerEpt) {
			for (key in pages) {
				if (pages[key].bad > 0)
					encrypt = false;
				enclevel = Math.floor(pages[key].good
						/ (pages[key].bad + pages[key].good) * 5);
				var v = piigeon.dbController.selectLoginVisits(sites[i], key);
				visit += v.length;
				latestTime = v[v.length - 1].time;
			}
		} else {
			var j = 0, g = 0, b = 0;
			for (key in pages) {
				var v = piigeon.dbController.selectLoginVisits(sites[i], key);
				visit += v.length;

				if (j == 0)
					latestTime = v[v.length - 1].time;
				else
					latestTime = piigeon.utils.compareTime(latestTime,
							v[v.length - 1].time);

				g += pages[key].good;
				b += pages[key].bad;

				var visitText = piigeon.utils.timeNum2Text(v.length, true)
						+ ", ";
				visitText += stringsBundle.getString('string_last_visit')
						+ piigeon.utils.elapsedTime(v[v.length - 1].time,
								currentTime);
				
				childElement.push([
						key, visitText,
						Math.floor(pages[key].good
								/ (pages[key].bad + pages[key].good) * 5),
						(pages[key].bad).toString() ]);

				j += 1;
			}
			enclevel = Math.floor(enclevel / visit * 5);
		}

		var visitText = piigeon.utils.timeNum2Text(visit, true) + ", ";
		visitText += stringsBundle.getString('string_last_visit') + piigeon.utils.elapsedTime(latestTime, currentTime);

		var enclevel = Math.floor(g / (g + b) * 5);

		addListItem(sites[i], visitText, enclevel, (b == 0).toString(), "site");

		for ( var ii = 0; ii < childElement.length; ii++) {
			addListItem(childElement[ii][0], childElement[ii][1], childElement[ii][2], childElement[ii][3], sites[i]);
		}
	}
}

// Handles the XUL tree that renders an item in the report
function addListItem(site, visitText, enclevel, enc, type) {
	try {
		var rlb = document.getElementById("id-rlb");
		var rli = document.createElement("richlistitem");
		rli.setAttribute("class", "lr-item");
		rlb.appendChild(rli);
		var hb = document.createElement("hbox");
		rli.appendChild(hb);

		// ratings
		var rating = document.createElement("vbox");
		rating.setAttribute("width", "80px");
		hb.appendChild(rating);

		var spacer = document.createElement("hbox");
		spacer.setAttribute("height", "12px");
		rating.appendChild(spacer);

		var rating2 = document.createElement("hbox");
		rating.appendChild(rating2);

		var star = document.createElement("hbox");
		star.setAttribute("width", "5px");
		rating2.appendChild(star);
		for ( var ii = 0; ii < enclevel; ii++) {
			var star = document.createElement("image");
			rating2.appendChild(star);
			star.setAttribute("src", "chrome://piigeon/skin/star_c.png");
		}

		for ( var ii = enclevel; ii < 5; ii++) {
			var star = document.createElement("image");
			rating2.appendChild(star);
			star.setAttribute("src", "chrome://piigeon/skin/star_g.png");
		}

		// domain icon
		var icon = document.createElement("vbox");
		icon.setAttribute("width", "20px");
		hb.appendChild(icon);

		var spacer = document.createElement("hbox");
		spacer.setAttribute("height", "10px");
		icon.appendChild(spacer);

		var icon2 = document.createElement("hbox");
		icon.appendChild(icon2);

		var iconimage = document.createElement("image");
		icon2.appendChild(iconimage);
		iconimage.setAttribute("src", "http://" + site + "/favicon.ico");
		iconimage.setAttribute("width", "16px");
		iconimage.setAttribute("height", "16px");

		// domain
		var domain = document.createElement("vbox");
		domain.setAttribute("width", "200px");
		domain.setAttribute("style", "overflow: hidden;");
		hb.appendChild(domain);

		var domainName = document.createElement("label");
		domain.appendChild(domainName);
		if (type == "site") {
			domainName.setAttribute("class", "lr-domainName");
			domainName.setAttribute("value", site);
		} else {
			domainName.setAttribute("class", "lr-domainNameSub");
			domainName.setAttribute("value", '  ' + site);
		}

		var vst = document.createElement("label");
		vst.setAttribute("class", "lr-vst");
		domain.appendChild(vst);
		if (type == "site") {
			vst.setAttribute("value", visitText);
		} else {
			vst.setAttribute("value", '  ' + visitText);
		}

		// password sharing
		var passwd = document.createElement("vbox");
		passwd.setAttribute("width", "230px");
		hb.appendChild(passwd);

		var passh = document.createElement("hbox");
		passwd.appendChild(passh);

		var passa = document.createElement("label");
		passh.appendChild(passa);

		var passvb = document.createElement("vbox");
		passh.appendChild(passvb);

		var passvbb = document.createElement("vbox");
		passvbb.setAttribute("height", "5px");
		passvb.appendChild(passvbb);

		var passb = document.createElement("label");
		passvb.appendChild(passb);

		var passshare = passSharing(site, enc, type);
		sharedPasswds.push(passshare);
		if (passshare == -1) {
			passa.setAttribute("value", "");
			passa.setAttribute("class", "lr-pass-hint");
		} else {
			if (enc == "true" && passshare.countBad) {
				passa.setAttribute("value", stringsBundle.getString('string_yes'));
				passa.setAttribute("class", "lr-pass-yes");
			} else {
				passa.setAttribute("value", stringsBundle.getString('string_no'));
				passa.setAttribute("class", "lr-pass-no");
			}
			if (enc == "true") {
				if (passshare.countBad == 0)
					temp = stringsBundle.getString('string_share') + passshare.countGood
							+ stringsBundle.getString('string_safe_sites');
				else
					temp = stringsBundle.getString('string_share') + passshare.countBad
							+ stringsBundle.getString('string_unsafe_sites');
			} else {
				if (passshare.countGood == 0)
					temp = stringsBundle.getString('string_share') + passshare.countBad
							+ stringsBundle.getString('string_unsafe_sites');
				else
					temp = stringsBundle.getString('string_share') + passshare.countGood
							+ stringsBundle.getString('string_safe_sites');
			}
			passb.setAttribute("value", temp);
			passb.setAttribute("class", "lr-pass-alert");

		}

		// location
		var location = document.createElement("vbox");
		location.setAttribute("width", "50px");
		hb.appendChild(location);

		var location2 = document.createElement("hbox");
		location.appendChild(location2);

		var findLoc = findLocation(site, enc, type);
		addrs.push(findLoc);

		var vb = document.createElement("vbox");
		location2.appendChild(vb);

		var locimage = document.createElement("image");
		vb.appendChild(locimage);
		locimage.setAttribute("class", "lr-locimage");
		if (findLoc != null)
			locimage.setAttribute("src", "chrome://piigeon/skin/loc_c.png");
		else
			locimage.setAttribute("src", "chrome://piigeon/skin/loc_g.png");
	} catch (e) {
		Components.utils.reportError(e);
	}
}

// This is called by addListItem(). Here we try to match the password of an item (site/page)
// to passwords of sites/pages in the FF password manager. We categorize sites/pages that share
// the same password with the item by whether or not they were sent encrypted by the action url
// in the form in which the logins were submitted. Piigeon will display a note that recommends 
// a user to change the password for the site sending the password in the clear and for any 
// other sites that share the same password.
function passSharing(site, enc, type) {
	// find all passwords for the site
	currentPass = [];
	if (type == "site") {
		for ( var i = 0; i < signons.length; i++) {
			if (site == piigeon.utils.findSite(findDomain(signons[i].hostname)
					.split(":")[0])) {
				var ch = true;
				for ( var k = 0; k < currentPass.length; k++) {
					if (currentPass[k] == signons[i].password) {
						ch = false;
						break;
					}
				}
				if (ch)
					currentPass.push(signons[i].password);
			}
		}
	} else {
		for ( var i = 0; i < signons.length; i++) {
			if (site == findDomain(signons[i].hostname).split(":")[0]) {
				var ch = true;
				for ( var k = 0; k < currentPass.length; k++) {
					if (currentPass[k] == signons[i].password) {
						ch = false;
						break;
					}
				}
				if (ch)
					currentPass.push(signons[i].password);
			}
		}
	}

	if (currentPass.length == 0)
		return -1; // We haven't detected any...
        
	// find sites that share the same passwords
	var countGood = countBad = 0;
	sgns = [];
	for ( var j = 0; j < currentPass.length; j++) {
		for ( var i = 0; i < signons.length; i++) {
			// skip unencrypted/encrypted sites
			if (signons[i].formSubmitURL == null)
				continue;

			// skip the same site
			var ch = true;
			if (type == "site"
					&& site == piigeon.utils.findSite(findDomain(
							signons[i].hostname).split(":")[0])) {
				ch = false;
			}
			if (type != "site"
					&& site == findDomain(signons[i].hostname).split(":")[0]) {
				ch = false;
			}

			if (currentPass[j] == signons[i].password
					&& signons[i].formSubmitURL.split(":")[0] == "https") {
				if (ch) {
					countGood += 1;
					sgns.push({
						formSubmitURL : signons[i].formSubmitURL,
						hostname : signons[i].hostname,
						httpRealm : signons[i].httpRealm,
						username : signons[i].username,
						color : "green"
					});
				}
			}
			if (currentPass[j] == signons[i].password
					&& signons[i].formSubmitURL.split(":")[0] == "http") {
				if (ch) {
					countBad += 1;
					sgns.push({
						formSubmitURL : signons[i].formSubmitURL,
						hostname : signons[i].hostname,
						httpRealm : signons[i].httpRealm,
						username : signons[i].username,
						color : "red"
					});
				}
			}
		}
	}

	if (enc == "true") {
		if (countBad == 0)
			return {
				countGood : countGood,
				countBad : countBad,
				color : "red",
				sgns : sgns
			};
		return {
			countGood : countGood,
			countBad : countBad,
			color : "green",
			sgns : sgns
		};
	} else {
		if (countGood == 0)
			return {
				countGood : countGood,
				countBad : countBad,
				color : "green",
				sgns : sgns
			};
		return {
			countGood : countGood,
			countBad : countBad,
			color : "red",
			sgns : sgns
		};
	}
}

// Called when an item is selected. We basically shrink the previous selected item and expand
// the currently selected item and show pages that share passwords with this site/page with
// indicating whether user should change passwords.
function onListSelect(selectedIndex) {
	var rlb = document.getElementById("id-rlb");

	// clear the old selected item
	rlb.childNodes[lastSelectIndex].setAttribute("style", "height: 40px;");
	try {
		var location = rlb.childNodes[lastSelectIndex].childNodes[0].childNodes[4].childNodes[0];
		location.removeChild(location.childNodes[1]);
	} catch (e) {
	}
	try {
		var ps = rlb.childNodes[lastSelectIndex].childNodes[0].childNodes[3];
		ps.removeChild(ps.childNodes[1]);
	} catch (e) {
	}
	try {
		var ps = rlb.childNodes[lastSelectIndex].childNodes[0].childNodes[3].childNodes[0].childNodes[0];

		if (ps.getAttribute("value") == stringsBundle.getString('string_site_not_store_pwd'))
			ps.setAttribute("value", "");
	} catch (e) {
	}
	lastSelectIndex = selectedIndex;

	// set the new selected item
	rlb.childNodes[selectedIndex].setAttribute("style", "height: 60px;");

	var location = rlb.childNodes[selectedIndex].childNodes[0].childNodes[4].childNodes[0];
	var vb = document.createElement("vbox");
	vb.setAttribute("class", "lr-loc-detail");
	location.appendChild(vb);

	// add locations
	try {
		var locs = addrs[selectedIndex];
		for ( var i = 0; i < locs.length; i++) {
			if (locs[i].address == undefined)
				continue;
			var label = document.createElement("label");
			label.setAttribute("value", locs[i].address);
			vb.appendChild(label);
		}
	} catch (e) {
	}

	// add shared passwords
	try {
		var ps = rlb.childNodes[selectedIndex].childNodes[0].childNodes[3];
		var vb = document.createElement("vbox");
		vb.setAttribute("class", "lr-loc-detail");
		ps.appendChild(vb);

		var pss = sharedPasswds[selectedIndex].sgns;
		var color = sharedPasswds[selectedIndex].color;
		for ( var i = 0; i < pss.length; i++) {
			if (color == pss[i].color)
				continue;
			var label = document.createElement("label");
			label.setAttribute("value", pss[i].hostname);
			vb.appendChild(label);
		}
	} catch (e) {
	}

	// no password is stored
	try {
		var ps = rlb.childNodes[selectedIndex].childNodes[0].childNodes[3].childNodes[0].childNodes[0];

		if (ps.getAttribute("value") == "")
			ps.setAttribute("value", stringsBundle.getString('string_site_not_store_pwd'));
	} catch (e) {
	}
}

//////////////////////////// Utility functions

function findDomain(s) {
	var temp = s.split("/");
	if (temp.length == 1)
		return temp[0];
	if (temp.length > 2)
		return temp[2];
	return temp[1];
}

// Find the (geographic) location in the local cache
function findAddress(lat, lng) {
	var latitude = Math.round(lat * 10000) / 10000;
	var longitude = Math.round(lng * 10000) / 10000;
	return piigeon.dbController.selectLocationcache(latitude, longitude)[0];
};

// Find the recorded location according to the wireless-geolocation API
function findLocation(site, enc, type) {
	// line 5: location, a.k.a. wireless network
	// read detailed info from db
	if (type == "site")
		currentLogins = piigeon.dbController.selectLoginVisitsSite(site);
	else
		currentLogins = piigeon.dbController.selectLoginVisitsUrl(site, enc);

	var count = 0;
	var wirelessItems = [];
	for ( var i = 0; i < currentLogins.length; i++) {
		if (currentLogins[i].wireless != "") {
			count += 1;
			var mac = currentLogins[i].wireless.split(" ")[0];
			var ssid = currentLogins[i].wireless.split(" ")[1];
			var latitude = currentLogins[i].wireless.split(" ")[2];
			var longitude = currentLogins[i].wireless.split(" ")[3];
			var check = true;
			for ( var j = 0; j < wirelessItems.length; j++) {
				if (mac == wirelessItems[j].mac) {
					wirelessItems[j].times += 1;
					check = false;
					break;
				}
			}
			if (check)
				wirelessItems.push({
					mac : mac,
					ssid : ssid,
					latitude : latitude,
					longitude : longitude,
					times : 1
				});
		}
	}

	// Map to the MAC addresses with strongest signals, and then compact
	addressItems = [];
	for ( var i = 0; i < wirelessItems.length; i++) {
		var address = findAddress(wirelessItems[i].latitude,
				wirelessItems[i].longitude);
		var check = true;
		for ( var j = 0; j < addressItems.length; j++) {
			if (address == addressItems[j].address) {
				addressItems[j].times += wirelessItems[i].times;
				check = false;
				break;
			}
		}
		if (check && address) {
			addressItems.push({
				address : address,
				times : wirelessItems[i].times
			});
		}
	}

	// Show wireless.innerHTML
	if (addressItems.length > 0)
		return addressItems;

	return null;
};

// Called when "Remove All" is clicked
function removeAll(){
	var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
		.getService(Components.interfaces.nsIPromptService);
	var result = prompts.confirm(null, "Remove All Records", "Are you sure you wish to remove all login records?");
	if (result) {
		piigeon.dbController.deleteLoginItemAll();
		var rlb = document.getElementById("id-rlb");
		while (rlb.firstChild){
			rlb.removeChild(rlb.firstChild);
		}
	}
}

// Called when user clicks on 'Okay'
function OK() {
	return true;
}
