LBB.Model.prototype.update = function(version, targetVersion) {
	LBB.Util.log("> Model.update version=", version);
	
	if(!version) version = targetVersion;
	
	// * changed contact selections from data to contactPointId
	if(version == "1.0.0") {
		LBB.Util.log("updating to version 1.1.0");

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
		LBB.Util.log("updating to 1.2.1");
		
		version = "1.2.1";
		this.pages = [new LBB.Page(null, this.contacts)];
		
	}
	
	// v1.4.0 didn't handle model updates so this applies to either 1.4.0 or 1.4.1
	if(version == "1.4.0" || version == "1.4.1") {
		LBB.Util.log("Updating to 1.4.2");
		version = "1.4.2";
		
		for(var i=0;i<this.pages.length;i++) {
			var p = this.pages[i];
			for(var j=0;j<p.contacts.length;j++) {
				var c = p.contacts[j];
				
				// new contacts added in 1.4.x won't have .phone since
				// selections are set as a psuedo-array rather than action hash
				if(!c.qc.selections.phone) continue;
				
				var phone = c.qc.selections['phone'];
				if (phone == Mojo.Widget.QuickContact.SelectAuto) {
					phone = Mojo.Widget.QuickContact.getDefaultPhone(c, "phone");
					if(phone != Mojo.Widget.QuickContact.SelectNone) {
						phone = phone.id;
					}
				}
				
				var email = c.qc.selections['email'];
				if (email == Mojo.Widget.QuickContact.SelectAuto) {
					email = Mojo.Widget.QuickContact.getDefaultEmail(c);
					if(email != Mojo.Widget.QuickContact.SelectNone) {
						email = email.id;
					}
				}
				
				var sms = c.qc.selections['sms'];
				if (sms == Mojo.Widget.QuickContact.SelectAuto) {
					sms = Mojo.Widget.QuickContact.getDefaultPhone(c, "sms");
					if(sms != Mojo.Widget.QuickContact.SelectNone) {
						sms = sms.id;
					}
				}
				
				var im = c.qc.selections['im'];
				if (im == Mojo.Widget.QuickContact.SelectAuto) {
					im = Mojo.Widget.QuickContact.getDefaultIM(c);
					if(im != Mojo.Widget.QuickContact.SelectNone) {
						im = im.id;
					}
				}
				
				c.qc.selections['0'] = {'index':0,'icon':'phone','action':'phone','details':phone};
				c.qc.selections['1'] = {'index':1,'icon':'txt','action':'sms','details':sms};
				c.qc.selections['2'] = {'index': 2,'icon': 'email','action': 'email','details':email};
				c.qc.selections['3'] = {'index':3,'icon': 'im','action': 'im','details':im};
				
				delete c.qc.selections.phone;
				delete c.qc.selections.sms;
				delete c.qc.selections.email;
				delete c.qc.selections.im;
			}
		}
	}
	
	this.save();
}

// needed for data model update from 1.0.0 to 1.1.0
LBB.Model.prototype._updateEntry = function(c, type, comparator) {
	//LBB.Util.log("> _updateEntry");
	
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