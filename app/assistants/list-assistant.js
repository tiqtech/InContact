var ListAssistant = Class.create(
{
	initialize:function() {
		this.selected = null;
		this.contactModel = LBB.Model.getInstance();
	},
	setup:function() {

		this.controller.setupWidget("list",
			{
				itemTemplate: "list/item-template",
				swipeToDelete: true,
				reorderable: true,
				emptyTemplate:"list/empty-template",
				itemsCallback:this.loadContacts.bind(this),
				listTitle: "Contacts",
				fixedHeightItems: true
			},
			{}
		);
		
		LBB.Util.setupCommandMenu(this.controller, 'list', false);
		
		this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, LBB.Util.appMenuModel);

		this.controller.listen($('list'), Mojo.Event.listReorder, this.onReorder.bind(this));
		this.controller.listen($('list'), Mojo.Event.listDelete, this.onDelete.bind(this));
		this.controller.listen($('list'), Mojo.Event.listTap, this.onSelect.bind(this));
		this.controller.watchModel(this.contactModel, this, this.handleModelChanged.bind(this));
		
		//Mojo.Log.info("< ListAssistant.setup");
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
		for(var i=offset;i<(count+offset) && i<this.contactModel.contacts.length;i++)
		{
			var id = "ql_" + this.contactModel.contacts[i].id
			c.push(this.contactModel.contacts[i]);
			this.controller.setupWidget(id, {container:'list'}, this.contactModel.contacts[i]);
		}
		
		widget.mojo.noticeAddedItems(offset, c);
	},
	onReorder:function(event)
	{
		//Mojo.Log.info("> ListAssistant.onReorder");
		
		this.contactModel.contacts.splice(event.fromIndex, 1);
		this.contactModel.contacts.splice(event.toIndex, 0, event.item);
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
		
		this.selected = $("ql_"+event.item.id);
		this.selected.mojo.select(true);
		
		LBB.Util.enableEditMenu(this.controller, true);
	},
	onContactSelected:function(contact)
	{
		this.contactModel.contacts.push(contact);
		this.loadContacts($("list"), this.contactModel.contacts.length-1, 1)
		
		this.markModified();
	},
	markModified:function()
	{	
		// passing flag back to grid scene since modelChanged doesn't work across scenes?
		//this.contactModel.modified=true;
		
		//this.controller.modelChanged(this.contactModel, this);
		LBB.Model.save();
	}
});

