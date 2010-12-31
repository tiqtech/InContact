var _EditContactAssistantBase = {
	ACTIONS:{
		phone:{label:$L("Phone"),action:"phone"},
		sms:{label:$L("SMS"),action:"sms"},
		im:{label:$L("IM"),action:"im"},
		email:{label:$L("Email"),action:"email"}
	},
	ICONS:[
		{value:'phone'},
		{value:'phone2'},
		{value:'phone3'},
		{value:'txt'},
		{value:'sms2'},
		{value:'sms3'},
		{value:'im'},
		{value:'im2'},
		{value:'im3'},
		{value:'email'},
		{value:'email2'},
		{value:'email3'},
		{value:'home'},
		{value:'briefcase'},
		{value:'factory'},
		{value:'star'},
		{value:'bulb'},
		{value:'cross'}
	],
	areActionsReorderable:false,
	initialize:function(model) {
		this.model = model;
		this.handlers = new HandlerManager(this);
	},
	setup:function() {
		LBB.Util.log("> EditContactAssistant.setup");
		
		// add incontact or incontactplus as a class name in order to hide selectors for free version
		this.controller.get('mojo-scene-edit-contact').addClassName(Mojo.appInfo.id.substring(Mojo.appInfo.id.lastIndexOf(".")+1));

		var s = this.model.qc.selections;
		this.buttonModel = [s['0'],s['1'],s['2'],s['3']];
		
		var formatters = {
			"label":function(value, model) {
				if(this.ACTIONS[model.action]) {
					model.label = this.ACTIONS[model.action].label;
				}
			}.bind(this),
			"text":function(value, model) {
				if(!model.details) {
					model.text = $L("None Available");
				} else if(model.details == Mojo.Widget.QuickContact.SelectNone) {
					model.text = $L("No Selection");
				} else {
					model.text = Mojo.Widget.QuickContact.getPreference(this.model, model.index).value;
				}
			}.bind(this),
			"showSelector":function(value, model) {
				if(!model.action) return;
				
				var list = Mojo.Widget.QuickContact.ActionMap[model.action].list;
				model.showSelector = (this.model[list]) ? "" : "hidden";
			}.bind(this)
		}
		
		this.controller.setupWidget("updateContactSpinner", {spinnerSize:Mojo.Widget.spinnerLarge}, {});
		
		this.controller.setupWidget('contactPointList', {
				itemTemplate: "edit-contact/button-row",
				swipeToDelete: false,
				reorderable: this.areActionsReorderable,
				fixedHeightItems: true,
				hasNoWidgets:true,
				formatters:formatters,
				onItemRendered:this.handlers.onItemRendered
			},{
				items:this.buttonModel
			}
		);
		
		this.updateIcons();
		
		this.controller.get('edit-contact-name').update(Mojo.Widget.QuickContact.formatContactName(null, this.model));
		this.controller.get('edit-contact-photo').style.backgroundImage = "url(" + this.model.qc.largePhoto + ")";
		
		this.controller.watchModel(this.buttonModel, this, this.handlers.onModelChanged);
		
		this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, {items:[{label: $L("Update"),command: "update"}]});		
	},
	activate:function(event) {
		LBB.Util.log("> EditContactAssistant.activate");

		$(this.controller.get("updateContactScrim")).hide();		
		this.controller.get("updateContactSpinner").mojo.stop();
		
		if (event) {
			if(event.personId) {
				// webOS 1.x
				LBB.Util.log("adding contact",event.details.record.id);
				this.onContactSelected(event.details.record);
			} else if(event._id) {
				// webOS 2.x
				LBB.Util.log("adding contact",event._id);
				var c = LBB.Util.convertContact(event);
				this.onContactSelected(c);
			}
		}
		
		this.controller.listen(this.controller.get("updateContactLink"), Mojo.Event.tap, this.handlers.onUpdateContact);
	},
	deactivate:function(event) {
		this.controller.stopListening(this.controller.get("updateContactLink"), Mojo.Event.tap, this.handlers.onUpdateContact);
	},
	cleanup:function() {
		for(var i=0;i<4;i++) {
			this.controller.stopListening(this.controller.get("edit-contact-details-wrapper-"+i), Mojo.Event.tap, this.handlers.onDetailsTap);
		}
		
		this.handlers.release();
	},
	safeString:function(s) {
		return (s) ? s : "";
	},
	updateIcons:function() {
		for(var i=0;i<this.buttonModel.length;i++) {
			var item = this.buttonModel[i];
			item.index = i;
			
			var bg = {"backgroundImage":"url(images/"+item.icon+".png)"};
			this.controller.get("edit-contact-header-icon-"+i).setStyle(bg);
		}
	},
	resolveNode:function(event) {
		var list = this.controller.get('contactPointList');
		var item = list.mojo.getItemByNode(event.currentTarget);
		
		// shouldn't hit this but testing to be safe
		if(!item) return;
		
		this.selectedIconIndex = item.index;
		var node = list.mojo.getNodeByIndex(item.index);
		event.stopPropagation();
		
		return {node:node, model:item};
	},
	onUpdateContact:function(command) {
		LBB.Util.log("> onUpdateContact");
		var prefs = LBB.Preferences.getInstance();
		var msg = prefs.getProperty("hideUpdateContactMessage");
		
		if(command === "ok" || msg == true) {
			if(msg != true) {
				LBB.Util.log("updating preference");
				prefs.setProperty("hideUpdateContactMessage", true);
			}
			
			this.controller.get("updateContactSpinner").mojo.start();
			$(this.controller.get("updateContactScrim")).show();
			
			LBB.Util.log("pushing people picker");
			this.controller.stageController.pushScene(
			  { appId :'com.palm.app.contacts', name: 'list' },
			  { mode: 'picker', message: $L("Updating") + " " + Mojo.Widget.QuickContact.formatContactName(null, this.model)}
			 );	
		} else {
			LBB.Util.log("showing info dialog");
			this.controller.showAlertDialog({
			    onChoose: this.handlers.onUpdateContact,
			    title: $L("Update Contact"),
			    message: $L("Please select the desired contact on the next screen and its information will be updated."),
			    choices:[
			        {label:$L("OK"), value:"ok", type:'affirmative'}    
			    ]
			});
		}
	},
	handleCommand:function(event) {
		if (event.type === Mojo.Event.command && event.command === "update") {
			this.onUpdateContact();
			event.stopPropagation();
		}
	},
	onContactSelected:function(details) {
		LBB.Util.log("> EditContactAssitant.onContactSelected");
		
		var pages = LBB.Model.getInstance().getPages();
		for(var i=0;i<pages.length;i++) {
			var c = pages[i].findContactById(this.model.id);
			if(c.contact) {
				Mojo.Widget.QuickContact.merge(c.contact, details);
			}
		}
		
		// set the modified flag so main will save and reload QC widgets
		LBB.Model.getInstance().modified = true;
		
		Mojo.Log.info("photo=",this.model.qc.largePhoto);
		
		this.controller.get('edit-contact-name').update(Mojo.Widget.QuickContact.formatContactName(null, this.model));
		this.controller.get('edit-contact-photo').style.backgroundImage = "url(" + this.model.qc.largePhoto + ")";
	},
	onItemRendered:function(listWidget, itemModel, itemNode) {
		var i = itemModel.index;
		this.controller.listen(this.controller.get("edit-contact-details-wrapper-"+i), Mojo.Event.tap, this.handlers.onDetailsTap);
	},
	onModelChanged:function() {
		LBB.Util.log("> EditContactAssistant.onModelChanged");
		
		this.updateIcons();
		
		for(var i=0;i<this.buttonModel.length;i++) {
			this.model.qc.selections[i.toString()] = {
				'icon':this.buttonModel[i].icon,
				'index':this.buttonModel[i].index,
				'action':this.buttonModel[i].action,
				'details':this.buttonModel[i].details
			};
		}
		
		LBB.Model.save();
		
		if(!this.listAction) {
			this.controller.get('contactPointList').mojo.invalidateItems(0);			
		}
		
		// clear flag
		this.listAction = false;
	},
	onView:function(event) {
		// pushScene keeps it within app so back gesture works as expected
		this.controller.stageController.pushScene(
			{ appId :'com.palm.app.contacts', name: 'detail' },
			{ personId: this.model.id }
		);
	},	
	onDetailsTap:function(event) {
		var n = this.resolveNode(event);
		if(!n) return;
		
		var items = [];
		var list = this.model[Mojo.Widget.QuickContact.ActionMap[n.model.action].list];
		
		if(!list) return;
		
		items.push({label:this.ACTIONS[n.model.action].label})
		items.push({
			label:$L("No Selection"),
			command:Mojo.Widget.QuickContact.SelectNone
		});
		
		for(var i=0;i<list.length;i++) {
			items.push({
				label:list[i].value,
				command:list[i].id,
				iconPath:(list[i].serviceName) ? "images/icons/" + list[i].serviceName + ".png" : undefined
			});
		}
		
		this.controller.popupSubmenu({
			onChoose:function(id) {
				// if id is undefined here, then scrim was tapped
				if (id) {
					this.buttonModel[this.selectedIconIndex].details = id;
					this.controller.modelChanged(this.buttonModel);
				}
			},
			items:items
		});
	}
};

var EditContactAssistantBase = Class.create(_EditContactAssistantBase);