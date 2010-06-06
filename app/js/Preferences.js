LBB.Preferences = Class.create({
	initialize:function()
	{
		this.properties =
		{
			autoDial:{value:true,disabled:false},
			allowRotate:{value:false,disabled:false},
			initialView:{value:"main",disabled:false},
			disableAds:{value:true},
			asyncPhoto:{value:false}
		};
	},
	getPropertyObject:function(name)
	{
		return this.properties[name];
	},
	getProperty:function(name)
	{
		var p = this.properties[name].value;
		return p;
	},
	setProperty:function(name, value)
	{
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
			Mojo.Log.info("LBB.Preferences.load complete");
			this._instance = new LBB.Preferences();
			for(var k in m)
				this._instance.properties[k] = m[k];
			callback();
		}.bind(this), 
		function() { Mojo.Log.error("Unable to get preferences database"); }
	);
};

LBB.Preferences.save = function()
{
	Mojo.Log.info("> LBB.Preferences.save");
	this._db.add(this._key, this._instance.properties);	
}

LBB.Preferences.getInstance = function()
{
	return LBB.Preferences._instance;
}