var MainAssistant = Class.create(
{
	initialize:function()
	{
		this.selected = null;
		
		this.bodyWidth = document.body.offsetWidth;

		this.scroller = null;
		this.dragger = null;
		this.dropIndex = -1;
		
		this.onEnableDrag = this.onEnableDrag.bindAsEventListener(this);
		this.onSelect = this.onSelect.bindAsEventListener(this);
	},
	setup:function() {
	
		//Mojo.Log.info("> MainAssistant.setup");
		
		/** Init Member Variables **/
	
		this.scroller = $('main-scroller');

		/** Setup Widgets **/
		
		this.initContactWidgets(this.getModel().contacts);
		this.controller.setupWidget("main-scroller", {mode:"vertical"}, {});		
		LBB.Util.setupCommandMenu(this.controller, 'grid', false);
		this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, LBB.Util.appMenuModel);
		
		/** Event Handlers **/
		
		this.controller.listen(document, Mojo.Event.tap, this.onClearSelected.bind(this), false);
		this.controller.listen(document, 'orientationchange', this.onOrientationChange.bind(this));
		this.controller.watchModel(this.getModel(), this, this.handleModelChanged.bind(this));
		
		/** Other Setup **/

		this.getModel().selected = false;	// deselected by default
		this.resizeScroller();
	},
	activate:function(event) {
	
		//Mojo.Log.info(document.body.innerHTML.substring(document.body.innerHTML.length-500));
		
		this.onClearSelected();
	
		if(event && event.personId)
		{
			this.onContactSelected(event.details.record);
		}
		else if(this.getModel().modified)
		{
			Mojo.Log.info("MainAssistant.activate modified");
			// clear modified flag and save changes
			this.getModel().modified=false;
			LBB.Model.save();
			
			// update display
			this.initContactWidgets(this.getModel().contacts);
		}
		
		this.onOrientationChange(null);
		
		LBB.Util.displayAd("main_admob", this);
	},
	onClearSelected:function(event)
	{
		//Mojo.Log.info("> MainAssistant.onClearSelected");
		if(this.selected != null) this.selected.mojo.select(false);
		
		LBB.Util.enableEditMenu(this.controller, false);
		
		this.selected = null;
	},
	handleModelChanged:function(contact)
	{
		//Mojo.Log.info("> MainAssistant.handleModelChanged");
	
		LBB.Model.save();
	},
	pushList:function()
	{
		// pushScene keeps it within app so back gesture works as expected
		this.controller.stageController.swapScene("list", this.getModel());
	},
	onContactSelected:function(contact)
	{
		this.getModel().contacts.push(contact);
		this.initContactWidgets();
		this.controller.modelChanged(this.getModel(), this);
		this.handleModelChanged();
	},
	onSelect:function(event)
	{
		// not calling onClearSelected to avoid menu churn by removing and adding edit item
		if(this.selected != null) this.selected.mojo.select(false);
		
		this.selected = event.currentTarget;
		this.selected.mojo.select(true);
		this.scroller.mojo.scrollTo(0, this.selected.offsetTop + this.selected.offsetHeight, true);
		
		LBB.Util.enableEditMenu(this.controller, true);
		
		event.stopPropagation();
	},
	onEnableDrag:function(e)
	{
		Mojo.Log.info("> MainAssistant.onEnableDrag");
		
		this.onClearSelected();
			
		Mojo.Drag.setupDropContainer(this.scroller, new DropTarget(this));
		
		var dim = this.getLayoutDimensions();
		
		// have to set maxHorizontalPixel to width of scroller - size of qc.  subtraction seems (is) arbitrary.
		// guessing that dragger won't let *left* side of element go beyond that point ....
		var m =
		{
			autoscroll:true,
			draggingClass:"dragging",
			minHorizontalPixel:0,
			maxHorizontalPixel:this.scroller.offsetWidth-dim.size,
			minVerticalPixel:0,
			maxVerticalPixel: (Math.ceil(this.getModel().contacts.length/dim.numPer)+1)*dim.size
		};
		
		this.dragger = Mojo.Drag.startDragging(this.controller, e.currentTarget, e, m);
		$('bottom_padding').style.height = "150px";
	},
	onDragEnd:function(position)
	{
		//Mojo.Log.info("> MainAssistant.onDragEnd");
		
		// should encapsulate most of this logic in the model
		
		if(this.dragger == null) return;
		
		var contactId = this.dragger.element.id.split("_")[1];
		var m = this.getModel();
		var c = m.findContactById(contactId);
		var index = this.indexFromPosition(position);
		
		// if not the same spot, handle drop.
		// also, if index > max and c is last contact, effectively the same spot
		if(c.index != index && !(c.index == m.contacts.length - 1 && index == m.contacts.length))
		{
			if(index >= m.contacts.length) {
				// if moving to end, append and slice from original spot
				m.contacts.push(c.contact);
				m.contacts.splice(c.index, 1);
			} else {
				// otherwise, insert at requested spot
				m.contacts.splice(index, 0, c.contact);
				if(c.index < index) {
					m.contacts.splice(c.index, 1);
				} else {
					m.contacts.splice(c.index+1, 1);
				}
			}
			
			LBB.Model.save();
		}

		this.dropIndex = -1;
		this.dragger = null;
		$('bottom_padding').style.height = "50px";
		
		this.layoutContacts();
	},
	onOrientationChange:function(event)
	{
		// orientation changes happen whenever the device is moved
		// only "do work" when it's moving from portrait to landscape (or vice versa)
		if(document.body.offsetWidth != this.bodyWidth)
		{
			this.bodyWidth = document.body.offsetWidth;
			this.resizeScroller();
			this.layoutContacts();
			
			// fixes grid offset high when scrolled down in previous orientation
			this.scroller.mojo.scrollTo(0,0,false);
		}
	},
	resizeScroller:function()
	{
		var admobHeight = (LBB.Preferences.getInstance().getProperty("disableAds")) ? 0 : $('main_admob').offsetHeight;
		var s = this.scroller
		s.style.width = window.innerWidth + "px";
		s.style.height = (window.innerHeight - admobHeight) + "px";
		
		//Mojo.Log.info([s.style.width, s.style.height].join(","));
	},
	initContactWidgets:function()
	{
		//Mojo.Log.info("> MainAssistant.initContactWidgets");
		
		var m = this.getModel();
		
		// init any new contacts
		for(var i=0;i<m.contacts.length;i++) {
			var id = 'qc_' + m.contacts[i].id;
			
			// if element doesn't already exist (when returning from select contact), create it and set it up
			if($(id) == null) {
				// if this is called during setup, the scene controller will take care of initializing widgets
				// if it's called otherwise (e.g. when returning from select contact), calling newContent to force init
				$(this.scroller).insert(new Element("div", {"id":id, "x-mojo-element":"QuickContact"}));
				this.controller.setupWidget(id, {dimensions:this.getLayoutDimensions()}, m.contacts[i]);
				this.controller.newContent(this.scroller);
			
				var o = $(id);
				Mojo.Event.listen(o, Mojo.Event.hold, this.onEnableDrag);
				Mojo.Event.listen(o, Mojo.Event.tap, this.onSelect);
			} else {
				// if it does exist, just re-render it
				$(id).mojo.render();
			}
		}

		// drop any removed contacts
		var that = this;
		this.controller.select(".QuickContact").each(function(el) {
			var id = el.id.substring(3);
			var c = LBB.Model.getInstance().findContactById(id);
			if(c.index == -1) {
				that.controller.remove(el);
			}
		});

		this.layoutContacts();
	},
	layoutContacts:function(position)
	{
		//Mojo.Log.info("> MainAssistant.layoutContacts");
		
		var contacts = this.getModel().contacts;
		
		// set index to length so we can call this function without an arg and it will
		// render as if no drag is in progress
		
		var index = contacts.length
		if(position)
			index = this.indexFromPosition(position);
		
		// if in same drop zone, kick out
		if(index == this.dropIndex) return;
		
		var n=0;
		
		var dim = this.getLayoutDimensions();
		var size = dim.size - (dim.padding*2);
		
		for(var i=0;i<contacts.length;i++) {
		
			if(index == i) n++;

		    var top = dim.padding + (Math.floor(n/dim.perRow)*dim.size) + dim.offsetTop;
		    var left = dim.padding + ((n%dim.perRow)*dim.size) + dim.offsetLeft;
		    
		    var id = 'qc_' + contacts[i].id;
			var o = $(id);
			
			// don't try to reposition the element being drug
			if(this.dragger != null && o === this.dragger.element) continue;
			
			o.style.position = "absolute";
		    o.style.left = left + "px";
		    o.style.top = top + "px";
		    //o.style.border = "2px solid red";
		    o.style.width = size + "px";
		    o.style.height = size + "px";

		    //Mojo.Log.info(n + ": " + contacts[i].firstName + " " + o.style.left + "," + o.style.top + ", " + o.style.width + "," + size);
		    //Mojo.Log.info(o.outerHTML);
		    
		    n++;
		}

		var row = (n%dim.perRow == 0) ? n/dim.perRow : Math.floor(n/dim.perRow)+1;
		var bottomPaddingTop = dim.padding + (row*dim.size) + dim.offsetTop;
		$('bottom_padding').style.top = bottomPaddingTop + "px";
	},
	getLayoutDimensions:function()
	{
		var minWidth = 90;
		var contactPadding = 5;
		var perRow = 0;
		var width;
		
		// find appropriate size
		do {
			width = Math.floor(this.scroller.offsetWidth/++perRow);
		} while(width > minWidth);
		
		// backup one step because loop goes 1 too far before exiting
		width = Math.floor(this.scroller.offsetWidth/--perRow);
		
		var offsetTop = 0;
		if(LBB.Preferences.getInstance().getProperty("disableAds") == false)
			offsetTop = $('main_admob').offsetHeight + 4;
		
		return {
			offsetTop:0, //offsetTop,
			offsetLeft:0,
			perRow:perRow,
			size:width,
			padding:contactPadding
		};
	},
	indexFromPosition:function(pos, log)
	{
		var dim = this.getLayoutDimensions();
		
		var col = Math.round(pos.x/dim.size);
		var row = Math.floor(pos.y/dim.size);
		
		var index = (row*dim.perRow)+col;
		
		if(log)
			Mojo.Log.info(index + "."+ row + "," + nPerRow + "," + col);
			
		var max = this.getModel().contacts.length;
		
		return (index > max) ? max : index;
	},
	getModel:function()
	{
		return LBB.Model.getInstance();
	}
});

var DropTarget = Class.create( 
{
	initialize:function(assistant)
	{
		this.assistant = assistant;
		this.pos = null;
	},
	dragEnter:function(el)
	{
		
	},
	dragHover:function(el)
	{
		// storing last position because i can't seem to get it in dragDrop (is reset to original spot)
		this.pos = el.cumulativeOffset();
	
		this.assistant.layoutContacts(this.getCenter(el));
	},
	dragLeave:function(el)
	{
		
	},
	dragDrop:function(el)
	{
		Mojo.Log.info("> DropTarget.dragDrop");
		this.assistant.onDragEnd(this.getCenter(el));
	},
	dragRemove:function(el)
	{

	},
	getCenter:function(el)
	{
		var elDimensions = el.getDimensions();
		var p = {
			x: (this.pos.left + (Math.round(elDimensions.width/2))),
			y: (this.pos.top + (Math.round(elDimensions.height/2)))
		};
		
		return p;
	}
});