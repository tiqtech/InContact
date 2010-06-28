LBB.Preferences = Class.create({
	initialize:function()
	{
		this.readOnlyProperties = 
		{
			disableAds:{value:false},
			asyncPhoto:{value:true}
		};
		
		this.properties =
		{
			autoDial:{value:true,disabled:false},
			allowRotate:{value:false,disabled:false},
			initialView:{value:"main",disabled:false},
			theme:{value:"default"},
			icon:{value:"icon"}
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
	}
});

LBB.Preferences._key = "prefs";
LBB.Preferences._instance = new LBB.Preferences();
LBB.Preferences._db = null;

LBB.Preferences.load = function(db, callback)
{
	//Mojo.Log.info("> LBB.Preferences.load");

	this._db = db;
	this._db.get(
		this._key,
		function(m) {
			//Mojo.Log.info("LBB.Preferences.load complete");
			this._instance = new LBB.Preferences();
			for(var k in m) {
				this._instance.properties[k] = m[k];
			}
				
			// copy read-only properties
			for(var k in this._instance.readOnlyProperties) {
				this._instance.properties[k] = this._instance.readOnlyProperties[k];
			}
				
			callback();
		}.bind(this), 
		function() { Mojo.Log.error("Unable to get preferences database"); }
	);
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