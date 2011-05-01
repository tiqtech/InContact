LBB = {};

LBB.Util =
{
	_log:[],
	_isDebug:(Mojo.appInfo.id.indexOf(".debug")>0),
	appMenuModel: {items:[]},
	cmdMenuModel: {
	    visible: true,
	    items: [
       		{},
       		{ items: [] },	// placeholder for items from preferences
       		{}
	    ]
	},
	log:function() {
		if(this._isDebug) {
			this._log.push($A(arguments).join(" "));
		}
		
		Mojo.Log.info.apply(Mojo.Log, arguments);
	},
	error:function() {
		if(this._isDebug) {
			this._log.push($A(arguments).join(" "));
			this.emailLog();
		}
		
		Mojo.Log.error.apply(Mojo.Log, arguments);
	},
	emailLog:function() {
		new Mojo.Service.Request("palm://com.palm.applicationManager", {
			method:"open",
			parameters:{
				id:"com.palm.app.email",
				params:{
					summary:"Error Log for InContact",
					text:this._log.join("\r\n"),
					recipients:[{type:"email",role:1,value:"incontact-support@tiqtech.com",contactDisplay:"InContact Support"}]
				}
			}
		});
	},
	getAppMenuModel:function(scene) {
		var i = this.appMenuModel.items;
		
		i.clear();
		i.push({label: $L("Preferences"),command: Mojo.Menu.prefsCmd});
		if(scene == "grid") {
//			var currentMode = Mojo.Controller.getAppController().assistant.settings.mode;
//			var mode, label;
//			if(currentMode == "normal") {
//				label = $L("Driving Mode");
//				mode = "driving";
//			} else {
//				label = $L("Normal Mode");
//				mode = "normal";
//			}
			
			i.push({label: $L("Toggle Driving Mode"),  shortcut:'m', command:"mode-toggle"});
		}
		
		
		i.push({label: $L("Help"),command: Mojo.Menu.helpCmd});
		i.push({label: $L("About"),command: "scene-about"});
		
		// upgrade code
		if(Mojo.appInfo.id.substring(Mojo.appInfo.id.length-4) != "plus") {
			i.push({label: $L("Upgrade"), command: "upgrade"});
		}
		
		return this.appMenuModel;
	},
	updateCommandMenuModel:function(controller) {
		var apps = LBB.Preferences.getInstance().getProperty("launcherApps");
		
		var selectedApps = [];
		for(var i=0;i<apps.length;i++) {
			if(apps[i].value) {
				selectedApps.push(apps[i]);
			}
		}
		
		this.cmdMenuModel.items[1].items = selectedApps;
		
		if (controller) {
			controller.modelChanged(this.cmdMenuModel);
		}
	},
	setupCommandMenu:function(controller, scene) {
		LBB.Util.log("> LBB.Util.setupCommandMenu");
				
		this.updateCommandMenuModel();

		controller.setupWidget(Mojo.Menu.commandMenu, {}, this.cmdMenuModel);
		controller.watchModel(this.cmdMenuModel);
	},
	loadTheme:function(controller) {
		var prefs = LBB.Preferences.getInstance();
		var theme = prefs.getProperty("theme");

		new Ajax.Request(Mojo.appPath + "/themes/" + theme + "/config.json", {
			method:"get",
			onSuccess:function(xhr) { 
				var c = controller;
				var t = theme;
				this.onLoadTheme(xhr, c, t);
			}.bind(this)
		});
	},
	onLoadTheme:function(xhr, controller, theme) {
		if(xhr.status == 200) {
			try {
				var attr = eval("("+xhr.responseText+")");
				if(typeof(attr) == "object") {
					attr.theme = theme;
					var content = Mojo.View.render({"template":"themes/style", attributes:attr});
					var themeNode = controller.get('theme-style');
					
					if(themeNode == null) {
						controller.get(controller.document.body).insert(content);
					} else {
						themeNode.replace(content);
					}
				}
			} catch (ex) {
				Mojo.Log.error(ex);
			}
		}
	},
	updateAppIcon:function() {
		var icon = LBB.Preferences.getInstance().getProperty("icon");
		if(!icon) return;
		
		var iconUrl = Mojo.appPath + 'images/launcher/' + icon + '.png';
		
		var updateIconRequest = new Mojo.Service.Request('palm://com.palm.applicationManager', {
    		method: 'updateLaunchPointIcon',
    		parameters: { launchPointId: Mojo.appInfo.id + '_default', icon: iconUrl},
			onFailure: function(e) { Mojo.Log.info("Failed to set icon",Object.toJSON(e)); }
		});
	},
	// converts contact from webOS 2.0 schema to 1.x schema
	// may migrate to a schema-independent format later
	convertContact:function(c) {
		var contact = {
			id:new Date().getTime(),
			firstName:(c.name) ? c.name.givenName : undefined,
			lastName:(c.name) ? c.name.familyName : undefined,
			pictureLoc:null,
			pictureLocBig:null,
			phoneNumbers:[],
			emailAddresses:[],
			imNames:[]
		}
		
		// if contact doesn't have first nor last name but org name, use it
		if(!contact.firstName && !contact.lastName && c.organization.name) {
			contact.firstName = c.organization.name
		}
		
		if(c.phoneNumbers) {
			var d = new Date().getTime();
			for(var i=0;i<c.phoneNumbers.length;i++) {
				contact.phoneNumbers.push({
					id:d+i,
					value:c.phoneNumbers[i].value
				})
			}
		}
		
		if(c.emails) {
			var d = new Date().getTime();
			for(var i=0;i<c.emails.length;i++) {
				contact.emailAddresses.push({
					id:d+i,
					value:c.emails[i].value
				})
			}
		}
		
		if(c.ims) {
			var d = new Date().getTime();
			for(var i=0;i<c.ims.length;i++) {
				contact.imNames.push({
					id:d+i,
					value:c.ims[i].value,
					serviceName:c.ims[i].type.substring(5)
				})
			}
		}
		
		var selectOne = function() {
			for(var i=0;i<arguments.length;i++) {
				if(arguments[i] !== "") {
					return arguments[i];
				}
			}
			
			return "";
		}
		
		if(c.photos) {
			contact.pictureLocBig = selectOne(c.photos.bigPhotoPath, c.photos.squarePhotoPath, c.photos.listPhotoPath);
			contact.pictureLoc = c.photos.listPhotoPath;
		}
		
		return contact;
	}
}

