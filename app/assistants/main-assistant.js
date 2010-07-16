var MainAssistant = Class.create(
{
	initialize:function(model, prefs) {
	
		LBB.Model = model;
		LBB.Preferences = prefs;
	
		this.selected = null;
		
		this.bodyWidth = document.body.offsetWidth;

		this.dragger = null;
		this.dropIndex = -1;
		
		this.handlers = new HandlerManager(this, ["onSelect","onEnableDrag", "onClearSelected", "onOrientationChange", "handleModelChanged"]);
	},
	setup:function() {
		/** Setup Widgets **/
		
		LBB.Util.loadTheme(this.controller);
		
		this.setupScrollers();
		this.initContactWidgets(this.getModel().getContacts());
		LBB.Util.setupCommandMenu(this.controller, 'grid', false);
		this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, LBB.Util.appMenuModel);
		
		/** Event Handlers **/
		
		this.controller.listen(document, Mojo.Event.tap, this.handlers.onClearSelected, false);
		this.controller.listen(document, 'orientationchange', this.handlers.onOrientationChange);
		this.controller.watchModel(this.getModel(), this, this.handlers.handleModelChanged);
		
		/** Other Setup **/
		
		this.resizeScroller();
		$('main_admob').insert($L('Loading advertisement'));
	},
	cleanup:function() {
		this.controller.stopListening(document, Mojo.Event.tap, this.handlers.onClearSelected, false);
		this.controller.stopListening(document, 'orientationchange', this.handlers.onOrientationChange);
		
		// cleanup QC handlers
		var contacts = this.getModel().getContacts();
		for(var i=0;i<contacts.length;i++) {
			var id = 'qc_' + contacts[i].id;
			var o = $(id);
			Mojo.Event.stopListening(o, Mojo.Event.hold, this.handlers.onEnableDrag);
			Mojo.Event.stopListening(o, Mojo.Event.tap, this.handlers.onSelect);
		}
		
		this.handlers.release();
	},
	activate:function(event) {
		this.onClearSelected();
	
		if(event && event.personId)
		{
			this.onContactSelected(event.details.record);
		}
		else if(this.getModel().modified)
		{
			// clear modified flag and save changes
			this.getModel().modified=false;
			LBB.Model.save();
			
			// update display
			this.initContactWidgets(this.getModel().getContacts());
		}
		
		this.onOrientationChange(null);
		this.onNamePositionChange();
		
		LBB.Util.displayAd("main_admob", this);
		this.layoutContacts();
		this.getScroller().mojo.scrollTo(undefined, 0);
	},
	setupScrollers:function() {
		//Mojo.Log.info("> setupScrollers");
		
		var hScrollWrapper = $('h-scroller-scroll-wrapper');
		var hScroller = $('h-scroller');
		var pageCount=this.getModel().pages.length;
		var pages = [];
		
		for(var i=0;i<pageCount;i++) {
			var id='page'+i;
			var c = Mojo.View.render({"template":"main/contact-page", attributes:{'id':id,width:window.innerWidth}, model:{}});
			hScrollWrapper.insert(c);
			this.controller.setupWidget(id+'-scroller', {mode:'vertical'}, {});
		}
		
		this.controller.newContent(hScroller);
		hScrollWrapper.style.width = (window.innerWidth*pageCount) + "px";
		
		for(var i=0;i<pageCount;i++) {
			pages.push($('page'+i+'-scroller'));	
		}
		
		this.controller.setupWidget('h-scroller', {mode:'horizontal-snap'}, {snapElements:{x:pages}});
	},
	onClearSelected:function(event) {
		//Mojo.Log.info("> MainAssistant.onClearSelected");
		if(this.selected != null) this.selected.mojo.select(false);
		
		LBB.Util.enableEditMenu(this.controller, false);
		
		this.selected = null;
	},
	handleModelChanged:function(contact) {
		LBB.Model.save();
	},
	pushList:function() {
		// pushScene keeps it within app so back gesture works as expected
		this.controller.stageController.swapScene("list", this.getModel());
	},
	onContactSelected:function(contact)
	{
		this.getModel().getContacts().push(contact);
		this.initContactWidgets();
		this.controller.modelChanged(this.getModel(), this);
		this.handleModelChanged();
	},
	onSelect:function(event) {
		// not calling onClearSelected to avoid menu churn by removing and adding edit item
		if(this.selected != null) this.selected.mojo.select(false);
		
		this.selected = event.currentTarget;
		this.selected.mojo.select(true);
		
		this.revealContact(this.selected);
		
		LBB.Util.enableEditMenu(this.controller, true);
		
		event.stopPropagation();
	},
	onEnableDrag:function(e) {
		//Mojo.Log.info("> MainAssistant.onEnableDrag");
		
		this.onClearSelected();
			
		Mojo.Drag.setupDropContainer(this.getScroller(), new DropTarget(this));
		
		var dim = this.getLayoutDimensions();
		
		// have to set maxHorizontalPixel to width of scroller - size of qc.  subtraction seems (is) arbitrary.
		// guessing that dragger won't let *left* side of element go beyond that point ....
		var m =
		{
			autoscroll:true,
			draggingClass:"dragging",
			minHorizontalPixel:0,
			maxHorizontalPixel:this.getScroller().offsetWidth-dim.size,
			minVerticalPixel:0,
			maxVerticalPixel: (Math.ceil(this.getModel().getContacts().length/dim.numPer)+1)*dim.size
		};
		
		this.dragger = Mojo.Drag.startDragging(this.controller, e.currentTarget, e, m);
		
		// set padding height to account for extra row to drop
		this.getPaddingElement().style.height = (dim.size + 50) + "px";
	},
	onDragEnd:function(position) {
		if(this.dragger == null) return;

		var contactId = this.dragger.element.id.split("_")[1];
		var m = this.getModel();
		var contacts = m.getContacts();
		var c = m.findContactById(contactId);
		var index = this.indexFromPosition(position);
		
		// if not the same spot, handle drop.
		// also, if index > max and c is last contact, effectively the same spot
		if(c.index != index && !(c.index == contacts.length - 1 && index == contacts.length))
		{
			if(index >= contacts.length) {
				// if moving to end, append and slice from original spot
				contacts.push(c.contact);
				contacts.splice(c.index, 1);
			} else {
				// otherwise, insert at requested spot
				contacts.splice(c.index, 1);
				contacts.splice(index, 0, c.contact);
			}
			
			LBB.Model.save();
		}
		
		this.dropIndex = -1;
		this.dragger = null;
		
		// reset padding height
		this.getPaddingElement().style.height = "50px";
		
		this.layoutContacts();
	},
	onNamePositionChange:function() {
		var prefs = LBB.Preferences.getInstance();
		var np = "contact-name-" + prefs.getProperty("namePosition");
		var scroller = $('h-scroller');
		
		if(scroller.hasClassName(np)) return;
		
		var classes = $w(scroller.className);
		
		for(var i=0;i<classes.length;i++) {
			if(np == classes[i]) {
				// same class, kick out
				return;
			} else if(classes[i].indexOf("contact-name") == 0) {
				// different name position class, remove it
				scroller.removeClassName(classes[i]);
				break;
			}
		}
		
		// add new class
		scroller.addClassName(np);
	},
	onOrientationChange:function(event) {
		// orientation changes happen whenever the device is moved
		// only "do work" when it's moving from portrait to landscape (or vice versa)
		if(document.body.offsetWidth != this.bodyWidth) {
			this.bodyWidth = document.body.offsetWidth;
			this.resizeScroller();
			this.layoutContacts();
			
			// fixes grid offset high when scrolled down in previous orientation
			this.getScroller().mojo.scrollTo(0,0,false);
		}
	},
	resizeScroller:function() {
		var admobHeight = (LBB.Preferences.getInstance().getProperty("disableAds")) ? 0 : 40;
		var s = this.getScroller();
		s.style.width = window.innerWidth + "px";
		s.style.height = (window.innerHeight - admobHeight) + "px";
	},
	revealContact:function(widget) {
		var dim = this.getLayoutDimensions();
		var state = this.getScroller().mojo.getState();
		var scrollerSize = this.getScroller().mojo.scrollerSize();
		
		var top = state.top+widget.offsetTop;
		var bottom = top + dim.size;
		var y;
		
		if(top < 0) {	// top of element is above view
			y = -(widget.offsetTop - dim.padding);
		} else if(bottom > scrollerSize.height-50) {	// bottom of element is below view
			y = state.top - (bottom - scrollerSize.height + 50);
		}
		
		this.getScroller().mojo.scrollTo(undefined, y, true, true);
	},
	initContactWidgets:function() {
		//Mojo.Log.info("> MainAssistant.initContactWidgets");
		var timing = Mojo.Timing;
		timing.resume("scene#initContactWidgets");
		
		var contacts = this.getModel().getContacts();
		 
		// init any new contacts
		for(var i=0;i<contacts.length;i++) {
			var id = 'qc_' + contacts[i].id;
			
			// if element doesn't already exist (when returning from select contact), create it and set it up
			if($(id) == null) {
				// if this is called during setup, the scene controller will take care of initializing widgets
				// if it's called otherwise (e.g. when returning from select contact), calling newContent to force init
				this.getScrollWrapper().insert(new Element("div", {"id":id, "x-mojo-element":"QuickContact"}));
				this.controller.setupWidget(id, {dimensions:this.getLayoutDimensions()}, contacts[i]);
			
				var o = $(id);
				Mojo.Event.listen(o, Mojo.Event.hold, this.handlers.onEnableDrag);
				Mojo.Event.listen(o, Mojo.Event.tap, this.handlers.onSelect);
			} else {
				// if it does exist, just re-render it
				$(id).mojo.render();
			}
		}
		
		this.controller.newContent(this.getScroller());
		
		// drop any removed contacts
		var that = this;
		this.controller.select(".QuickContact").each(function(el) {
			var id = el.id.substring(3);
			var c = LBB.Model.getInstance().findContactById(id);
			if(c.index == -1) {
				that.controller.remove(el);
			}
		});

		timing.pause("scene#initContactWidgets");
	},
	layoutContacts:function(position, dragComplete) {
		//Mojo.Log.info("> MainAssistant.layoutContacts");
		
		var timing = Mojo.Timing;
		timing.resume("scene#layoutContacts");
		
		var contacts = this.getModel().getContacts();
		
		// set index to length so we can call this function without an arg and it will
		// render as if no drag is in progress
		
		var index = contacts.length;
		if(position)
			index = this.indexFromPosition(position);
		
		// if in same drop zone, kick out
		if(index == this.dropIndex) return;
		
		var dim = this.getLayoutDimensions();
		var size = dim.size - (dim.padding*2);
		
		var foundActive = false;
		for(var i=0;i<contacts.length;i++) {
		
		    var id = 'qc_' + contacts[i].id;
			var o = $(id);
			var n;
			
			if(i >= index && !foundActive) {
				n = i+1;
			} else if(i <= index && foundActive) {
				n = i-1;
			} else {
				n = i;
			}
			
			// don't try to reposition the element being drug
			// and don't update the position counter (n)
			if(this.dragger != null && o === this.dragger.element) {
				foundActive = true;
				continue;
			}
			
		    var top = dim.padding + (Math.floor(n/dim.perRow)*dim.size) + dim.offsetTop;
		    var left = dim.padding + ((n%dim.perRow)*dim.size) + dim.offsetLeft;
		    
			o.style.position = "absolute";
		    o.style.left = left + "px";
		    o.style.top = top + "px";
		    o.style.width = size + "px";
	    	o.style.height = size + "px";
		}

		var n = contacts.length;
		var row = (n%dim.perRow == 0) ? n/dim.perRow : Math.floor(n/dim.perRow)+1;
		var bottomPaddingTop = dim.padding + (row*dim.size) + dim.offsetTop;
		this.getPaddingElement().style.top = bottomPaddingTop + "px";
		
		timing.pause("scene#layoutContacts");
	},
	getLayoutDimensions:function() {
		//Mojo.Log.info("> getLayoutDimensions");
		
		var prefs = LBB.Preferences.getInstance();
		var sizePref = prefs.getProperty("contactSize");
		var minWidth = (sizePref == "large") ? 120 : 90;
		var contactPadding = 5;
		var perRow = 0;
		var width;
		
		// find appropriate size
		do {
			width = Math.floor(this.getScroller().offsetWidth/++perRow);
		} while(width > minWidth);
		
		// backup one step because loop goes 1 too far before exiting
		width = Math.floor(this.getScroller().offsetWidth/--perRow);
		
		var offsetTop = 0;
		if(prefs.getProperty("disableAds") == false)
			offsetTop = $('main_admob').offsetHeight + 4;
		
		return {
			offsetTop:0,
			offsetLeft:0,
			perRow:perRow,
			size:width,
			padding:contactPadding
		};
	},
	indexFromPosition:function(pos) {
		var dim = this.getLayoutDimensions();
		var col = Math.floor(pos.x/dim.size);
		var row = Math.floor(pos.y/dim.size);		
		var index = (row*dim.perRow)+col;
		var max = this.getModel().getContacts().length;
		
		return (index > max) ? max : index;
	},
	getModel:function() {
		return LBB.Model.getInstance();
	},
	getPaddingElement:function(_page) {
		return this.getPageElement('bottom-padding', _page);
	},
	getScroller:function(_page) {
		return this.getPageElement('scroller', _page);
	},
	getScrollWrapper:function(_page) {
		return this.getPageElement('scroll-wrapper', _page);
	},
	getPageElement:function(id, _page) {
		if(!_page) {
			_page = 0;
		}
		
		return $('page' + _page + '-' + id);
	}
});

var DropTarget = Class.create( 
{
	initialize:function(assistant) {
		this.assistant = assistant;
		this.pos = null;
	},
	dragEnter:function(el) {
		
	},
	dragHover:function(el) {
		// storing last position because i can't seem to get it in dragDrop (is reset to original spot)
		this.pos = el.cumulativeOffset();
	
		this.assistant.layoutContacts(this.getCenter(el));
	},
	dragLeave:function(el){
		
	},
	dragDrop:function(el) {
		this.assistant.onDragEnd(this.getCenter(el));
	},
	dragRemove:function(el) {

	},
	getCenter:function(el) {
		var elDimensions = el.getDimensions();
		var p = {
			x: (this.pos.left + (Math.round(elDimensions.width/2))),
			y: (this.pos.top - this.assistant.getScroller().offsetTop + (Math.round(elDimensions.height/2)))
		};
		
		return p;
	}
});