var _QuickContact = {
	initialize: function() {
		this.defaultPhoto = "images/details-image-generic.png";
	    this.attributes = 
		{
			"container":"grid",
			"selected":false
		};
		this.handlers = new HandlerManager(this, ["onIconTap","onPhone","onSMS","onIM","onEmail"])
	},
	setup:function() {
		LBB.Util.log("> QuickContact.setup");
		
		// merge attributes provided by setupWidget
		// with this instance's default attributes
		for (var key in this.controller.attributes) {
			this.attributes[key] = this.controller.attributes[key];
		}
		
		var formatters = {"contactName":Mojo.Widget.QuickContact.formatContactName}
			
		this.attributes.id = this.controller.element.id;
		var prefs = LBB.Preferences.getInstance();
		
		this.initContact();
	
		this.controller.element.update(Mojo.View.render({"template":"QuickContact/"+this.attributes.container, attributes:this.attributes, object:this.controller.model, formatters:formatters}));
		this.loadContactPhoto();
		
		this.controller.exposeMethods(["select", "render"]);
		this.render();
		
		Mojo.Event.listen(this.controller.get(this.controller.element.id + "_0"), Mojo.Event.tap, this.handlers.onIconTap, true);
		Mojo.Event.listen(this.controller.get(this.controller.element.id + "_1"), Mojo.Event.tap, this.handlers.onIconTap, true);
		Mojo.Event.listen(this.controller.get(this.controller.element.id + "_2"), Mojo.Event.tap, this.handlers.onIconTap, true);
		Mojo.Event.listen(this.controller.get(this.controller.element.id + "_3"), Mojo.Event.tap, this.handlers.onIconTap, true);
	},
	cleanup:function() {		
		Mojo.Event.stopListening(this.controller.get(this.controller.element.id + "_0"), Mojo.Event.tap, this.handlers.onIconTap, true);
		Mojo.Event.stopListening(this.controller.get(this.controller.element.id + "_1"), Mojo.Event.tap, this.handlers.onIconTap, true);
		Mojo.Event.stopListening(this.controller.get(this.controller.element.id + "_2"), Mojo.Event.tap, this.handlers.onIconTap, true);
		Mojo.Event.stopListening(this.controller.get(this.controller.element.id + "_3"), Mojo.Event.tap, this.handlers.onIconTap, true);
		
		this.handlers.release();
	},
	render:function() {
		try {
			if(this.attributes.selected) {
				this.displayIcons();
				this.controller.get(this.attributes.id).className = this.attributes.container + " QuickContact selected";
			} else {
				this.controller.get(this.attributes.id).className = this.attributes.container + " QuickContact";
			}
		} catch(e) {
			LBB.Util.error("Render issue for '" + this.attributes.id + "': " + e);
		}
	},
	displayIcons:function() {
		LBB.Util.log("> QuickContact.displayIcons");

		for(var i=0;i<4;i++) {
			var p = this.controller.model.qc.selections[i];
			var cp = Mojo.Widget.QuickContact.getPreference(this.controller.model, i);
			var classes = ["icon"];
			
			var icon = this.controller.get(this.attributes.id+"_"+i);
			if(cp && cp != Mojo.Widget.QuickContact.SelectNone) {
				icon.setStyle({"background":"url(images/" + p.icon +".png)"});
				classes.push("active");
			} else {
				classes.push("inactive");
			}
			
			icon.className = classes.join(" ");
		}
	},
	initContact:function() {
		LBB.Util.log("> QuickContact.initContact");
		
		var c = this.controller.model;
		
		if(!c.qc) {
			c.qc = {selections:{},smallPhoto:null,largePhoto:null,photoDimensions:{w:0,h:0}};
			
			var phone = Mojo.Widget.QuickContact.getDefaultPhone(c, "phone");
			var sms = Mojo.Widget.QuickContact.getDefaultPhone(c, "sms");
			var email = Mojo.Widget.QuickContact.getDefaultEmail(c);
			var im = Mojo.Widget.QuickContact.getDefaultIM(c);
			
			c.qc.selections['0'] = {'index':0,'icon':'phone','action':'phone','details':(phone) ? phone.id : null};
			c.qc.selections['1'] = {'index':1,'icon':'txt','action':'sms','details':(sms) ? sms.id : null};
			c.qc.selections['2'] = {'index':2,'icon':'email','action':'email','details':(email) ? email.id : null};
			c.qc.selections['3'] = {'index':3,'icon':'im','action':'im','details':(im) ? im.id : null};
		}
	},
	select:function(selected) {				
		this.attributes.selected = (selected == true);
		this.render();
	},
	loadContactPhoto:function() {
		var c = this.controller.model;
		
		// if photos haven't been initialized, do so
		if(c.qc.largePhoto == null) {
			c.qc.largePhoto = (c.pictureLocBig) ? c.pictureLocBig : c.pictureLoc;
			c.qc.smallPhoto = c.pictureLoc;
		}
			
		// resize only applies to grid mode
		if(this.attributes.container == "grid") {

			var main = this.controller.get(this.attributes.id + "_photo");
			var size = this.attributes.dimensions.size - (this.attributes.dimensions.padding*2)
			var photo = "/var/luna/data/extractfs" + encodeURIComponent(c.qc.largePhoto) + ":0:0:"+size+":"+size+":4";
	
			main.style.cssText += "background:url('" + photo + "');background-position:center center;background-repeat:no-repeat;";
		} else { // list view
			this.controller.get(this.attributes.id + "_img").setAttribute('src', c.qc.smallPhoto);
		}
	},
	onIconTap:function(event) {
		LBB.Util.log("> QuickContact.onIconTap");
		var c = this.controller.get(event.currentTarget);
		
		var index = c.id.substring(c.id.lastIndexOf("_")+1);
		var s = this.controller.model.qc.selections[index]
		var action = s.action;
		var operations = {"phone":this.handlers.onPhone,"sms":this.handlers.onSMS,"im":this.handlers.onIM,"email":this.handlers.onEmail};
		  
		operations[action](s.details);
	},
	onPhone:function(id) {
		LBB.Util.log("> QuickContact.onPhone");

		var phone = this.getPointById("phone", id);
		var p = LBB.Preferences.getInstance();
		
		var param = {};
		param[(p.getProperty("autoDial") == true) ? "number" : "prefill"] = phone.value;
		
		this.controller.scene.serviceRequest('palm://com.palm.applicationManager', {
		    method: 'launch',
		    parameters:  {
		    	id: 'com.palm.app.phone',
		    	params: param
		    }
		});
		
		this.actionComplete(event, "phone");
	},
	onSMS:function(id) {
	    var phone = this.getPointById("sms", id);
		
		this.controller.scene.serviceRequest('palm://com.palm.applicationManager', {
		     method: 'launch',
		     parameters: {
		     	id: "com.palm.app.messaging",
		     	params: {
		          	composeRecipients: [{
						address: phone.value
					}]
					/* contact point method */
					//personId: this.controller.model.id,
					//contactPointId: p.id,
					//address:p.value
				}
		     }
		});
		
		this.actionComplete(event, "sms");
	},
	onIM:function(id) {
		var im = this.getPointById("im", id);
		
		this.controller.scene.serviceRequest('palm://com.palm.applicationManager', {
		     method: 'launch',
		     parameters: {
		         id: 'com.palm.app.messaging',
		         params: {
		         	composeRecipients: [{
						address: im.value,
						serviceName: im.serviceName
					}]
					/* contact point method */
					//personId: this.controller.model.id,
					//contactPointId: im.id,
					//address:im.value,
					//type:'im',
					//serviceName: im.serviceName
		         }
		     }
		});
		
		this.actionComplete(event, "im");
	},
	onEmail:function(id) {
		var email = this.getPointById("email", id);

		this.controller.scene.serviceRequest("palm://com.palm.applicationManager", {
			method:"open",
			parameters:{ target: "mailto:" + email.value}
		});

		this.actionComplete(event, "email");
	},
	actionComplete:function(event, action) {
		var closeAction = LBB.Preferences.getInstance().getProperty("closeAction");
		
		event.stopPropagation();
		
		if(closeAction == "any" || closeAction == action) {
			this.controller.window.close();
		}
	},
	getPointById:function(action, id) {
		return Mojo.Widget.QuickContact.getPointById(this.controller.model, action, id);
	}
};

