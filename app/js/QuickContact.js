Mojo.Widget.QuickContact = Class.create({
	initialize: function() {
		this.defaultPhoto = "images/details-image-generic.png";
	    this.attributes = 
		{
			"container":"grid",
			"selected":false
		};
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
		
		if(prefs.getProperty("asyncPhoto")) {
			this.loadContactPhoto.async(this);
		} else {
			this.loadContactPhoto();
		}
		
		Mojo.Event.listen($(this.controller.element.id + "_phone"), Mojo.Event.tap, this.onPhone.bind(this), true);
		Mojo.Event.listen($(this.controller.element.id + "_email"), Mojo.Event.tap, this.onEmail.bind(this), true);
		Mojo.Event.listen($(this.controller.element.id + "_txt"), Mojo.Event.tap, this.onTxt.bind(this), true);
		Mojo.Event.listen($(this.controller.element.id + "_im"), Mojo.Event.tap, this.onIM.bind(this), true);
		
		this.controller.exposeMethods(["select", "render"]);
		this.render();
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
		//Mojo.Log.info("> QuickContact.displayIcons");
		
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
		
		//Mojo.Log.info("< QuickContact.displayIcons");
	},
	initContact:function() {
		//Mojo.Log.info("> QuickContact.loadContact");
		
		var c = this.controller.model;
		
		// init selections
		var selections = ["phone", "email", "sms", "im"];
		
		if(!c.qc) {
			c.qc = {selections:{},smallPhoto:null,largePhoto:null,photoDimensions:{w:0,h:0}};
			
			for(var i=0;i<selections.length;i++) {
				c.qc.selections[selections[i]] = Mojo.Widget.QuickContact.SelectAuto;
			}
		}
	},
	select:function(selected) {
		//Mojo.Log.info("> QuickContact.onSelect");
				
		this.attributes.selected = (selected == true);
		this.render();
	},
	loadContactPhoto:function() {
		Mojo.Log.info("> QuickContact.loadContactPhoto");
		
		var img = new Element('img', {'style':'position:absolute;visibility:hidden;z-index:-10000'});
		$(this.attributes.id).insert(img);
		
		var c = this.controller.model;
		
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
		
		// resize only applies to grid mode
		if(this.attributes.container == "grid") {
		
			// set high-res photo
			img.setAttribute('src', c.qc.largePhoto);
			
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
			
			main.style.cssText += "background:url('" + c.qc.largePhoto + "');-webkit-background-size:" + scale.w + " " + scale.h + ";background-position:" + pos.left + " " + pos.top + ";";
		} else { // list view
			$(this.attributes.id + "_img").setAttribute('src', c.qc.smallPhoto);
		}
	},
	onPhone:function(event) {	
		//Mojo.Log.info("> QuickContact.onPhone");
		
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
		
		event.stopPropagation();
	},
	onTxt:function() {
	    var p = Mojo.Widget.QuickContact.getDefaultPhone(this.controller.model, "sms");
		this.controller.scene.serviceRequest('palm://com.palm.applicationManager', {
		     method: 'launch',
		     parameters: {
		     	id: "com.palm.app.messaging",
		     	params: {
					personId: this.controller.model.id,
					contactPointId: p.id,
					address:p.value
				}
		     }
		});
	},
	onIM:function() {
		var im = Mojo.Widget.QuickContact.getDefaultIM(this.controller.model);
		this.controller.scene.serviceRequest('palm://com.palm.applicationManager', {
		     method: 'launch',
		     parameters: {
		         id: 'com.palm.app.messaging',
		         params: {
					personId: this.controller.model.id,
					contactPointId: im.id,
					address:im.value,
					type:'im',
					serviceName: im.serviceName
		         }
		     }
		});
		
		event.stopPropagation();
	},
	onEmail:function() {
		this.controller.scene.serviceRequest("palm://com.palm.applicationManager", {
			method:"open",
			parameters:{ target: "mailto:" + Mojo.Widget.QuickContact.getDefaultEmail(this.controller.model)}
		});

		event.stopPropagation();
	}
});

/*** 'static' members of QuickContact ***/

Mojo.Widget.QuickContact.SelectAuto = "QuickContact.Selection.Auto";
Mojo.Widget.QuickContact.SelectNone = "QuickContact.Selection.None";

Mojo.Widget.QuickContact.getDefaultEmail = function(contact) {
	var pref = this.getPreference(contact, "email");
	return (pref != Mojo.Widget.QuickContact.SelectAuto) ? pref : contact.emailAddresses[0].value;
};

Mojo.Widget.QuickContact.getDefaultIM = function(contact) {
	var pref = this.getPreference(contact, "im");
	if(pref == Mojo.Widget.QuickContact.SelectAuto) {
		return contact.imNames[0];
	} else {
		for(var i=0;i<contact.imNames.length;i++) {
			var im = contact.imNames[i];
			if(im.id == pref) {
				return im;
			}
		}
	}
};

Mojo.Widget.QuickContact.getDefaultPhone = function(contact, type) {
	var pref = this.getPreference(contact, type);
	if(pref == Mojo.Widget.QuickContact.SelectAuto) {
		var numbers = {};
		var pn = contact.phoneNumbers;
		var n = pn[0];
		
		for(var i=0;i<pn.length;i++) {
			if(!numbers["_"+pn[i].label])
				numbers["_"+pn[i].label] = pn[i];
		}
		
		if(numbers["_3"]) {
			n = numbers["_3"];
		}
		else if(numbers["_1"]) {
			n = numbers["_1"];
		}
		else if(numbers["_0"]) {
			n = numbers["_0"];
		}
		
		return n;
	} else {
		var pn = contact.phoneNumbers;
		
		for(var i=0;i<pn.length;i++) {
			if(pn[i].value == pref)
				return pn[i];
		}
	}
};

Mojo.Widget.QuickContact.getPreference = function(contact, type) {
	// should always be true since it's initialized in initContact
	if(contact.qc.selections) {
		return contact.qc.selections[type];
	}
};

Mojo.Widget.QuickContact.stripNonNumeric = function(s) {
  return s.replace(/[^0-9]/gi, "");
};