var HandlerManager = Class.create({
	initialize:function(owner, autoBind) {
		this._owner = owner;
		
		if(autoBind == true || typeof(autoBind) === "undefined") {
			var m = [];
			for(var k in owner) {
				// search for any function that starts with onX* or handleX*
				if(Object.isFunction(owner[k]) && k.match(/^(on|handle)[A-Z].*/)) {
					m.push(k);
				}
			}
			
			if(m.length > 0) {
				this.bind(m);
			}
		}
	},
	bind:function(name) {
		if(!Object.isArray(name)) {
			name = [name];
		}
		
		for(var i=0;i<name.length;i++) {
			var n = name[i];
			this[n] = this._owner[n].bind(this._owner);
		} 
	},
	release:function(name) {
		try {
			if(name) {
				this[name] = null;
			} else {
				for(var p in this) {
					if(p.indexOf("_") != 0 && typeof(p) == "object") {
						this[p] = null;
					}
				}
			}
		} catch (e) {
			Mojo.Log.warn(e);
		}
	}
});

var ElementCache = Class.create({
	initialize:function(assistant, ids) {
		this.assistant = assistant;
		this.cache = {};
				
		if(!!ids) {
			for(var i=0;i<ids.length;i++) {
				this.get(ids[i]);
			}
		}
	},
	get:function(id) {
		return (!!this.cache[id]) ? this.cache[id] : this.assistant.controller.get(id);
	},
	refresh:function(id) {
		// if id is provided, only refresh that item.  otherwise, validate all items
		if(!!id) {
			this.cache[id] = this.assistant.controller.get(id);
			return this.cache[id];
		} else {
			for(var k in this.cache) {
				var x = this.assistant.controller.get(k);
				// only cache if it's valid
				if(!!x) {
					this.cache[k] = x;
				}
			}
		}
	},
	release:function(id) {
		// if id is provided, only refresh that item.  otherwise, validate all items
		if(!!id) {
			delete this.cache[id];
		} else {
			for(var k in this.cache) {
				delete this.cache[k];
			}
		}
	},
	remove:function(idOrElement) {
		var e = (!!idOrElement.id) ? idOrElement : this.get(idOrElement);
		
		this.assistant.controller.remove(e);
		this.release(e.id);
	}
});

//Function.prototype.async = function(caller) {
//	var func = this;
//	var args = [];
//	
//	for(var i=1;i<arguments.length;i++) {
//		args.push(arguments[i]);
//	}
//		
//	var f = function() {
//		var _args = args;
//		var c = caller;
//		func.apply(c, _args);
//	};
//	
//	new Ajax.Request(Mojo.appPath + "/appinfo.json", {
//		method:"get",
//		onSuccess:f
//	});
//}

