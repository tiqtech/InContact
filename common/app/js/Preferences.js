var _Preferences = {
	initialize:function()
	{
		this.loaded = false;
		this.readOnlyProperties = 
		{
			asyncPhoto:{value:true}
		};
		
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
LBB.Preferences._key = "prefs";

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
		
		this.importData(externalPrefs);
		
		inst.loaded = true;
		
		if (callback) {
			callback();
		}
	} 
	catch (e) {
		LBB.Util.error("LBB.Preferences.load.get", e);
	}
}

LBB.Preferences.importData = function(externalPrefs) {
	var inst = this.getInstance();
	
	// override current prefs with external if provided
	if(externalPrefs && externalPrefs.properties) {
		for (var k in externalPrefs.properties) {
			inst.properties[k] = externalPrefs.properties[k];
		}
		
		// commit changes
		this.save();	
	}
}

LBB.Preferences.save = function() {
	this.getDatabase().add(this._key, this.getInstance().properties);	
}

LBB.Preferences.getInstance = function() {
	return Mojo.Controller.getAppController().assistant._preferences;
}

LBB.Preferences.setInstance = function(inst) {
	Mojo.Controller.getAppController().assistant._preferences = inst;
}

LBB.Preferences.getDatabase = function() {
	return Mojo.Controller.getAppController().assistant._preferencesDatabase;
}

LBB.Preferences.setDatabase = function(db) {
	Mojo.Controller.getAppController().assistant._preferencesDatabase = db;
}