var EditContactAssistant = Class.create(
{
	initialize:function(model) {
		this.model = model;
		this.handlers = new HandlerManager(this, ["onSave","onCancel","onDelete","onChange"]);
	},
	setup:function() {
		//Mojo.Log.info("> EditContactAssistant.setup");
		
		this.setupLists();
		
		// Setup Labels
		$('phoneLabel').insert($L('Phone'));
		$('imLabel').insert($L('IM'));
		$('emailLabel').insert($L('Email'));
		$('smsLabel').insert($L('SMS'));
		
		$('edit_contact_name').innerText = this.safeString(this.model.firstName) + " " + this.safeString(this.model.lastName);
		$('edit_contact_photo').src = this.model.qc.smallPhoto;
		
		this.setupButton('saveButton', {buttonLabel:$L("Save"),buttonClass:"affirmative"}, this.handlers.onSave);
		this.setupButton('cancelButton', {buttonLabel:$L("Cancel"),buttonClass:"secondary"}, this.handlers.onCancel);
		this.setupButton('deleteButton', {buttonLabel:$L("Delete"),buttonClass:"negative"}, this.handlers.onDelete);
	},
	cleanup:function() {
		this.controller.stopListening($('saveButton'), Mojo.Event.tap, this.handlers.onSave);
		this.controller.stopListening($('cancelButton'), Mojo.Event.tap, this.handlers.onCancel);
		this.controller.stopListening($('deleteButton'), Mojo.Event.tap, this.handlers.onDelete);
	},
	safeString:function(s) {
		return (s) ? s : "";
	},
	activate:function(event) {
		
	},
	deactivate:function(event) {

	},
	onChange:function(event) {
		//Mojo.Log.info("> EditContactAssistant.onChange");
		var n = event.currentTarget;
		var params = n.id.split("-");
		
		var type = params[2];
		var id = params[3];
		
		// select radio button
		$(n.id + '-radio').checked = true;
		
		// close drawer
		$(type+'Drawer').mojo.setOpenState(false);
		
		// update display text
		$(type+'Details').update($(n.id+'-text').innerText);
		
		// update selection
		this.model.qc.selections[type] = $(n.id+'-radio').value;
		
		// prevent drawer from reopening
		event.stopPropagation();
	},
	onDelete:function(event) {
		//Mojo.Log.info("> EditContactAssistant.onDelete");
		
		event.stopPropagation();
		
		this.controller.showAlertDialog(
		{
			onChoose:this.onConfirmDelete.bind(this),
			title:$L("Confirm Deletion"),
			message:$L("Are you sure you want to delete this contact?"),
			choices:
			[
				{label:"Delete",value:"DELETE",type:"negative"},
				{label:"Cancel",value:"CANCEL",type:"dismiss"},
			]
		});
	},
	onConfirmDelete:function(value) {
		if(value == "DELETE") {
			var m = LBB.Model.getInstance();
			m.remove(this.model);
			
			this.saveAndExit();
		}
	},
	onCancel:function(event) {
		event.stopPropagation();
		
		this.controller.stageController.popScene();
	},
	onView:function(event) {
		// pushScene keeps it within app so back gesture works as expected
		this.controller.stageController.pushScene(
			{ appId :'com.palm.app.contacts', name: 'detail' },
			{ personId: this.model.id }
		);
	},
	onSave:function(event) {
	
		event.stopPropagation();
		this.saveAndExit();
	},
	saveAndExit:function()
	{
		var m = LBB.Model.getInstance();
		m.modified = true
		m.save();

		this.controller.stageController.popScene();
	},
	initAttributes:function(type) {
		var autoEntry = {label:'', value:Mojo.Widget.QuickContact.SelectAuto, text:$L("Auto Select"), type:type, icon:'',checked:(this.model.qc.selections[type] == Mojo.Widget.QuickContact.SelectAuto) ? "CHECKED" : ""}
		var noneEntry = {label:'', value:Mojo.Widget.QuickContact.SelectNone, text:$L("No Selection"), type:type, icon:'',checked:(this.model.qc.selections[type] == Mojo.Widget.QuickContact.SelectNone) ? "CHECKED" : ""}
		return [autoEntry, noneEntry]; 
	},
	setupLists:function()
	{
		var phoneAttributes = this.initAttributes("phone");
		var smsAttributes = this.initAttributes("sms");
		var imAttributes = this.initAttributes("im");
		var emailAttributes = this.initAttributes("email");
		
		// Phone and SMS
		if(this.model.phoneNumbers) {
			for(var i=0;i<this.model.phoneNumbers.length;i++) {
				phoneAttributes.push(this.getContactPointAttributes(this.model.phoneNumbers[i], "phone", true));
				smsAttributes.push(this.getContactPointAttributes(this.model.phoneNumbers[i], "sms", true));
			}
		}
			
		// IM
		if(this.model.imNames) {
			for(var i=0;i<this.model.imNames.length;i++) {
				imAttributes.push(this.getContactPointAttributes(this.model.imNames[i], "im"));
			}
		}

		// Email
		if(this.model.emailAddresses) {
			for(var i=0;i<this.model.emailAddresses.length;i++) {
				emailAttributes.push(this.getContactPointAttributes(this.model.emailAddresses[i], "email"));
			}
		}

		this.setupList('phone', phoneAttributes);
		this.setupList('sms', smsAttributes);
		this.setupList('im', imAttributes);
		this.setupList('email', emailAttributes);
	},
	getContactPointAttributes:function(cp, type, useHome) {
		var labels = [(useHome) ? $L("Home") : $L("Personal"), $L("Work"), $L("Other"), $L("Mobile"), $L("Pager"), $L("Personal Fax"), $L("Work Fax"), $L("Main"), $L("SIM")];
		
		var l = (cp.label == 2 && cp.customLabel) ? cp.customLabel : labels[cp.label];
		return {
			label:(cp.serviceName) ? "" : l,	// skip label when there's an icon
			value:cp.id,
			text:cp.value,
			type:type,
			checked:(this.model.qc.selections[type] == cp.id) ? "CHECKED" : "",
			icon:(cp.serviceName) ? "images/icons/" + cp.serviceName + ".png" : ''};
	},
	setupList:function(type,attr) {
		//Mojo.Log.info("> EditContactAssistant.setupList");
		
		this.controller.setupWidget(type+'Drawer',
	    {
            modelProperty: 'open',
            unstyled: true
        },
        {
            open: false
        });
	        	       
	    if(attr.length > 2) {
	    	// TODO: refactor this to use a declared function instead of anonymous function so it can be "un
		    this.controller.listen($(type+'Wrapper'), Mojo.Event.tap, function() { $(type+'Drawer').mojo.toggleState(); });
		
			var idBase = 'contact-method-'+type+'-';
			var content = [];
			for(var i=0;i<attr.length;i++) {
				attr[i].id = idBase+i;
				
				// if current row is checked, set display text appropriately
				if(attr[i].checked != "") {
					$(type+"Details").update(attr[i].text);
				}
				
				// generate content for row
				content.push(Mojo.View.render({"template":"edit-contact/contact-method-row", attributes:attr[i]}));
		    }
		    
		    $(type+'Drawer').update(content.join(""));
		    
		    for(var i=0;i<attr.length;i++) {
		    	// TODO: determine way to "unlisten" these as well
				this.controller.listen($(idBase+i), Mojo.Event.tap, this.handlers.onChange);
		    }
		} else {
			$(type+"Details").update($L("None Available"));
		}
	},
	setupButton:function(name, model, handler) {
		this.controller.setupWidget(name, {}, model);
		this.controller.listen($(name), Mojo.Event.tap, handler);
	}
});

