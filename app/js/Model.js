LBB.Model = Class.create({
	initialize:function()
	{
			this.modified = false;
			this.contacts = [];
			this.selections = {};
	},
	isModified:function()
	{
		return this.modified;
	},
	findContactById:function(id)
	{
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
	remove:function(contact)
	{
		var id = (typeof(contact) == "object") ? contact.id : contact;
		
		var c = this.findContactById(id);
		if(c.index != -1)
			this.contacts.splice(c.index, 1);
	},
	save:function()
	{
		LBB.Model.save();
	}
});

	
LBB.Model._instance = new LBB.Model();
LBB.Model._key = "model";
LBB.Model._db = null;
LBB.Model.load = function(db, callback)
{
	this._db = db;
	this._db.get(
		this._key,
		function(m) {
			this._instance = new LBB.Model();
			for(var k in m)
				this._instance[k] = m[k];
			callback();
		}.bind(this),
		function() { Mojo.Log.error("Unable to get model"); }
	);
};
LBB.Model.save = function()
{
	//Mojo.Log.info("> LBB.Model.save");
	this._db.add(this._key, this._instance);	
};
LBB.Model.getInstance = function()
{
	return this._instance;
}