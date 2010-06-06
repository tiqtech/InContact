var EditContactAssistant = Class.create(
{
	initialize:function(model) {
		this.model = model;
	},
	setup:function() {
		Mojo.Log.info("> EditContactAssistant.setup");
		
		this.setupLists();
		
		$('edit_contact_name').innerText = this.safeString(this.model.firstName) + " " + this.safeString(this.model.lastName);
		
		this.setupButton('saveButton', {buttonLabel:"Save",buttonClass:"affirmative"}, this.onSave);
		this.setupButton('cancelButton', {buttonLabel:"Cancel",buttonClass:"secondary"}, this.onCancel);
		this.setupButton('deleteButton', {buttonLabel:"Delete",buttonClass:"negative"}, this.onDelete);
	},
	safeString:function(s) {
		return (s) ? s : "";
	},
	activate:function(event) {
		
	},
	deactivate:function(event) {

	},
	onChange:function(event) {

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
	initAttributes:function(modelProperty) {
		var defaultAttributes = {choices:[{label:"Auto",value:Mojo.Widget.QuickContact.SelectAuto},{label:"None",value:Mojo.Widget.QuickContact.SelectNone}]};
		var p = Object.toJSON(defaultAttributes).evalJSON();
		p.modelProperty = modelProperty;
		
		return p;
	},
	setupLists:function()
	{
		var phoneNumberTypes = ['H', 'W', 'O', 'M', 'C', '?', 'F'];
		
		var phoneAttributes = this.initAttributes("phone");
		var smsAttributes = this.initAttributes("sms");
		var imAttributes = this.initAttributes("im");
		var emailAttributes = this.initAttributes("email");
		
		// Phone and SMS
		if(this.model.phoneNumbers) {
			for(var i=0;i<this.model.phoneNumbers.length;i++) {
				var label = this.model.phoneNumbers[i].value + ' (' + phoneNumberTypes[this.model.phoneNumbers[i].label] + ')';
				phoneAttributes.choices.push({label:label, value:this.model.phoneNumbers[i].value});
				smsAttributes.choices.push({label:label, value:this.model.phoneNumbers[i].value});
			}
		} else {
			this.disableList(phoneAttributes);
			this.disableList(smsAttributes);
		}
			
		// IM
		if(this.model.imNames) {
			for(var i=0;i<this.model.imNames.length;i++) {
				var id = this.model.imNames[i].value + "@" + this.model.imNames[i].serviceName;
				imAttributes.choices.push({label:id, value:this.model.imNames[i].id});
			}
		} else {
			this.disableList(imAttributes);
		}

		// Email
		if(this.model.emailAddresses) {
			for(var i=0;i<this.model.emailAddresses.length;i++) {
				emailAttributes.choices.push({label:this.model.emailAddresses[i].value, value:this.model.emailAddresses[i].value});
			}
		} else {
			this.disableList(emailAttributes);
		}

		this.setupList('phone', phoneAttributes);
		this.setupList('sms', smsAttributes);
		this.setupList('im', imAttributes);
		this.setupList('email', emailAttributes);
	},
	setupList:function(type, attr) {
		var m;
		var id = type+"List";
		if(attr.disabled) {
			 m = {disabled:true};
			 m[type] = Mojo.Widget.QuickContact.SelectNone;
		} else {
			m = this.model.qc.selections;
			this.controller.listen($(id), Mojo.Event.propertyChange, this.onChange.bind(this));
		}
		
		this.controller.setupWidget(id, attr, m);
	},
	setupButton:function(name, model, handler) {
		this.controller.setupWidget(name, {}, model);
		this.controller.listen($(name), Mojo.Event.tap, handler.bind(this));
	},
	disableList:function(attr) {
		attr.choices.splice(0, 1);
		attr.disabled = true;
	}
});