Mojo.Widget.QuickContact = Class.create(_QuickContact);

/*** 'static' members of QuickContact ***/

Mojo.Widget.QuickContact.SelectAuto = "QuickContact.Selection.Auto";
Mojo.Widget.QuickContact.SelectNone = "QuickContact.Selection.None";
Mojo.Widget.QuickContact.ActionMap = {
	"phone":{"list":"phoneNumbers","label":$L("Phone")},
	"sms":{"list":"phoneNumbers","label":$L("SMS")},
	"email":{"list":"emailAddresses","label":$L("Email")},
	"im": {"list": "imNames","label": $L("IM")}
}

Mojo.Widget.QuickContact.getPointById = function(contact, action, id) {
	var list = contact[this.ActionMap[action].list];
	if(!list) return;
	
	for(var i=0;i<list.length;i++) {
		if(list[i].id == id) {
			return list[i];
		}
	}
};

Mojo.Widget.QuickContact.getDefaultEmail = function(contact) {
	//var pref = this.getPreference(contact, "email");
	//if(pref == null || pref == Mojo.Widget.QuickContact.SelectAuto) {
		pref = (contact.emailAddresses) ? contact.emailAddresses[0] : this.SelectNone;
	//}
	
	return pref;
};

Mojo.Widget.QuickContact.getDefaultIM = function(contact) {
	//var pref = this.getPreference(contact, "im");
	//if(pref == null || pref == Mojo.Widget.QuickContact.SelectAuto) {
		pref = (contact.imNames) ? contact.imNames[0] : this.SelectNone;
	//}

	return pref;
};

