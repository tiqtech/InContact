var _QuickContact = {
	name: "QuickContact",
	kind: "Control",
	className: "QuickContact",
	components: [
		{
			className: "wrapper",
			name: "photo",
			kind: "BackgroundImage",
			defaultImage:"images/details-image-generic.png",
			components: [
				{className:"contactName",name:"contactName",content:"My NAME"},
				{name:"icon0", kind:"QuickContactIcon", className:"top left", onPhone:"onPhone", onEmail:"onEmail",onSMS:"onSMS",onIM:"onIM"},
				{name:"icon1", kind:"QuickContactIcon", className:"top right", onPhone:"onPhone", onEmail:"onEmail",onSMS:"onSMS",onIM:"onIM"},
				{name:"icon2", kind:"QuickContactIcon", className:"bottom left", onPhone:"onPhone", onEmail:"onEmail",onSMS:"onSMS",onIM:"onIM"},
				{name:"icon3", kind:"QuickContactIcon", className:"bottom right", onPhone:"onPhone", onEmail:"onEmail",onSMS:"onSMS",onIM:"onIM"},
			]
		},
		{name:"util", kind:"QuickContactUtil"},
		{
			name: "appLauncher",
			kind: "PalmService",
			service: "palm://com.palm.applicationManager/",
			method: "launch",
			onSuccess: "onLaunchSuccess",
			onFailure: "onLaunchFailure"
		}
	],
	published:{
		contact:{},
		selected:false,
	},
	create:function() {
		this.inherited(arguments);
		
		this.selectedChanged();
		this.contactChanged();
	},
	selectedChanged:function(wasSelected) {
		this.addRemoveClass("selected", this.selected)
	},
	contactChanged:function(oldContact) {
		if(!this.contact || !this.contact.qc) return;
		
		this.$.util.setContact(this.contact);
		
		// TODO: consider changing this to a ContactName component
		this.$.contactName.setContent(this.$.util.formatContactName());
		this.$.photo.setImage(this.contact.qc.largePhoto);
		
		for(var i=0;i<4;i++) {
			this.$["icon"+i].setModel(this.contact);
			this.$["icon"+i].setIndex(i);
		}
	},
	onLaunchSuccess:function() {
		this.log("ok!");
	},
	onLaunchFailure:function() {
		this.log("failed :(");
	},
	onPhone:function(sender, id) {
		var point = this.$.util.getPointById(id, "phone");
		
		this.$.appLauncher.call({
			parameters:  {
		    	id: 'com.palm.app.phone',
		    	params: {number:point.value}
		    }
		});		
	},
	onSMS:function(sender, id) {
		var point = this.$.util.getPointById(id, "sms");
	},
	onEmail:function(sender, id) {
		var point = this.$.util.getPointById(id, "email");
	},
	onIM:function(sender, id) {
		var point = this.$.util.getPointById(id, "im");
	}
}

var _QuickContactIcon = {
	name:"QuickContactIcon",
	kind:"Control",
	className:"icon",
	published:{
		model:null,
		index:-1
	},
	events:{
		onPhone:"",
		onEmail:"",
		onSMS:"",
		onIM:""
	},
	components:[
		{name:"util", kind:"QuickContactUtil"}
	],
	create:function() {
		this.inherited(arguments);
		this.contactUpdated();
	},
	contactUpdated:function() {
		if(!this.model || this.index === -1) return;
		
		var m = this.model.qc.selections[this.index];
		
		if(!m.details || m.details === "NONE") {
			this.addClass("inactive");
			this.removeClass("active");
		} else {
			this.setStyle("background-image:url(images/" + m.icon +".png)");
			this.addClass("active");
			this.removeClass("inactive");
		}
		
		this.$.util.setContact(this.model);
		var pref = this.$.util.getPreference(this.index);
		
		if(pref) {
			this.setContent(pref.value);
		} else {
			this.hide();
		}
	},
	indexChanged:function() {
		this.contactUpdated();
	},
	modelChanged:function(oldModel) {
		this.contactUpdated();
	},
	clickHandler:function(sender, event) {
		// dispatch action
		switch(this.model.action) {
			case "phone":
				this.doPhone(this.model.details);
				break;
			case "email":
				this.doEmail(this.model.details);
				break;
			case "sms":
				this.doSMS(this.model.details);
				break;
			case "im":
				this.doIM(this.model.details);
				break;
		}
	}
}

var _QuickContactUtil = {
	name:"QuickContactUtil",
	kind:"Component",
	published:{
		contact:null,
		Auto:"AUTO",
		None:"NONE",
		ActionMap:{
			"phone":{"list":"phoneNumbers","label":$L("Phone")},
			"sms":{"list":"phoneNumbers","label":$L("SMS")},
			"email":{"list":"emailAddresses","label":$L("Email")},
			"im": {"list": "imNames","label": $L("IM")}
		}
	},
	create:function() {
		this.inherited(arguments);
	},
	formatContactName:function() {
		var name = "";
		
		if(!this.contact) return name;
	
		if(this.contact.firstName) {
			name = this.contact.firstName;
		}
		
		if(this.contact.lastName) {
			name += " " + this.contact.lastName;
		}
		
		if(this.contact.length === 0 && this.contact.companyName) {
			name = this.contact.companyName;
		}
		
		return name;
	},
	getPreference:function(key) {
		var map = { "phone":"phoneNumbers", "sms":"phoneNumbers", "email":"emailAddresses", "im":"imNames" };
		
		var c = this.contact;
		
		// kick out if no selection
		if(!c.qc.selections || !c.qc.selections[key] || !c.qc.selections[key].details) {
			return;
		}
		
		var SelectAuto = "auto";
		var SelectNone = "none";
		
		var type = c.qc.selections[key].action;
		var pref = c.qc.selections[key].details;
	
		// if it's Auto or None, return that 
		if(pref != SelectAuto && pref != SelectNone && c[map[type]]) {
			// try to match contactpoint.id with preference 
			for(var i=0;i<c[map[type]].length;i++) {
				var item = c[map[type]][i];
				if(item.id == pref) {
					return item;
				}
			}
			
			// made it here so must be an invalid pref (e.g. contact point removed)
			// set back to auto
			pref = SelectAuto;
		}
		
		return undefined;
	},
	getPointById:function(id, action) {
		var list = this.contact[this.ActionMap[action].list];
		if(!list) return;
		
		for(var i=0;i<list.length;i++) {
			if(list[i].id === id) {
				return list[i];
			}
		}
	}
}

enyo.kind(_QuickContact);
enyo.kind(_QuickContactIcon);
enyo.kind(_QuickContactUtil);