/*
var LoggingClass = {
	entry:function(prefix, method) {
		var s = (!prefix) ? method : prefix + "." + method;
		Mojo.Log.info(">",s);
	},
	exit:function(prefix, method) {
		var s = (!prefix) ? method : prefix + "." + method;
		Mojo.Log.info("<",s); 
	},
	create:function(baseClass, classDef) {
		if(typeof(baseClass) == "object") {
			classDef = baseClass;
		}
		
		for(var member in classDef) {
			if(typeof(classDef[member]) == "function") {
				Mojo.Log.info("overriding",member);
				classDef[member] = classDef[member].wrap(
					function(callOriginal) {
						LoggingClass.entry(this.logPrefix,member);
						callOriginal();
						LoggingClass.exit(this.logPrefix,member);
					}
				);
			}
		}
		
		return Class.create(baseClass, classDef);
	}
};
*/

LBB._Page = {
	initialize:function(_title, _contacts) {
		this.title = (_title) ? _title : "My Contacts";		
		this.contacts = (_contacts) ? _contacts : [];
	},
	getContacts:function() {
		return this.contacts;
	},
	getTitle:function() {
		return this.title;
	},
	findContactById:function(id) {
		var c = {contact:null,index:-1};
		
		for(var i=0;i<this.contacts.length;i++) {
			if(this.contacts[i].id == id) {
				c.contact = this.contacts[i];
				c.index=i;
				
				break;
			}
		}
		
		return c;
	},
	hasContacts:function() {
		return this.contacts.length > 0;
	},
	removeContactById:function(id) {
		var c = this.findContactById(id);
		if(c.index == -1) return;
			
		this.contacts.splice(c.index, 1);
	}
};

LBB._Model = {
	initialize:function(_pages) {
		this.loaded = false;
		this.modified = false;
		this.pages = [new LBB.Page("My Contacts")];
	},
	hasContacts:function() {
		for(var i=0;i<this.pages.length;i++) {
			if(this.pages[i].hasContacts()) return true;
		}
		
		return false;
	},
	// TODO: should be safe to remove.  need to verify
	findContactById:function(id) {
		var c = {contact:null,index:-1};
		
		for(var n=0;n<this.pages.length;n++) {
			for(var i=0;i<this.pages[n].contacts.length;i++) {
				if(this.pages[n].contacts[i].id == id) {
					c.contact = this.pages[n].contacts[i];
					c.index=i;
					c.page=n;
					
					break;
				}
			}
		}
		
		return c;
	},
	getContacts:function(page) {
		if(typeof(page) == "undefined") {
			page = 0;
		}
		
		return this.pages[page].contacts;
	},
	getPage:function(page) {
		return this.pages[page];
	},
	getPages:function() {
		return this.pages;
	},
	remove:function(contact) {
		var id = (typeof(contact) == "object") ? contact.id : contact;
		
		var c = this.findContactById(id);
		if(c.index != -1) {
			this.pages[c.page].contacts.splice(c.index, 1);
		}
	},
	save:function() {
		LBB.Model.save();
	},
	update:function(version, targetVersion) {
		// base update does nothing
	},
	log:function() {
		var s = "[";
		for(var i=0;i<this.pages.length;i++) {
			var p = this.pages[i];
			s += "{title:"+p.getTitle()+",contacts:[";
			for(var j=0;j<p.contacts.length;j++) {
				var c = p.contacts[j];
				s += "{id:"+c.id+",name:"+c.firstName+"}";
			}
			s += "]},"
		}
		s += "]";
		
		LBB.Util.log(s);	
	}
};

LBB.Page = Class.create(LBB._Page);
LBB.Model = Class.create(LBB._Model);

LBB.Model._key = "model";
LBB.Model.load = function(db, provided, callback)
{
	try {
		this.setDatabase(db);
		this.setInstance(new LBB.Model());
		
		db.get(this._key, this.onLoadComplete.bind(this, callback, provided), function(e){
			LBB.Util.log("Unable to get model", e);
		});
	} catch (e) {
		LBB.Util.error("LBB.Model.load", e);
	}
};

LBB.Model.onLoadComplete = function(callback, externalContacts, m) {
	try {
		LBB.Util.log("> LBB.Model.onLoadComplete");
		
		var inst = this.getInstance();
		
		for(var k in m) {
			// have to do some custom processing because pages contains custom objects
			// without this, i'd have access to data but not methods since they aren't serialized
			if(k == "pages") {
				var pages = m[k];
				inst[k] = [];
				for(var i=0;i<pages.length;i++) {
					inst[k].push(new LBB.Page());
					for(var prop in pages[i]) {
						inst[k][i][prop] = pages[i][prop];
					}
				}
			} else {
				inst[k] = m[k];
			}
		}
		
		this.importData(externalContacts);
		
		this.loaded = true;
		
		if(callback) {
			callback();
		}
	} catch(e) {
		LBB.Util.error("LBB.Model.load.get", e);
	}
}

LBB.Model.importData = function(externalContacts) {
	var inst = this.getInstance();
	
	if(externalContacts && externalContacts.length > 0 && inst.pages.length > 0) {
		for(var i=0;i<externalContacts.length;i++) {
			var c = inst.pages[0].findContactById(externalContacts[i].id);
			if(c.index == -1) {
				inst.pages[0].contacts.push(externalContacts[i]);
			}
		}
		
		// save addition of external contacts
		this.save();
	}
}

