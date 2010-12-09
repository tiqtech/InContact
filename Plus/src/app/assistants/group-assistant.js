// model = {
//	id:new Date().getTime(),
//	name:"",
//	photo:"",
//	type:"group",
//	members:[
//		{
//			name:"",
//			email:"",
//			sms:"",
//			contact:{contact}
//		}, ...
//	]
// }

var _GroupAssistant = {
	initialize:function(model, params) {
		this.handlers = new HandlerManager(this);
		
		if(model) {
			this.newGroup = false;
			this.model = model;
		} else {
			this.newGroup = true;
			this.model = {
				id:new Date().getTime(),
				name:"New Group",
				members:[],
				photo:"",
				type:"group"
			};
		}
		
		if(params) {
			this.callback = params.callback;
		}
	},
	setup: function() {
		this.controller.get('group-title').update($L("Email/SMS Group"));
		this.controller.get('group-members-title').update($L("Members"));
		
		this.controller.setupWidget('group-name-field', {textCase:Mojo.Widget.steModeTitleCase,modelProperty:"name"},this.model)
		this.controller.setupWidget('group-members-list', {itemTemplate:"group/member-item",addItemLabel:$L("Add Member ..."),swipeToDelete:true,reorderable:false,itemsProperty:"members"}, this.model);
		
		this.controller.setupWidget('ok-button', {}, {label:(this.newGroup) ? $L("Add Group") : $L("Save"),buttonClass:"affirmative"});
		this.controller.setupWidget('cancel-button', {}, {label:$L("Cancel"),buttonClass:"secondary"});
		
		this.displayPhoto();
	},
	activate:function(event) {
		this.controller.listen(this.controller.get('group-members-list'), Mojo.Event.listAdd, this.handlers.onAddMember);
		this.controller.listen(this.controller.get('group-members-list'), Mojo.Event.listTap, this.handlers.onEditMember);
		this.controller.listen(this.controller.get('ok-button'), Mojo.Event.tap, this.handlers.onSaveGroup);
		this.controller.listen(this.controller.get('cancel-button'), Mojo.Event.tap, this.handlers.onCancel);
		this.controller.listen(this.controller.get('group-photo'), Mojo.Event.tap, this.handlers.onPhotoTap);
		
		if(event && event.personId) {
			this.addSelectedContact(event.details.record);
		}
	},
	deactivate:function() {
		this.controller.stopListening(this.controller.get('group-members-list'), Mojo.Event.listAdd, this.handlers.onAddMember);
		this.controller.stopListening(this.controller.get('group-members-list'), Mojo.Event.listTap, this.handlers.onEditMember);
		this.controller.stopListening(this.controller.get('ok-button'), Mojo.Event.tap, this.handlers.onSaveGroup);
		this.controller.stopListening(this.controller.get('cancel-button'), Mojo.Event.tap, this.handlers.onCancel);
		this.controller.stopListening(this.controller.get('group-photo'), Mojo.Event.tap, this.handlers.onPhotoTap);		
	},
	cleanup:function() {
		this.handlers.release();
	},
	handleCommand:function(event) {
		if (event.type == Mojo.Event.back) {
			// default action on back swipe should be "save"
			this.onSaveGroup(event);
		}
	},
	onAddMember:function(event) {
		this.controller.popupSubmenu({
			onChoose:this.handlers.onSelectSource,
			placeNear:event.currentTarget,
			items: [/*{label:$L("From InContact"),command:"incontact"},*/{label:$L("From Contacts"),command:"contacts"},{label:$L("Manually"),command:"manual"}]
		});
	},
	onEditMember:function(event) {
		this.showDialog(event.item, "edit");
		event.stopPropagation();
	},
	onSelectSource:function(command) {
		switch(command) {
			case "incontact":
				// not implemented ...
				break;
			case "contacts":
				this.controller.stageController.pushScene(
					{ appId :'com.palm.app.contacts', name: 'list' },
					{ mode: 'picker', message: $L("Select a Contact")}
				);
				break;
			case "manual":
				this.showDialog(undefined, "create");
				break;
		}
	},
	onPhotoTap:function(event) {
		var items = [{label:$L("Select Photo"),command:"from-phone"},{label:$L("Use Member Photo"),command:"from-members"}]
		if(this.model.photo.length > 0) {
			items.push({label:$L("Remove Photo"),command:"remove"});
		}
		
		this.controller.popupSubmenu({
			onChoose:this.handlers.onPhotoTapAction,
			placeNear:event.currentTarget,
			items: items
		});
	},
	onPhotoTapAction:function(command) {
		var params = {
			actionType:'select',
			kinds:['image'],
		    defaultKind: 'image',
		    onSelect: this.handlers.onSelectPhoto
		}
		
		switch (command) {
			case "from-phone":
				Mojo.FilePicker.pickFile(params, this.controller.stageController);
				break;
			case "from-member":
				break;
			case "remove":
				this.model.photo = "";
				this.displayPhoto();
				break;
		}
	},
	onSelectPhoto:function(data) {
		this.model.photo = data.fullPath;
		this.displayPhoto();
	},
	onSaveGroup:function(event) {
		if(this.callback) {
			this.callback(this.model, this.newGroup);
		}
		
		this.onCancel();
	},
	onCancel:function(event) {
		this.controller.stageController.popScene();
	},
	addMember:function(contact) {
		Mojo.Log.info("> GroupAssistant.addMember")
		if(contact) {
			this.model.members.push(contact);
			this.controller.get('group-members-list').mojo.noticeAddedItems(0, [contact]);
		}
	},
	invalidateMemberList:function() {
		this.controller.get('group-members-list').mojo.invalidateItems(0);
	},
	displayPhoto:function() {
		var photo;
		
		if(this.model.photo.length == 0) {
			photo = "inherit"
		} else {
			var size = 60;
			photo = "url(/var/luna/data/extractfs" + encodeURIComponent(this.model.photo) + ":0:0:"+size+":"+size+":4)";			
		}
		
		$(this.controller.get("group-photo")).setStyle({backgroundImage:photo})
	},
	showDialog:function(contact, mode) {
		LBB.Util.log("> GroupAssistant.showDialog");
		
		if(!contact) {
			contact = this.getNewMember();
			mode = "create";
		}
		
		this.controller.showDialog({
    		"template":"dialogs/group-member",
    		"assistant": new MemberDialogAssistant(this, contact, mode)
    	});
	},
	getNewMember:function() {
		return {"name":"","email":"","sms":""};
	},
	addSelectedContact:function(contact) {
		LBB.Util.log("> GroupAssistant.editSelectedContact");
		
		var model = this.getNewMember();
		model.name = Mojo.Widget.QuickContact.formatContactName(null, contact);
		model.contact = contact;
		
		this.showDialog(model, "create");
	}
}


