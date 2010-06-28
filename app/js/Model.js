LBB.Model = Class.create({
	initialize:function()
	{
			this.modified = false;
			this.contacts = [];
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
	},
	update:function(version) {
		Mojo.Log.info("update version " + version);
		
		if(version == null) {
			version = "1.0.0";
		}
		
		// * changed contact selections from data to contactPointId
		if(version == "1.0.0") {
			Mojo.Log.info("updating from version 1.0.0");
			
			version = "1.0.1";
			for(var i=0;i<this.contacts.length;i++) {
				var c = this.contacts[i];

				this._updateEntry(c, "phone");
				this._updateEntry(c, "sms");
				this._updateEntry(c, "email");
				this._updateEntry(c, "im", function(currentValue, entry) {
					return currentValue == entry.id;
				});
			}
		}
		
		this.save();
	},
	// needed for data model update from 1.0.0 to 1.0.1
	_updateEntry:function(c, type, comparator) {
		var map = { "phone":"phoneNumbers", "sms":"phoneNumbers", "email":"emailAddresses", "im":"imNames" };
		
		var s = c.qc.selections[type];
		if(s != Mojo.Widget.QuickContact.SelectAuto && s != Mojo.Widget.QuickContact.SelectNone) {
			var found = false;
			for(var i=0;i<c[map[type]].length;i++) {
				var n = c[map[type]][i];
				if((comparator && comparator(s, n)) || s == n.value) {
					c.qc.selections[type] = n.id;
					found = true;
					break;
				}
			}
			
			if(!found) {
				c.qc.selections[type] = Mojo.Widget.QuickContact.SelectAuto;
			}
		}
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