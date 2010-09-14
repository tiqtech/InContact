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
LBB.Preferences._instance = new LBB.Preferences();
LBB.Preferences._db = null;

LBB.Preferences.load = function(db, callback)
{
	try {
		LBB.Util.log("> LBB.Preferences.load");
	
		this._db = db;
		this._db.get(
			this._key,
			function(m) {
				try {
					LBB.Util.log("> LBB.Preferences.load.get");
					
					this._instance = new LBB.Preferences();
					for(var k in m) {
						this._instance.properties[k] = m[k];
					}
					
					// copy read-only properties
					for(var k in this._instance.readOnlyProperties) {
						this._instance.properties[k] = this._instance.readOnlyProperties[k];
					}
					
					this._instance.loaded = true;
						
					if(callback) {
						callback();
					}
				} catch (e) {
					LBB.Util.error("LBB.Preferences.load.get", e);
				}
			}.bind(this), 
			function(e) { LBB.Util.log("Unable to get preferences database", e); }
		);
	} catch (e) {
		LBB.Util.error("LBB.Preferences.load", e);
	}
};

LBB.Preferences.save = function()
{
	//Mojo.Log.info("> LBB.Preferences.save");
	this._db.add(this._key, this._instance.properties);	
}

LBB.Preferences.getInstance = function()
{
	return LBB.Preferences._instance;
}