var _MemberDialogAssistant = {
	initialize:function(caller, model, mode) {
		LBB.Util.log("> MemberDialogAssistant.initialize");
		
		this.caller = caller;
		this.originalModel = model;
		this.handlers = new HandlerManager(this);
		this.model = Object.extend({}, model); // copying object so I can cancel changes
		this.mode = (mode) ? mode : "create"; 
	},
	setup:function(widget) {
		LBB.Util.log("> MemberDialogAssistant.setup");
		this.widget = widget;

		this.caller.controller.setupWidget('group-member-name-field', {modelProperty:"name"}, this.model);
		
		if(this.model.contact) {
			this.caller.controller.setupWidget('group-member-email-list', {label:"Email",modelProperty:"email",choices:this.getChoices(this.model.contact.emailAddresses)}, this.model);
			this.caller.controller.setupWidget('group-member-sms-list', {label:"SMS",modelProperty:"sms",choices:this.getChoices(this.model.contact.phoneNumbers)}, this.model);
			this.disableFields('group-member-email-field-row','group-member-sms-field-row');
		} else {
			this.caller.controller.setupWidget('group-member-email-field', {modelProperty:"email"}, this.model);
			this.caller.controller.setupWidget('group-member-sms-field', {modelProperty:"sms"}, this.model);
			this.disableFields('group-member-email-list-row','group-member-sms-list-row');	
		}
		
		this.caller.controller.setupWidget('okButton', {}, {label:$L("OK"),buttonClass:"affirmative"});
		this.caller.controller.setupWidget('cancelButton', {}, {label:$L("Cancel"),buttonClass:"secondary"}); 
	},
	activate:function() {
		this.caller.controller.listen(this.caller.controller.get('okButton'), Mojo.Event.tap, this.handlers.onOk);
		this.caller.controller.listen(this.caller.controller.get('cancelButton'), Mojo.Event.tap, this.handlers.onExit);
	},
	deactivate:function() {
		this.caller.controller.stopListening(this.caller.controller.get('okButton'), Mojo.Event.tap, this.handlers.onOk);
		this.caller.controller.stopListening(this.caller.controller.get('cancelButton'), Mojo.Event.tap, this.handlers.onExit);
	},
	cleanup:function() {
		this.handlers.release();
	},
	onOk:function() {
		if (this.mode === "create") {
			this.caller.addMember(this.model);
		} else {
			// copy props back onto model
			Object.extend(this.originalModel, this.model);
		}
		
		this.caller.invalidateMemberList();
		
		this.onExit();
	},
	onExit:function(event) {
		this.widget.mojo.close();
	},
	disableFields:function() {
		for(var i=0;i<arguments.length;i++) {
			var c = this.caller.controller.get(arguments[i]);
			c.hide();
		}
	},
	getChoices:function(list) {
		var choices = [];
		if (list && list.length > 0) {
			choices.push({
				label:$L("No Selection"),
				value:""
			});
			
			for (var i = 0; i < list.length; i++) {
				choices.push({
					label: list[i].value,
					value: list[i].value
				});
			}
		} else {
			choices.push({
				label:$L("None Available"),
				value:""
			});
		}
		
		return choices;
	}
};

var GroupAssistant = Class.create(_GroupAssistant);
var MemberDialogAssistant = Class.create(_MemberDialogAssistant);
