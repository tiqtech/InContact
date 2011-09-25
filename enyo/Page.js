var _Page = {
	name:"InContactPage",
	kind:"Scroller",
	autoHorizontal: false,
	horizontal: false,
	style:"overflow:hidden",
	className:"page",
	components:[
	    {kind:"BasicScroller", name:"scroller", onclick:"pageClicked", components:[
            {kind:"InContact.ReorderableGrid", name:"grid", cellHeight:150, cellWidth:150, margin:10, onReorder:"contactsReordered"}
        ]},
        {name:"contacts", kind:"InContact.Contacts"}
	],
	published:{
		contacts:[],
		selectedContact:null,
		height:0,
		width:0
	},
	create:function() {
		this.inherited(arguments);
		
		this.contactsChanged();
	},
	pageClicked:function() {
		this.clearSelection()
	},
	contactsChanged:function(oldContacts) {
		if(!this.contacts || this.contacts.length === 0) return;
		
		var kinds = [];
		for(var i=0;i<this.contacts.length;i++) {
			var name = "qc"+this.contacts[i].id
			var c = this.mergeContact(this.contacts[i]);
			if(!c) continue;
			
			kinds.push({kind:"QuickContact",onclick:"contactClicked",owner:this, name: name, contact:c});
		}
		
		this.$.grid.createComponents(kinds);		
	},
	mergeContact:function(c) {
		var contact = this.$.contacts.get(c.id);
		return enyo.mixin({qc:c}, contact);
	},
	clearSelection:function(sender) {
		this.getSelectedContact().setSelected(false);
	},
	contactClicked:function(sender, event) {
		this.setSelectedContact(sender);
		event.stopPropagation();
	},
	selectedContactChanged:function(oldContact) {
		if(oldContact) {
			oldContact.setSelected(false);
		}
		
		if (this.selectedContact) {
			this.selectedContact.setSelected(true);
		}
	},
	clickHandler:function(sender) {
		// the inner client of the scroller is the sender so instead of 
		// sender === this, we have to check sender.owner === this
		if(sender.owner === this) {
			this.setSelectedContact(null);
		}
	},
	onDragContact:function(sender, event) {
		this.log("dragging",sender);
		
		event.handled = true;
	},
	contactsReordered:function(source, fromIndex, toIndex) {
		var c = this.contacts.splice(fromIndex, 1)[0];
		this.contacts.splice(toIndex, 0, c);

		// TODO save reordering
	},
	resizeHandler:function() {
		this.inherited(arguments);
		
		var dim = enyo.fetchControlSize(this);
		
		// calculate grid/QC size
		var o = enyo.getWindowOrientation();
		var rowCount = (o === "left" || o === "right") ? 4 : 6;
		var size = dim.w/rowCount;
		
		// resize scroller
		this.$.scroller.applyStyle("height", dim.h + "px");
		this.$.scroller.applyStyle("width", dim.w + "px");
		
		// resize contact components
		var qcSize = size-10 + "px";
		enyo.forEach(this.$.grid.getControls(), function(item) {
			item.applyStyle("height", qcSize);
			item.applyStyle("width", qcSize);
		}, this);
		
		// update grid size
		this.$.grid.setCellWidth(size);
		this.$.grid.setCellHeight(size);
	}
}

enyo.kind(_Page);
