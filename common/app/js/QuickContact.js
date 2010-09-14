var _QuickContact = {
	initialize: function() {
		this.defaultPhoto = "images/details-image-generic.png";
	    this.attributes = 
		{
			"container":"grid",
			"selected":false
		};
		this.handlers = new HandlerManager(this, ["onPhone", "onEmail", "onTxt", "onIM"])
	},
	setup:function() {
		//Mojo.Log.info("> QuickContact.setup");
		
		// merge attributes provided by setupWidget
		// with this instance's default attributes
		for(var key in this.controller.attributes)
			this.attributes[key] = this.controller.attributes[key];
			
		this.attributes.id = this.controller.element.id;
		var prefs = LBB.Preferences.getInstance();
		
		this.initContact();
		
		var content = Mojo.View.render({"template":"QuickContact/"+this.attributes.container, attributes:this.attributes, object:this.controller.model});
		this.controller.element.innerHTML = content;
		
		//if(prefs.getProperty("asyncPhoto")) {
		//	this.loadContactPhoto.async(this);
		//} else {
			this.loadContactPhoto();
		//}
		
		Mojo.Event.listen($(this.controller.element.id + "_phone"), Mojo.Event.tap, this.handlers.onPhone, true);
		Mojo.Event.listen($(this.controller.element.id + "_email"), Mojo.Event.tap, this.handlers.onEmail, true);
		Mojo.Event.listen($(this.controller.element.id + "_txt"), Mojo.Event.tap, this.handlers.onTxt, true);
		Mojo.Event.listen($(this.controller.element.id + "_im"), Mojo.Event.tap, this.handlers.onIM, true);
		
		this.controller.exposeMethods(["select", "render"]);
		this.render();
	},
	cleanup:function() {
		//Mojo.Log.info("> QuickContact.cleanup");
		
		Mojo.Event.stopListening($(this.controller.element.id + "_phone"), Mojo.Event.tap, this.handlers.onPhone, true);
		Mojo.Event.stopListening($(this.controller.element.id + "_email"), Mojo.Event.tap, this.handlers.onEmail, true);
		Mojo.Event.stopListening($(this.controller.element.id + "_txt"), Mojo.Event.tap, this.handlers.onTxt, true);
		Mojo.Event.stopListening($(this.controller.element.id + "_im"), Mojo.Event.tap, this.handlers.onIM, true);
		
		this.handlers.release();
	},
	render:function() {
		try {
			if(this.attributes.selected) {
				this.displayIcons();
				$(this.attributes.id).className = this.attributes.container + " QuickContact selected";
			} else {
				$(this.attributes.id).className = this.attributes.container + " QuickContact";
			}
		} catch(e) {
			Mojo.Log.error("Render issue for '" + this.attributes.id + "': " + e);
		}
	},
	displayIcons:function() {
		LBB.Util.log("> QuickContact.displayIcons");
		
		// utility function to set active/inactive for button
		var swap = function(id, type, obj) {
			var p = Mojo.Widget.QuickContact.getPreference(this.controller.model, type);
			
			var c = (p == Mojo.Widget.QuickContact.SelectNone || !obj) ? ["inactive","active"] : ["active","inactive"];
	
			$(id).addClassName(c[0]);
			$(id).removeClassName(c[1]);
		}.bind(this);
		
		swap(this.attributes.id + "_phone", "phone", this.controller.model.phoneNumbers);
		swap(this.attributes.id + "_email", "email", this.controller.model.emailAddresses);
		swap(this.attributes.id + "_txt", "sms", this.controller.model.phoneNumbers);
		swap(this.attributes.id + "_im", "im", this.controller.model.imNames);
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
			
			c.qc.selections.phone = (phone) ? phone.id : Mojo.Widget.QuickContact.SelectNone;
			c.qc.selections.sms = (sms) ? sms.id : Mojo.Widget.QuickContact.SelectNone;
			c.qc.selections.email = (email) ? email.id : Mojo.Widget.QuickContact.SelectNone;
			c.qc.selections.im = (im) ? im.id : Mojo.Widget.QuickContact.SelectNone;
		}
	},
	select:function(selected) {
		//Mojo.Log.info("> QuickContact.onSelect");
				
		this.attributes.selected = (selected == true);
		this.render();
	},
	loadContactPhoto:function() {
		//Mojo.Log.info("> QuickContact.loadContactPhoto");
		
		var c = this.controller.model;
		this.getDimensions(c);
			
		// resize only applies to grid mode
		if(this.attributes.container == "grid") {

			var main = $(this.attributes.id + "_main");
			var size = this.attributes.dimensions.size - (this.attributes.dimensions.padding*2)
			
			// calc ratio of photo height/width to size of QC			
			var wRatio = c.qc.photoDimensions.w/size;
			var hRatio = c.qc.photoDimensions.h/size;
			
			var scale = {w:"auto",h:"auto"};
			var pos = {left:"0%",top:"0%"};
			
			if(wRatio > hRatio) {
				scale.h = "100%";
				pos.left = Math.round((wRatio/hRatio)*50) + "%";
			} else {
				scale.w = "100%";
				pos.top = Math.round((hRatio/wRatio)*50) + "%";
			}
			
			if(c.qc.largePhoto == this.defaultPhoto) {
				c.qc.largePhoto = Mojo.appPath.substring(7) + this.defaultPhoto;
			}
			
			var photoSize = (size*2);
			var photo = "/var/luna/data/extractfs" + encodeURIComponent(c.qc.largePhoto) + ":0:0:"+photoSize+":"+photoSize+":3";
	
			main.style.cssText += "background:url('" + photo + "');-webkit-background-size:" + scale.w + " " + scale.h + ";background-position:center center;background-repeat:no-repeat;";
		} else { // list view
			$(this.attributes.id + "_img").setAttribute('src', c.qc.smallPhoto);
		}
		
		//Mojo.Log.info("< QuickContact.loadContactPhoto");
	},
	getDimensions:function(c) {
		
		// TODO: leaving this check out for now until i find a better way to check for missing pictures
		//if(c.qc.photoDimensions.h && c.qc.photoDimensions.w) return;
		
		var img = new Element('img', {'style':'position:absolute;visibility:hidden;z-index:-10000'});
		$(this.attributes.id).insert(img);
		
		
		// if photos haven't been initialized, do so
		if(c.qc.largePhoto == null) {
			c.qc.largePhoto = c.pictureLocBig;
			c.qc.smallPhoto = c.pictureLoc;
		}
		
		// get dimensions
		img.setAttribute('src', c.qc.largePhoto);
		
		// picture is gone, use default
		if(img.offsetWidth == 0) {
			c.qc.largePhoto = c.qc.smallPhoto = this.defaultPhoto;
			img.setAttribute('src', c.qc.largePhoto);
		}
				
		c.qc.photoDimensions.h = img.offsetHeight;
		c.qc.photoDimensions.w = img.offsetWidth;
		
		// no longer needed once size determined
		img.remove();
	},
	onPhone:function(event) {	
		var p = LBB.Preferences.getInstance();
		
		var param = {};
		param[(p.getProperty("autoDial") == true) ? "number" : "prefill"] = Mojo.Widget.QuickContact.getDefaultPhone(this.controller.model, "phone").value;
		
		this.controller.scene.serviceRequest('palm://com.palm.applicationManager', {
		    method: 'launch',
		    parameters:  {
		    	id: 'com.palm.app.phone',
		    	params: param
		    }
		});
		
		this.actionComplete(event, "phone");
	},
	onTxt:function(event) {
	    var p = Mojo.Widget.QuickContact.getDefaultPhone(this.controller.model, "sms");
		this.controller.scene.serviceRequest('palm://com.palm.applicationManager', {
		     method: 'launch',
		     parameters: {
		     	id: "com.palm.app.messaging",
		     	params: {
		          	composeRecipients: [{
						address: p.value
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
	onIM:function(event) {
		var im = Mojo.Widget.QuickContact.getDefaultIM(this.controller.model);
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
	onEmail:function(event) {
		var email = Mojo.Widget.QuickContact.getDefaultEmail(this.controller.model);

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
			window.close();
		}
	}
};

Mojo.Widget.QuickContact = Class.create(_QuickContact);

/*** 'static' members of QuickContact ***/

Mojo.Widget.QuickContact.SelectAuto = "QuickContact.Selection.Auto";
Mojo.Widget.QuickContact.SelectNone = "QuickContact.Selection.None";

Mojo.Widget.QuickContact.getDefaultEmail = function(contact) {
	var pref = this.getPreference(contact, "email");
	if(pref == null || pref == Mojo.Widget.QuickContact.SelectAuto) {
		pref = (contact.emailAddresses) ? contact.emailAddresses[0] : this.SelectNone;
	}
	
	return pref;
};

Mojo.Widget.QuickContact.getDefaultIM = function(contact) {
	var pref = this.getPreference(contact, "im");
	if(pref == null || pref == Mojo.Widget.QuickContact.SelectAuto) {
		pref = (contact.imNames) ? contact.imNames[0] : this.SelectNone;
	}

	return pref;
};

Mojo.Widget.QuickContact.getDefaultPhone = function(contact, type) {
	var pref = this.getPreference(contact, type);
	if(pref == null || pref == this.SelectAuto) {
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
			}
			else 
				if (numbers["_1"]) {
					n = numbers["_1"];
				}
				else 
					if (numbers["_0"]) {
						n = numbers["_0"];
					}
			
			pref = n;
		} else {
			pref = this.SelectNone;
		}
	}
	
	return pref;
};

Mojo.Widget.QuickContact.getPreference = function(contact, type) {
	LBB.Util.log("> QuickContact.getPreference", type);
	
	var map = { "phone":"phoneNumbers", "sms":"phoneNumbers", "email":"emailAddresses", "im":"imNames" };
	
	// should always be true since it's initialized in initContact
	if(contact.qc.selections) {
		var pref = contact.qc.selections[type];
		
		LBB.Util.log(type, pref);
		
		// if it's Auto or None, return that 
		if(pref != this.SelectAuto && pref != this.SelectNone && contact[map[type]]) {
			// try to match contact.id with preference 
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
	}
};

Mojo.Widget.QuickContact.stripNonNumeric = function(s) {
  return s.replace(/[^0-9]/gi, "");
};