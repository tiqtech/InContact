var _ListAssistant = {
	initialize:function(model, prefs) {
	
		LBB.Model = model;
		LBB.Preferences = prefs;
		
		this.selected = null;
		this.contactModel = LBB.Model.getInstance();
		this.handlers = new HandlerManager(this, ["onReorder","onDelete","onSelect","handleModelChanged"]);
	},
	setup:function() {

		LBB.Util.loadTheme(this.controller);

		this.controller.setupWidget("list",
			{
				itemTemplate: "list/item-template",
				swipeToDelete: true,
				reorderable: true,
				emptyTemplate:"list/empty-template",
				itemsCallback:this.loadContacts.bind(this),
				listTitle: $L("Contacts"),
				fixedHeightItems: true
			},
			{}
		);
		
		LBB.Util.setupCommandMenu(this.controller, 'list', false);
		
		this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, LBB.Util.getAppMenuModel("list"));

		this.controller.listen(this.controller.get('list'), Mojo.Event.listReorder, this.handlers.onReorder);
		this.controller.listen(this.controller.get('list'), Mojo.Event.listDelete, this.handlers.onDelete);
		this.controller.listen(this.controller.get('list'), Mojo.Event.listTap, this.handlers.onSelect);
		this.controller.watchModel(this.contactModel, this, this.handlers.handleModelChanged);
		
		this.controller.get('list_admob').insert($L('Loading advertisement'));
		this.controller.get('list-no-contacts').insert($L('No Contacts'));
		//Mojo.Log.info("< ListAssistant.setup");
	},
	cleanup:function() {
	
		this.controller.listen(this.controller.get('list'), Mojo.Event.listReorder, this.handlers.onReorder);
		this.controller.listen(this.controller.get('list'), Mojo.Event.listDelete, this.handlers.onDelete);
		this.controller.listen(this.controller.get('list'), Mojo.Event.listTap, this.handlers.onSelect);
		this.controller.watchModel(this.contactModel, this, this.handlers.handleModelChanged);
	},
	activate:function(event) {
		if(event && event.personId)
		{
			this.onContactSelected(event.details.record);
		}
		
		LBB.Util.displayAd("list_admob", this);
	},
	handleModelChanged:function(contact)
	{
		//Mojo.Log.info("> MainAssistant.handleModelChanged");
	
		LBB.Model.save();
	},
	loadContacts:function(widget, offset, count)
	{
		//Mojo.Log.info("> ListAssistant.loadContacts");
		
		var c = [];
		for(var i=offset;i<(count+offset) && i<this.contactModel.getContacts().length;i++)
		{
			var id = "ql_" + this.contactModel.getContacts()[i].id
			c.push(this.contactModel.getContacts()[i]);
			this.controller.setupWidget(id, {container:'list'}, this.contactModel.getContacts()[i]);
		}
		
		widget.mojo.noticeAddedItems(offset, c);
	},
	onReorder:function(event)
	{
		//Mojo.Log.info("> ListAssistant.onReorder");
		
		this.contactModel.getContacts().splice(event.fromIndex, 1);
		this.contactModel.getContacts().splice(event.toIndex, 0, event.item);
		this.markModified();
	},
	onDelete:function(event)
	{
		//Mojo.Log.info("> ListAssistant.onDelete");
	
		var m = LBB.Model.getInstance();
		m.remove(event.item);

		this.markModified();
	},
	onSelect:function(event)
	{
		if(this.selected != null) this.selected.mojo.select(false);
		
		this.selected = this.controller.get("ql_"+event.item.id);
		this.selected.mojo.select(true);
		
		LBB.Util.enableEditMenu(this.controller, true);
	},
	onContactSelected:function(contact)
	{
		this.contactModel.getContacts().push(contact);
		this.loadContacts(this.controller.get("list"), this.contactModel.getContacts().length-1, 1)
		
		this.markModified();
	},
	markModified:function()
	{	
		// passing flag back to grid scene since modelChanged doesn't work across scenes?
		//this.contactModel.modified=true;
		
		//this.controller.modelChanged(this.contactModel, this);
		LBB.Model.save();
	}
};

var ListAssistant = Class.create(_ListAssistant);