Mojo.Widget.QuickContact.getDefaultPhone = function(contact, type) {
	//var pref = this.getPreference(contact, type);
	//if(pref == null || pref == this.SelectAuto) {
		if (contact.phoneNumbers) {
			var numbers = {};
			var pn = contact.phoneNumbers;
			var n = pn[0];
			
			for (var i = 0; i < pn.length; i++) {
				if (!numbers["_" + pn[i].label]) 
					numbers["_" + pn[i].label] = pn[i];
			}
			
			if (numbers["_3"]) {
				n = numbers["_3"];
			} else if (numbers["_1"]) {
				n = numbers["_1"];
			} else if (numbers["_0"]) {
					n = numbers["_0"];
			}
		
			pref = n;
		} else {
			pref = this.SelectNone;
		}
	//}
	
	return pref;
};

Mojo.Widget.QuickContact.getPreference = function(contact, key) {
	LBB.Util.log("> QuickContact.getPreference", type);
	
	var map = { "phone":"phoneNumbers", "sms":"phoneNumbers", "email":"emailAddresses", "im":"imNames" };
	
	// kick out if no selection
	if(!contact.qc.selections || !contact.qc.selections[key] || !contact.qc.selections[key].details) {
		return;
	}
	
	var type = contact.qc.selections[key].action;
	var pref = contact.qc.selections[key].details;

	// if it's Auto or None, return that 
	if(pref != this.SelectAuto && pref != this.SelectNone && contact[map[type]]) {
		// try to match contactpoint.id with preference 
		for(var i=0;i<contact[map[type]].length;i++) {
			var item = contact[map[type]][i];
			if(item.id == pref) {
				return item;
			}
		}
		
		// made it here so must be an invalid pref (e.g. contact point removed)
		// set back to auto
		pref = this.SelectAuto;
	}
	
	return pref;
};

Mojo.Widget.QuickContact.stripNonNumeric = function(s) {
  return s.replace(/[^0-9]/gi, "");
};

Mojo.Widget.QuickContact.formatContactName = function(value, model) {
	var name = "";
	
	if(model.firstName) {
		name = model.firstName;
	}
	
	if(model.lastName) {
		name += " " + model.lastName;
	}
	
	if(name.length == 0 && model.companyName) {
		name = model.companyName;
	}
	
	return name;
}