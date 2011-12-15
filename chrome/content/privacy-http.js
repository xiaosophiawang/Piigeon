/* See license.txt for terms of usage */
/**
 * This file handles all interactions about http traffic.
 * It uses the observer service that FF provides, though only 
*  a subset of the required methods is actually used.
 */
if (!piigeon) {
	var piigeon = {};
}

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cr = Components.results;
var observerService = Cc["@mozilla.org/observer-service;1"]
		.getService(Ci.nsIObserverService);
var ioService = Cc["@mozilla.org/network/io-service;1"]
		.getService(Ci.nsIIOService);

var prefService = Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefBranch).QueryInterface(
				Components.interfaces.nsIPrefService);

piigeon.http = {
	observers : [],

	init : function() {
		observerService.addObserver(this, "http-on-modify-request", false);
		observerService.addObserver(this, "http-on-examine-response", false);
	},

	shut : function() {
		observerService.removeObserver(this, "http-on-modify-request");
		observerService.removeObserver(this, "http-on-examine-response");
	},

	addObserver : function(observer, topic, weak) {
		this.observers.push(observer);
	},

	removeObserver : function(observer, topic) {
		for ( var i = 0; i < this.observers.length; i++) {
			if (this.observers[i] == observer) {
				this.observers.splice(i, 1);
				break;
			}
		}
	},

	enumerateObservers : function(topic) {
		return null;
	},

    // Observe different kinds of traffic
	observe : function(subject, topic, data) {
		try {
			
		switch (topic) {
		case "app-startup":
			this.init();
			break;
		case "quit-application":
			this.shut();
			break;
		case "http-on-modify-request":
			subject.QueryInterface(Components.interfaces.nsIHttpChannel);
			this.onModifyRequest(subject);
			break;
		case "http-on-examine-response":
			subject.QueryInterface(Components.interfaces.nsIHttpChannel);
			this.onExamineResponse(subject);
			break;
		default:
			break;

		try {
			piigeon.debug.methodCounter("piigeon.http.observe");
		}
		catch(e){}
		}
		}
		catch(e){
		}
		return;
	},

    // Called when an http request is observed
	onModifyRequest : function(HttpChannel) {
		var HttpHandle = [];

		// shared by requests and responses
		HttpHandle.Win = this.getWindowForRequest(HttpChannel);
		HttpHandle.Name = "Out";
		HttpHandle.Data = ""; // not null if "POST"
		HttpHandle.Time = new Date();
		HttpHandle.Url = HttpChannel.URI ? HttpChannel.URI.asciiSpec : null;
		HttpHandle.IsHTTPS = (HttpHandle.Url.split("://")[0] == "https") ? true
				: false;

		HttpHandle.ContentType = null;
		HttpHandle.IsFromCache = null;
		HttpHandle.SetCookie = null;
		HttpHandle.TransferEncoding = null;
		HttpHandle.Number = 0;
		HttpHandle.FromUrl = false;
		HttpHandle.FromCookie = false;
		HttpHandle.FromData = false;
		HttpHandle.FromReferrer = false;
		HttpHandle.InTab = false;
		HttpHandle.Visible = false;
		HttpHandle.Site = null;
		HttpHandle.Level = "";
		HttpHandle.Term = "";

		// requests only
		HttpHandle.Referrer = (HttpChannel.referrer) ? HttpChannel.referrer.asciiSpec
				: null;
		try {
			HttpHandle.Host = HttpChannel.getRequestHeader("Host");
		} catch (e) {
			HttpHandle.Host = null;
		}
		try {
			HttpHandle.GetCookie = HttpChannel.getRequestHeader("Cookie");
		} catch (e) {
			HttpHandle.GetCookie = null;
		}

		// get body for POST
		if (HttpChannel.requestMethod == "POST") {
			// Get the postData stream from the Http Object
			try {
				// Must change HttpChannel to UploadChannel to be able to access
				// post data
				var postChannel = HttpChannel
						.QueryInterface(Ci.nsIUploadChannel);

				// Get the post data stream
				if (postChannel.uploadStream) {
					var pd = new postData(postChannel);
					HttpHandle.Data = pd.getPostData();
				}
			} catch (ex) {
			}
		}

		
		// call pattern matching
		piigeon.prediction.callback(HttpHandle);
	},

    // Called when an http response is observed
	onExamineResponse : function(HttpChannel) {
		var HttpHandle = [];

		// shared by requests and responses
		HttpHandle.Win = this.getWindowForRequest(HttpChannel);
		HttpHandle.Name = "In";
		HttpHandle.Data = ""; // response content
		HttpHandle.Time = new Date();
		HttpHandle.Url = HttpChannel.URI ? HttpChannel.URI.asciiSpec : null;
		HttpHandle.IsHTTPS = (HttpHandle.Url.split("://")[0] == "https") ? true
				: false;

		HttpHandle.Referrer = null;
		HttpHandle.Host = null;
		HttpHandle.GetCookie = null;
		HttpHandle.Number = 0;
		HttpHandle.FromUrl = false;
		HttpHandle.FromCookie = false;
		HttpHandle.FromData = false;
		HttpHandle.FromReferrer = false;
		HttpHandle.InTab = false;
		HttpHandle.Visible = false;
		HttpHandle.Site = null;
		HttpHandle.Level = "";
		HttpHandle.Term = "";

		// responses only
		HttpHandle.IsFromCache = false;
		HttpHandle.ContentType = HttpChannel.contentType ? HttpChannel.contentType
				: null;
		try {
			HttpHandle.SetCookie = HttpChannel.getResponseHeader("Set-Cookie");
		} catch (e) {
			HttpHandle.SetCookie = null;
		}
		try {
			HttpHandle.TransferEncoding = HttpChannel
					.getResponseHeader("Transfer-Encoding");
		} catch (e) {
			HttpHandle.TransferEncoding = null;
		}

		// get response http body
		var Context = new httpBody(HttpChannel, HttpHandle);
	},

    // Define the type of services that we are looking at and filter out the unintended services
    // Required by observe service
	QueryInterface : function(e) {
		if (!e.equals(Ci.nsISupports) && !e.equals(Ci.nsISupportsWeakReference)
				&& !e.equals(Ci.nsIObserver)
				&& !e.equals(Ci.nsIWebProgressListener)
				&& !e.equals(Ci.nsIURIContentListener)
				&& !e.equals(Ci.nsIStreamListener)
				&& !e.equals(Ci.nsIRequestObserver)
				&& !e.equals(Ci.nsISupportsString)) {
			throw Cr.NS_ERROR_NO_INTERFACE;
		}

		return this;
	},

    //////////////////////// Utility functions
	getWindowForRequest : function(request) {
		var webProgress = this.getRequestWebProgress(request);
		if (webProgress)
			return webProgress.DOMWindow;

		return null;
	},

	getRequestWebProgress : function(request) {
		try {
		if (request && request.notificationCallbacks)
			return request.notificationCallbacks
					.getInterface(Ci.nsIWebProgress);
		}catch(e){}
		try{
		if (request && request.loadGroup && request.loadGroup.groupObserver)
			return request.loadGroup.groupObserver
					.QueryInterface(Ci.nsIWebProgress);
		}catch(e){}
		return null;
	}
};

