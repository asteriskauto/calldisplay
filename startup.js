var incomingGroupCall = {}
var screen = require('screen');
//util for debugging
var util = require('util');
var app = require('app');
//we needs to get all info about app
app.init();
screen.clear();

//Get config of app(we needs settings)
var config = app.getConfig();
var callgroup =  config.settings.callgroup; //Get callgroup
var pickupgroup =  config.settings.pickupgroup; //Get pickupgroup
var server = config.settings.server; //server uri, like http://{host}:{port}
var app_name = config.settings.id; //App name from json file
var phonePrefix = config.settings.prefix; //App name from json file
var language = config.settings.language || "ru";

var uids = []; // This list contains all uids server give us at runtime
var phonesCount = 0; // This variable needs to watch uids missing from uids list
var timer;
var currentListPos = 0;
var listWidget = new List(0, 0, window.w, window.h);
var lang = digium.readFile("app", language + ".json");
language = JSON.parse(lang);

incomingGroupCall.show = function () {
	util.debug("Call show");
	if (this.visible) {
		window.add(listWidget);		
	}
	this.update();
	if (timer) {
		clearInterval(timer);
	}
	timer = setInterval(this.update, 1100);
};

incomingGroupCall.showGui = function(message, params) {
	util.debug("Show gui");
	var lastSelected = listWidget.selected;
	listWidget.clear();
	listWidget.set(0,0, message);
	var i=1;
	if(!params){
		return;
	}
	params.forEach(function(entry) {
		var msg = entry.from + " --> " + entry.to;
		if(i<=9){
			msg = "[" + i + "]  " + msg;
		} else if(i === 10) {
			msg = "[0]  " + msg;
		} else if(i === 11) {
			msg = "[*]  " + msg;
		} else if(i === 12) {
			msg = "[#]  " + msg;
		}
		listWidget.set(i, 0, msg);
		listWidget.set(i, 1, entry.to); //container to get value in key handler
		i++;
	});
	listWidget.select(lastSelected);
}


incomingGroupCall.update = function() {
	var request = new NetRequest();
	request.open("GET", server + "/get?callgroup="+callgroup+"&pickupgroup="+pickupgroup);
	request.onreadystatechange = function() {
		//(readyState === 4) indicates a completed request		
		if (4 === request.readyState) {
			if (200 === request.status) {				
				try {				
					var data = JSON.parse(request.responseText);
					if (!data || data.length === 0) {
						if (!digium.app.inForeground) {
							return;
						}
						incomingGroupCall.showGui(language["NO_CALLS"]);
						return;
					}
					//Remove ended calls
					var currentUids = data.map( function(item) { 
						return item.uid; 
					});
					var needsToRefresh = false;
					var newEntryAvailable = false;
					uids.forEach(function(uid) {
						if(currentUids.indexOf(uid) === -1) {
							uids.splice(uids.indexOf(uid), 1);
							needsToRefresh = true;
						}
					});					
					// Add new phones to list				
					data.forEach(function(entry) {
						if (uids.indexOf(entry.uid) === -1) {
							needsToRefresh = true;
							newEntryAvailable = true;
							uids.push(entry.uid);
						}
					});
					util.debug("New entry:" + newEntryAvailable);
					if (!digium.app.inForeground && newEntryAvailable) {
						digium.foreground();
					}
					if(needsToRefresh) {
						incomingGroupCall.showGui(language["INCOMING_CALLS"], data);
					}
					
				} catch (e) {
					util.debug('request error: ' + JSON.stringify(e));
					incomingGroupCall.showGui(language["SERVER_UNAVAILABLE"]);
				}
			} else {
				util.debug('request error1: ' + request.status);				
				incomingGroupCall.showGui(language["SERVER_UNAVAILABLE"]);
			}
		}			
	}.bind(this);
	request.setTimeout(1000);
	request.send();
};

//initialize variables
incomingGroupCall.init = function () {
	this.widgets = {};

	//stay open when the app is backgrounded
	digium.app.exitAfterBackground = false;

	this.visible = digium.app.inForeground;
	incomingGroupCall.listeners();

	// setInterval(digium.restart, 180000);
};


incomingGroupCall.listeners = function () {
	//show the full window when the app is foregrounded
	digium.event.observe({
		'eventName'		: 'digium.app.foreground',
		'callback'		: function () {
			util.debug("app.foregrounded");
			window.clear();
			this.visible = digium.app.inForeground;
			this.setButtons();
			this.show();
		}.bind(this)
	});

	//show the idle window when the idleScreen is shown
	digium.event.observe({
		'eventName'		: 'digium.app.background',
		'callback'		: function () {
			util.debug("app.background");
			this.visible = digium.app.inForeground;
			window.clearSoftkeys();
			this.show();
		}.bind(this)
	});
};

incomingGroupCall.setButtons = function () {
	window.onkeyselect = function() {
		var phone = listWidget.get(listWidget.selected, 1);
		util.debug("Selected " + phone);
		digium.phone.dial({
			"number": phonePrefix+phone
		})
	}
	window.onkey = function(e) {
		//Digits keyboard handler
		try {
			var key = e.key;
			if(e.key == "0") {
				key = 10;
			} else if (e.key == "*") {
				key = 11;
			} else if (e.key == "#") {
				key = 12;
			}
			var phone = listWidget.get(key, 1);
			if (phone) {
				digium.phone.dial({
					"number": phonePrefix+phone
				})
			}
		} catch(e) {
			util.debug("Error in trying to dial");
		}
		util.debug(JSON.stringify(e));
	}
	window.setSoftkey(4, language['EXIT'], function() {
		digium.app.exitAfterBackground = true;
		digium.background();
	}.bind(this));
	window.setSoftkey(3, language['HIDE'], function() {
		digium.background();
	}.bind(this));
}

incomingGroupCall.init();
incomingGroupCall.show();
