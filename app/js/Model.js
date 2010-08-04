LBB.Page = Class.create({
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
});

LBB.Model = Class.create({
	initialize:function() {
		this.loaded = false;
		this.modified = false;
		this.pages = [new LBB.Page("My Contacts")]; //IC+ [new LBB.Page("Friends"), new LBB.Page("Family"), new LBB.Page("Work")];
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
	update:function(version) {
		Mojo.Log.info("> Model.update version=" + version);
		
		if(!version) version = "1.0.0";
		
		if(!this.contacts) return;
		
		// * changed contact selections from data to contactPointId
		if(version == "1.0.0") {
			Mojo.Log.info("updating to version 1.1.0");

			version = "1.1.0";
			// new instances won't have this.contacts
			for(var i=0;i<this.contacts.length;i++) {
				var c = this.contacts[i];

				this._updateEntry(c, "phone");
				this._updateEntry(c, "sms");
				this._updateEntry(c, "email");
				this._updateEntry(c, "im");
			}
		}
		
		if(version == "1.1.0") {
			Mojo.Log.info("updating to 1.2.1");
			
			version = "1.2.1";
			this.pages = [new LBB.Page(null, this.contacts)];
			
		}
		
		this.save();
	},
	// needed for data model update from 1.0.0 to 1.1.0
	_updateEntry:function(c, type, comparator) {
		Mojo.Log.info("> _updateEntry");
		
		var map = { "phone":"phoneNumbers", "sms":"phoneNumbers", "email":"emailAddresses", "im":"imNames" };
		
		var s = c.qc.selections[type];
		if(s != Mojo.Widget.QuickContact.SelectAuto && s != Mojo.Widget.QuickContact.SelectNone) {
			var found = false;
			for(var i=0;i<c[map[type]].length;i++) {
				var n = c[map[type]][i];
				if(s == n.id || s == n.value) {
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
			for(var k in m) {
				// have to do some custom processing because pages contains custom objects
				// without this, i'd have access to data but not methods since they aren't serialized
				if(k == "pages") {
					var pages = m[k];
					this._instance[k] = [];
					for(var i=0;i<pages.length;i++) {
						this._instance[k].push(new LBB.Page());
						for(var prop in pages[i]) {
							this._instance[k][i][prop] = pages[i][prop];
						}
					}
				} else {
					this._instance[k] = m[k];
				}
			}
			
			this.loaded = true;

			callback();
		}.bind(this),
		function() { Mojo.Log.error("Unable to get model"); }
	);
};

LBB.Model.save = function() {
	//Mojo.Log.info("> LBB.Model.save");
	this._db.add(this._key, this._instance);	
};

LBB.Model.getInstance = function() {
	return this._instance;
}