// postData() reads http post data from the stream API
function postData(postChannel) {
	this.seekablestream = postChannel.uploadStream
			.QueryInterface(Ci.nsISeekableStream);
	this.stream = Cc["@mozilla.org/scriptableinputstream;1"]
			.createInstance(Ci.nsIScriptableInputStream);
	this.stream.init(this.seekablestream);
	this.pointer = -1;
}

postData.prototype = {
	readLine : function() {
		var s = "", bit;
		for ( var i = 0; i < this.stream.available(); i++) {
			bit = this.stream.read(1);
			if (bit == '\n') {
				break;
			} else if (bit != '\r') {
				s += bit;
			}
		}
		return s;
	},

	getPostData : function() {
		// skip the header
		if (this.pointer < 0 || this.seekablestream.tell() != this.pointer) {
			this.seekablestream.seek(0, 0);
			var s = " ";
			while (s) {
				s = this.readLine();
			}
			this.pointer = this.seekablestream.tell();
		}

		// go back if there is no header
		var size = this.stream.available();
		if (size == 0 && this.pointer != 0) {
			this.seekablestream.seek(0, 0);
			size = this.stream.available();
		}

		// read the body
		var s = "", bit;
		try {
			for ( var i = 0; i < size; i++) {
				bit = this.stream.read(1);
				bit ? s += bit : s += '\0';
			}
		} catch (e) {
		} finally {
			this.seekablestream.seek(0, 0);
		}

		return s;
	}
};

// httpBody() reads http response body using the stream API
function httpBody(request, HttpHandle) {

	try {
		request.QueryInterface(Ci.nsIChannel);
	} catch (e) {
		return this.notifyNowin(HttpHandle);
	}

	if (request.loadGroup == null || request.loadGroup.groupObserver == null) {
		return this.notifyNowin(HttpHandle);
	}

	
	var groupObserver = request.loadGroup.groupObserver;
	groupObserver.QueryInterface(Ci.nsIWebProgress);
	this.data = "";
	this.HttpHandle = HttpHandle;
	this.charset = groupObserver.DOMWindow.document.characterSet;
	this.load(request.URI.asciiSpec);
};

httpBody.prototype = {
	notifyNowin : function(HttpHandle) {
		piigeon.prediction.callback(HttpHandle);
	},

	load : function(url) {
		var channel = ioService.newChannel(url, null, null);
		channel.loadFlags |= Ci.nsIRequest.LOAD_FROM_CACHE
				| Ci.nsIChannel.LOAD_TARGETED | Ci.nsIRequest.VALIDATE_NEVER;
		channel.asyncOpen(this, null);
	},

	onStartRequest : function(request, context) {
	},

	onDataAvailable : function(request, context, stream, sourceOffset, count) {
		var bstream = Cc["@mozilla.org/binaryinputstream;1"]
				.createInstance(Ci.nsIBinaryInputStream);
		bstream.setInputStream(stream);

		this.data += bstream.readBytes(bstream.available());
	},

	onStopRequest : function(request, context, status) {
		//piigeon.debug.print2ErrorConsole(this.data);
		this.done = true;

		// NS_BINDING_ABORTED
		if (status != 0x804b0002) {
			context = this.data;
			this.HttpHandle.Data = context;
			piigeon.prediction.callback(this.HttpHandle);
		}
	}
};