LBB.Model.save = function() {
	this.getDatabase().add(this._key, this.getInstance());	
};

LBB.Model.getInstance = function() {
	return Mojo.Controller.getAppController().assistant._model;
}

LBB.Model.setInstance = function(inst) {
	Mojo.Controller.getAppController().assistant._model = inst;
}

LBB.Model.getDatabase = function() {
	return Mojo.Controller.getAppController().assistant._modelDatabase;
}

LBB.Model.setDatabase = function(db) {
	Mojo.Controller.getAppController().assistant._modelDatabase = db;
}


var _Preferences = {
	initialize:function()
	{
		this.loaded = false;
		
		this.launcherApps = [
			{label: $L('Phone'), icon:'phone-icon', command:'launch-phone',value:true},
			{label: $L('Email'), icon:'email-icon', command:'launch-email',value:true},
			{label: $L('Messaging'), icon:'messaging-icon', command:'launch-messaging',value:true},
			{label: $L('Contacts'), icon:'contacts-icon', command:'launch-contacts',value:true},
			{label: $L('Calendar'), icon:'calendar-icon', command:'launch-calendar',value:false}
       	]
		
		this.properties =
		{
			autoDial:{value:true,disabled:false},
			allowRotate:{value:false,disabled:false},
			initialView:{value:"main",disabled:false},
			startMode:{value:"normal"},
			theme:{value:"default"},
			icon:{value:"icon"},
			namePosition:{value:"top"},
			contactSize:{value:"normal"},
			closeAction:{value:"none"},
			launcherApps:{value:this.launcherApps}
		};
	},
	getPropertyObject:function(name)
	{
		return this.properties[name];
	},
	getProperty:function(name)
	{
		if(this.properties[name]) {
			var p = this.properties[name].value;
			return p;
		} else {
			return undefined;
		}
	},
	setProperty:function(name, value)
	{
		if(!this.properties[name]) {
			this.properties[name] = {value:null};
		}
		
		this.properties[name].value = value;
		LBB.Preferences.save();
	},
	isLoaded:function() {
		return this.loaded;
	}
};

LBB.Preferences = Class.create(_Preferences);

LBB.Preferences.importData = function(prefs) {
	try {
		var inst = this.getInstance();
		
		// override current prefs with external if provided
		if (prefs) {
			for (var k in prefs) {
				inst.properties[k] = prefs[k];
			}
		}
	}catch(e) {
		Mojo.Log.error("Error importing preferences", e)
	}
}

LBB.Preferences.save = function() {
	Mojo.Controller.getAppController().assistant.prefsCookie.put(this.getInstance().properties)
	//this.getDatabase().add(this._key, this.getInstance().properties);	
}

LBB.Preferences.getInstance = function() {
	return Mojo.Controller.getAppController().assistant._preferences;
}

LBB.Preferences.setInstance = function(inst) {
	Mojo.Controller.getAppController().assistant._preferences = inst;
}

/* deprecated */
LBB.Preferences._key = "prefs";

/* deprecated */
LBB.Preferences.load = function(db, provided, callback)
{
	try {
		LBB.Util.log("> LBB.Preferences.load");
	
		this.setDatabase(db);
		this.setInstance(new LBB.Preferences());
		
		db.get(this._key, this.onLoadComplete.bind(this, callback, provided),
		function(e){
			LBB.Util.log("Unable to get preferences database", e);
		});
	} catch (e) {
		LBB.Util.error("LBB.Preferences.load", e);
	}
};

/* deprecated */
LBB.Preferences.onLoadComplete = function(callback, externalPrefs, m) {	
	try {
		LBB.Util.log("> LBB.Preferences.onLoadComplete");
		var inst = this.getInstance();
		
		for (var k in m) {
			inst.properties[k] = m[k];
		}
		
		// copy read-only properties
		for (var k in inst.readOnlyProperties) {
			inst.properties[k] = inst.readOnlyProperties[k];
		}
		
		
		inst.loaded = true;
		
		// delete prefs from db now that they're stored in a cookie
		this.save();
		this.getDatabase().discard(this._key); // assuming success, ignoring failure ...
		
		if (callback) {
			callback();
		}
	} 
	catch (e) {
		LBB.Util.error("LBB.Preferences.load.get", e);
	}
}

/* deprecated */
LBB.Preferences.getDatabase = function() {
	return Mojo.Controller.getAppController().assistant._preferencesDatabase;
}

/* deprecated */
LBB.Preferences.setDatabase = function(db) {
	Mojo.Controller.getAppController().assistant._preferencesDatabase = db;
}