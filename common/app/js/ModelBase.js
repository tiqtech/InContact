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
