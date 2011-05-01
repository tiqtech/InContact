var _QuickGroup = {
	initContact:function($super) {
		// not needed for groups
	},
	displayIcons:function($super) {
		
		var m = this.controller.model;
		var hasEmail = false;
		var hasSMS = false;
		
		for(var i=0;i<m.members.length && !(hasEmail && hasSMS);i++) {
			if(m.members[i].email != "") {
				hasEmail = true;
			}
			
			if(m.members[i].sms != "") {
				hasSMS = true;
			}
		}
		
		var email = this.getIcon(0);
		if(hasEmail) {
			email.setStyle({"background":"url(images/email.png)"});
			email.addClassName("active");
		} else {
			email.addClassName("inactive");
		}
		
		var sms = this.getIcon(1);
		if(hasSMS) {
			sms.setStyle({"background":"url(images/txt.png)"});
			sms.addClassName("active");
		} else {
			sms.addClassName("inactive");
		}
		
		// hide 2 and 3 (3rd and 4th icons)
		this.getIcon(2).addClassName("inactive");
		this.getIcon(3).addClassName("inactive");
	},
	getLargePhotoPath:function($super) {
		return this.controller.model.photo;
	},
	getSmallPhotoPath:function($super) {
		return this.controller.model.photo;
	},
	formatContactName:function($super) {
		return this.controller.model.name;
	},
	onIconTap:function($super, event) {
		LBB.Util.log("> QuickGroup.onIconTap");
		
		var c = this.controller.get(event.currentTarget);
		var index = c.id.substring(c.id.lastIndexOf("_")+1);
		
		if(index === '0') {
			this.emailGroup(event);
		} else if(index === '1') {
			this.smsGroup(event);
		}
	},
	emailGroup:function(event) {
		LBB.Util.log("> QuickGroup.emailGroup")
		
		var recipients = [];
		
		for(var i=0;i<this.controller.model.members.length;i++) {
			var m = this.controller.model.members[i];
			if(m.email != "") {
				recipients.push({contactDisplay:m.name,role:1,type:"email",value:m.email});
			}
		}
		
		this.controller.scene.serviceRequest("palm://com.palm.applicationManager", {
			method:"open",
			parameters:{
				id:"com.palm.app.email",
				params:{
					recipients:recipients
				}
			}
		});
		
		this.actionComplete(event, "email");
	},
	smsGroup:function(event) {
		LBB.Util.log("> QuickGroup.smsGroup");
		
		var recipients = [];
		
		for(var i=0;i<this.controller.model.members.length;i++) {
			var m = this.controller.model.members[i];
			if(m.sms != "") {
				recipients.push({contactDisplay:m.name,address:m.sms});
			}
		}
		
		this.controller.scene.serviceRequest("palm://com.palm.applicationManager", {
			method:"launch",
			parameters:{
				id:"com.palm.app.messaging",
				params:{
					composeRecipients:recipients
				}
			}
		});
		
		this.actionComplete(event, "sms");
	}
}

Mojo.Widget.QuickGroup = Class.create(Mojo.Widget.QuickContact, _QuickGroup);
