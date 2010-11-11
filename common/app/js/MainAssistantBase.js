var _MainAssistantBase = {
	initialize:function() {
		try {
			LBB.Util.log("> MainAssistant.initialize");
			
			Mojo.Timing.resume("MainScene#all");
					
			this.selected = null;
			this.activePage = 0;
			
			this.bodyWidth = Mojo.Environment.DeviceInfo.screenWidth;
	
			this.dragger = null;
			this.hScrollerModel = null;
			
			this.handlers = new HandlerManager(this, ["onSelect","onEnableDrag", "onClearSelected", "onOrientationChange", "handleModelChanged", "onPageChange", "onContactButtonTap", "onContactAction", "onConfirmRemoveContact", "onResize"]);
		} catch (e) {
			LBB.Util.error("MainAssistant.initialize", e);
		}
	},
	setup:function() {	
		try {
			LBB.Util.log("> MainAssistant.setup");
						
			// enables QuickContact widget to render appropriately for driving/normal mode
			this.controller.get('mojo-scene-main').addClassName(Mojo.Controller.getAppController().assistant.settings.mode);
			
			LBB.Util.loadTheme(this.controller);
			
			/** Setup Widgets **/
			
			LBB.Util.log("setting up widgets");
			this.setupScrollers();
			this.initContactWidgets();
			LBB.Util.setupCommandMenu(this.controller, 'grid', false);
			this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, LBB.Util.getAppMenuModel("grid"));
						
			/** Other Setup **/
			
			LBB.Util.log("other setup");
			this.setActivePage(this.getDefaultPage());
			this.controller.watchModel(this.getModel(), this, this.handlers.handleModelChanged);
			this.resizeScroller();
			
			// setup help bubble
			var helpBubble = this.controller.get('help-bubble');
			if (!this.getModel().hasContacts()) {
				helpBubble.update($L("Tap the person icon above to add, edit, or remove a contact."));
				helpBubble.show();
			}
			
			Mojo.Timing.pause("MainScene#all");
			Mojo.Timing.reportTiming("MainScene#", "MainScene")
		} catch(e) {
			LBB.Util.error("MainAssistant.setup", e);
		}
	},
	cleanup:function() {
		
		// cleanup QC handlers, iterate all pages and get all contact widgets
		var pages = this.getModel().getPages();
		for(var p=0;i<pages.length;p++) { 
			var contacts = pages[p].getContacts();
			for(var i=0;i<contacts.length;i++) {
				var id = 'page' + p + '-qc-' + contacts[i].id;
				var o = this.controller.get(id);
				Mojo.Event.stopListening(o, Mojo.Event.hold, this.handlers.onEnableDrag);
				Mojo.Event.stopListening(o, Mojo.Event.tap, this.handlers.onSelect);
			}
		}
				
		this.handlers.release();
	},
	activate:function(event) {
		try {
			LBB.Util.log("> MainAssistant.activate");
			this.onClearSelected();
		
			if(event && event.personId)
			{
				LBB.Util.log("adding contact",event.details.record.id);
				
				this.onContactSelected(event.details.record);
			}
			else if(this.getModel().modified)
			{
				LBB.Util.log("model modified out of scene");
				
				// clear modified flag and save changes
				this.getModel().modified=false;
				LBB.Model.save();
				
				// update display
				this.initContactWidgets();
			}
			
			/** Event Handlers **/
			LBB.Util.log("adding event handlers")
			this.controller.listen(this.controller.get('h-scroller'), Mojo.Event.propertyChange, this.handlers.onPageChange);
			this.controller.listen(this.controller.get('mojo-scene-main'), Mojo.Event.tap, this.handlers.onClearSelected, false);
			this.controller.listen(this.controller.document, 'orientationchange', this.handlers.onOrientationChange);
			this.controller.listen(this.controller.document, 'resize', this.handlers.onResize);
			this.controller.listen(this.controller.get('contactButton'), Mojo.Event.tap, this.handlers.onContactButtonTap);

			this.onOrientationChange(null);
			this.onNamePositionChange();
			this.layoutContacts();
			this.getScroller().mojo.scrollTo(undefined, 0);
		} catch(e) {
			LBB.Util.error("MainAssistant.activate", e);
		}
	},
	deactivate:function() {
		/** Event Handlers **/
		
		this.controller.stopListening(this.controller.get('h-scroller'), Mojo.Event.propertyChange, this.handlers.onPageChange);
		this.controller.stopListening(this.controller.get('mojo-scene-main'), Mojo.Event.tap, this.handlers.onClearSelected, false);
		this.controller.stopListening(document, 'orientationchange', this.handlers.onOrientationChange);
		this.controller.stopListening(document, 'resize', this.handlers.onResize);
		this.controller.stopListening(this.controller.get('contactButton'), Mojo.Event.tap, this.handlers.onContactButtonTap);
	},
	setupScrollers:function() {
		LBB.Util.log("> MainAssistant.setupScrollers");
		
		var pageCount=this.getModel().getPages().length;
		
		for(var i=0;i<pageCount;i++) {
			this.setupPageScroller(i);
		}
		
		this.controller.newContent(this.controller.get('h-scroller'));
		
		var pages = [];
		for(var i=0;i<pageCount;i++) {
			pages.push(this.controller.get('page'+i+'-scroller'));	
		}
		
		this.hScrollerModel = {snapElements:{x:pages}, snapIndex:0};
		
		this.controller.setupWidget('h-scroller', {mode:'horizontal-snap'}, this.hScrollerModel);
	},
	setupPageScroller:function(i) {
		var hScrollWrapper = this.controller.get('h-scroller-scroll-wrapper');
		var id='page'+i;
		var w = this.controller.get("mojo-scene-main").getDimensions().width;
		var c = Mojo.View.render({"template":"main/contact-page", attributes:{'id':id,width:w}, model:{}});
		
		hScrollWrapper.insert(c);
		this.controller.setupWidget(id+'-scroller', {mode:'vertical'}, {});
	},
	resizeScroller:function() {
		var offsetTop = this.controller.get('h-scroller').cumulativeOffset().top;
		var hScrollWrapper = this.controller.get('h-scroller-scroll-wrapper');
		var margin = 6;
		var dim = Mojo.View.getViewportDimensions(this.controller.document);
		
		var pageCount = this.getModel().getPages().length;
		for(var i=0;i<pageCount;i++) {
			var s = this.getScroller(i);
			s.style.width = (dim.width-margin) + "px";
			s.style.height = (dim.height - offsetTop - margin) + "px";
		}
		
		hScrollWrapper.style.width = (dim.width*pageCount) + "px";
	},
	revealContact:function(widget) {
		var dim = this.getLayoutDimensions();
		var state = this.getScroller().mojo.getState();
		var scrollerSize = this.getScroller().mojo.scrollerSize();
		
		var top = state.top+widget.offsetTop;
		var bottom = top + dim.size;
		var y;
		
		if(top < 50) {	// top of element is above view
			y = -(widget.offsetTop - dim.padding - 50);
		} else if(bottom > scrollerSize.height-50) {	// bottom of element is below view
			y = state.top - (bottom - scrollerSize.height + 50);
		}
		
		this.getScroller().mojo.scrollTo(undefined, y, true, true);
	},
	initContactWidgets:function() {
		var pages = this.getModel().getPages();
		for(var i=0;i<pages.length;i++) {
			this.initContactWidgetsForPage(i);
		}
	},
	initContactWidgetsForPage:function(page) {
		LBB.Util.log("> MainAssistant.initContactWidgetsByPage");
	
		var contacts = this.getModel().getPage(page).getContacts();
				
		var dim = this.getLayoutDimensions();
		
		// init any new contacts
		for(var i=0;i<contacts.length;i++) {
			var id = 'page' + page + '-qc-' + contacts[i].id;
			
			// if element doesn't already exist (when returning from select contact), create it and set it up
			if(this.controller.get(id) == null) {
				// if this is called during setup, the scene controller will take care of initializing widgets
				// if it's called otherwise (e.g. when returning from select contact), calling newContent to force init
				this.getScrollWrapper(page).insert(new Element("div", {"id":id, "x-mojo-element":"QuickContact"}));
				this.controller.setupWidget(id, {dimensions:dim}, contacts[i]);
				
				var o = this.controller.get(id);
				Mojo.Event.listen(o, Mojo.Event.hold, this.handlers.onEnableDrag);
				Mojo.Event.listen(o, Mojo.Event.tap, this.handlers.onSelect);
			} else {
				// if it does exist, just re-render it
				this.controller.get(id).mojo.render();
			}
		}
		
		this.controller.newContent(this.getScroller(page));
		
		// drop any removed contacts
		var that = this;
		this.controller.select("#" + this.getScroller(page).id + " .QuickContact").each(function(el) {
			var id = el.id.substring(el.id.lastIndexOf("-")+1);
			var c = LBB.Model.getInstance().getPage(page).findContactById(id);
			if(c.index == -1) {
				that.controller.remove(el);
			}
		});
	},
	layoutContacts:function(position, dragComplete) {
		var pages = this.getModel().getPages();
		for(var i=0;i<pages.length;i++) {
			this.layoutContactsByPage(i, position, dragComplete);
		}
	},
	layoutContactsByPage:function(page, position, dragComplete) {
		LBB.Util.log("> MainAssistant.layoutContacts");
		var contacts = this.getModel().getPage(page).getContacts();
		
		// set index to length so we can call this function without an arg and it will
		// render as if no drag is in progress
		
		var index = contacts.length;
		if(position)
			index = this.indexFromPosition(position);
		
		var dim = this.getLayoutDimensions();
		var size = dim.size - (dim.padding*2);
		
		var foundActive = false;
		for(var i=0;i<contacts.length;i++) {
		
		    var id = 'page' + page + '-qc-' + contacts[i].id;
			var o = this.controller.get(id);
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
		this.getPaddingElement(page).style.top = bottomPaddingTop + "px";
	},
	getLayoutDimensions:function() {
		// handles driving/normal modes
		var aa = Mojo.Controller.getAppController().assistant;
		var minWidth = (aa.settings.mode == "driving") ? 120 : 90;
		
		var perRow = 0;
		var margin = 6;
		var width;
		
		var scrollerWidth = Mojo.Environment.DeviceInfo.screenWidth - margin;
		
		// find appropriate size
		do {
			width = Math.floor(scrollerWidth/++perRow);
		} while(width > minWidth);
		
		// backup one step because loop goes 1 too far before exiting
		width = Math.floor(scrollerWidth/--perRow);
		
		var dim = {
			offsetTop:50,
			offsetLeft:0,
			perRow:perRow,
			size:width,
			padding:5
		};
		
		return dim;
	},
	indexFromPosition:function(pos) {
		var dim = this.getLayoutDimensions();
		var x = pos.x-(this.getScroller().offsetWidth*this.activePage) - dim.offsetLeft;		// adjust x for current page and offsetLeft (currently 0)
		var y = pos.y-dim.offsetTop;															// adjust y for offsetTop (size of header)
		var col = Math.floor(x/dim.size);
		var row = Math.floor(y/dim.size);		
		var index = (row*dim.perRow)+col;
		var max = this.getCurrentPageModel().getContacts().length;
		
		return (index > max) ? max : index;
	},
	
	/*** Utility Methods ***/
	
	getModel:function() {
		return LBB.Model.getInstance();
	},
	getCurrentPageModel:function() {
		var m = this.getModel();
		return m.getPage(this.activePage);
	},
	getPaddingElement:function(_page, idOnly) {
		return this.getPageElement('bottom-padding', _page, idOnly);
	},
	getScroller:function(_page, idOnly) {
		return this.getPageElement('scroller', _page, idOnly);
	},
	getScrollWrapper:function(_page, idOnly) {
		return this.getPageElement('scroll-wrapper', _page, idOnly);
	},
	getPageElement:function(id, _page, idOnly) {
		if(typeof(_page) == "undefined") {
			_page = this.activePage;
		}
		
		var elId = 'page' + _page + '-' + id;
		return (idOnly == true) ? elId : this.controller.get(elId);
	},
	getDefaultPage:function() {
		// TODO: pull from preferences
		return 0;
	},
	setActivePage:function(page) {
		this.activePage = page;
	},
	invalidate:function() {
		this.onClearSelected();
		this.initContactWidgets();
		this.layoutContacts();
	},
	
	/*** Event Handlers & Callbacks ***/

	onResize:function(event) {
		this.resizeScroller();
	},
	onContactButtonTap:function(event) {
		var disabled = (this.selected==null);
		this.controller.popupSubmenu({
			onChoose:this.handlers.onContactAction,
			placeNear:event.target,
			items: [{label:$L("Contact")},{label: $L('Add'), command: 'add'},{label: $L('Edit'), command: 'edit', disabled:disabled},{label: $L('Remove'), command: 'delete', disabled:disabled}]
		});
		
		event.stopPropagation();
	},
	onContactAction:function(cmd) {
		switch(cmd) {
			case 'add':
				this.onAddContact();
				break;
			case 'edit':
				this.onEditContact();
				break;
			case 'delete':
				this.onRemoveContact();
				break;
		}
	},
	onAddContact:function() {
		var pages = LBB.Model.getInstance().getPages();
		var contacts = pages[this.activePage].getContacts();
		
		var c = [];
		
		for(var j=0;j<contacts.length;j++) {
	  		c.push(contacts[j].id);
	  	}
	  		
		this.controller.stageController.pushScene(
		  { appId :'com.palm.app.contacts', name: 'list' },
		  { mode: 'picker', exclusions: c, message: $L("Select a Contact")}
		 );
	},
	onEditContact:function() {
		try {
			var c = this.getCurrentPageModel().findContactById(this.selected.id.substring(this.selected.id.lastIndexOf("-")+1));
			if(c.contact != null) {
				this.controller.stageController.pushScene("edit-contact", c.contact);
			}
		} catch (e) {
			LBB.Util.error("Unable to find a contact for selected contact.  selected might not exist.  Msg: " + e);
		}
	},
	onRemoveContact:function() {
		LBB.Util.log("> MainAssistant.onRemoveContact");
		
		this.controller.showAlertDialog({
			onChoose:this.handlers.onConfirmRemoveContact,
			title:$L("Confirm Removal"),
			message:$L("Are you sure you want to remove this contact?"),
			choices:
			[
				{label:"Remove",value:"REMOVE",type:"negative"},
				{label:"Cancel",value:"CANCEL",type:"dismiss"},
			]
		});
	},
	onConfirmRemoveContact:function(value) {
		if(value == "REMOVE") {
			var m = this.getModel();
			m.getPages()[this.activePage].removeContactById(this.selected.id.substring(this.selected.id.lastIndexOf("-")+1));
			m.save();
			
			m.log();
			
			this.invalidate();
		}
	},
	onClearSelected:function(event, skipAnimation) {
		LBB.Util.log("> MainAssistant.onClearSelected");
		
		if (this.selected != null) {
			var transition;
			
			if (!skipAnimation) {
				transition = this.controller.prepareTransition(Mojo.Transition.crossFade);
			}
			
			this.selected.mojo.select(false);
			this.selected = null;
			
			if (!skipAnimation == true) {
				transition.run();
			}
		}
	},
	handleModelChanged:function(contact) {
		LBB.Util.log("> MainAssistant.handleModelChanged");
		
		LBB.Model.save();
	},
	onContactSelected:function(contact) {
		// hide help bubble
		this.controller.get("help-bubble").hide();
		
		this.getCurrentPageModel().getContacts().push(contact);
		this.initContactWidgets();
		this.controller.modelChanged(this.getModel(), this);
		this.handleModelChanged();
	},
	onSelect:function(event) {
		var transition = this.controller.prepareTransition(Mojo.Transition.crossFade);
		
		// not calling onClearSelected to avoid menu churn by removing and adding edit item
		if(this.selected != null) this.selected.mojo.select(false);
		
		this.selected = event.currentTarget;
		this.selected.mojo.select(true);
		
		transition.run();
		
		this.revealContact(this.selected);
		
		event.stopPropagation();
	},
	onEnableDrag:function(e) {
		// passing true to skip animation.  otherwise, drag is delayed until transition completes
		this.onClearSelected(undefined, true);

		var pageCount = this.getModel().getPages().length;
		for(var i=0;i<pageCount;i++) {
			Mojo.Drag.setupDropContainer(this.getScroller(i), new DropTarget(this));
		}
		
		var dim = this.getLayoutDimensions();
		
		// have to set maxHorizontalPixel to width of scroller - size of qc.  subtraction seems (is) arbitrary.
		// guessing that dragger won't let *left* side of element go beyond that point ....
		var m =
		{
			//allowExit:true,
			autoscroll:true,
			draggingClass:"dragging",
			minHorizontalPixel:0,
			maxHorizontalPixel:this.getScroller().offsetWidth-dim.size,
			minVerticalPixel:0,
			maxVerticalPixel: (Math.ceil(this.getCurrentPageModel().getContacts().length/dim.numPer)+1)*dim.size
		};
				
		this.dragger = Mojo.Drag.startDragging(this.controller, e.currentTarget, e, m);
		
		// set padding height to account for extra row to drop
		this.getPaddingElement().style.height = (dim.size + 50) + "px";
	},
	onDragEnd:function(position) {
		LBB.Util.log("> MainAssistant.onDragEnd");
		
		if(this.dragger == null) return;

		var el = this.dragger.element;
		var contactId = el.id.substring(el.id.lastIndexOf("-")+1);
		var m = this.getCurrentPageModel();
		var contacts = m.getContacts();
		var c = m.findContactById(contactId);
		var index = this.indexFromPosition(position);
		
		// if not the same spot, handle drop.
		// also, if index > max and c is last contact, effectively the same spot
		if(c.index != index && !(c.index == contacts.length - 1 && index == contacts.length)) {
			contacts.splice(c.index, 1);
			contacts.splice(index, 0, c.contact);

			LBB.Model.save();
		}
		
		this.dragger = null;
		
		// reset padding height
		this.getPaddingElement().style.height = "50px";
		
		this.layoutContacts();
	},
	onNamePositionChange:function() {
		var prefs = LBB.Preferences.getInstance();
		var np = "contact-name-" + prefs.getProperty("namePosition");
		var scroller = this.controller.get('h-scroller');
		
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
		if(this.controller.document.body.offsetWidth != this.bodyWidth) {
			this.bodyWidth = this.controller.document.body.offsetWidth;
			
			// fixes horizontal scroller positioning
			this.setActivePage(this.activePage);
			
			this.resizeScroller();
			this.layoutContacts();
			
			// fixes grid offset high when scrolled down in previous orientation
			this.getScroller().mojo.scrollTo(0,0,false);
		}
	},
	onPageChange:function(event) {
		this.setActivePage(event.value);
	},
	onHover:function(position) {
		this.layoutContactsByPage(this.activePage, position);
	}
};

var _DropTarget = {
	initialize:function(assistant) {
		this.assistant = assistant;
		this.pos = null;
	},
	dragEnter:function(el) {
		
	},
	dragHover:function(el) {
		// storing last position because i can't seem to get it in dragDrop (is reset to original spot)
		this.pos = el.cumulativeOffset();

		this.assistant.onHover(this.getCenter(el));
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
};

var MainAssistantBase = Class.create(_MainAssistantBase);
var DropTarget = Class.create(_DropTarget);
