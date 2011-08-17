var _Page = {
	name:"InContactPage",
	kind:"Scroller",
	autoHorizontal: false,
	horizontal: false,
	onclick: "clearSelection",
	className:"page",
	components:[
	],
	published:{
		contacts:[],
		selectedContact:null,
		height:0,
		width:0
	},
	create:function() {
		this.inherited(arguments);
		
		this.applyStyle("height", (document.body.offsetHeight-6)+"px")
		this.applyStyle("overflow", "hidden")
		
		this.contactsChanged();
		this.heightChanged();
		this.widthChanged();
	},
	contactsChanged:function(oldContacts) {
		if(!this.contacts || this.contacts.length === 0) return;
		
		var kinds = [];
		for(var i=0;i<this.contacts.length;i++) {
			var name = "qc"+this.contacts[i].id
			if (!this.$[name]) {
				kinds.push({name: name});
			}
		}
		
		this.createComponents(kinds, {kind:"QuickContact",onclick:"onTapContact",owner:this,onmousehold:"onDragContact"});
		
		for(var i=0;i<kinds.length;i++) {
			var c = this.contacts[i];
			this.$[kinds[i].name].setContact(c);
		}
		
		this.layoutContacts();
		
		var dim = this.getLayoutDimensions();
		this.setHeight((Math.ceil(this.contacts.length/dim.perRow)*dim.size)+dim.offsetTop);
	},
	layoutContacts:function() {
		var dim = this.getLayoutDimensions();
		
		var size = dim.size - (dim.padding*2);
		
		for(var i=0;i<this.contacts.length;i++) {
			var qc = this.$["qc"+this.contacts[i].id];
			
			var top = dim.padding + (Math.floor(i/dim.perRow)*dim.size) + dim.offsetTop;
		    var left = dim.padding + ((i%dim.perRow)*dim.size) + dim.offsetLeft;
		    
			qc.setTop(top);
			qc.setLeft(left);
			qc.setSize(size);
		}
	},
	getLayoutDimensions:function(forceRefresh) {
		if(forceRefresh || !this.layoutDimensions) {
			// handles driving/normal modes
			//var aa = Mojo.Controller.getAppController().assistant;
			var minWidth = 90;
			
			var perRow = 0;
			var margin = 6;
			var width;
			
			var scrollerWidth = window.innerWidth - margin;
			
			// find appropriate size
			do {
				width = Math.floor(scrollerWidth/++perRow);
			} while(width > minWidth);
			
			// backup one step because loop goes 1 too far before exiting
			width = Math.floor(scrollerWidth/--perRow);
			
			this.layoutDimensions = {
				offsetTop:50,
				offsetLeft:0,
				perRow:perRow,
				size:width,
				padding:5
			};
		}
		
		return this.layoutDimensions;
	},
	clearSelection:function(sender) {
		this.log("enter");
		this.setSelected(false);
	},
	onTapContact:function(sender) {
		this.setSelectedContact(sender);
	},
	setHeight:function(newHeight) {
		var h = this.height;
		this.height = (newHeight < document.body.offsetHeight) ? document.body.offsetHeight : newHeight;
		this.heightChanged(h);
	},
	heightChanged:function(oldHeight) {
		if(oldHeight === this.height) return;
		
		//this.applyStyle("height", this.height-6 + "px");
	},
	widthChanged:function(oldWidth) {
		if(oldWidth === this.width) return;
		
		this.applyStyle("width", this.width-6 + "px");
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
	}
}

enyo.kind(_Page);
