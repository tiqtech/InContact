var MainAssistant = Class.create(
{
	initialize:function(model, prefs) {
	
		LBB.Model = model;
		LBB.Preferences = prefs;
	
		this.selected = null;
		this.activePage = null;
		
		this.bodyWidth = document.body.offsetWidth;

		this.dragger = null;
		
		this.handlers = new HandlerManager(this, ["onSelect","onEnableDrag", "onClearSelected", "onOrientationChange", "handleModelChanged", "onPageChange", "onPageChangeTimer", "onContactButtonTap", "onPageButtonTap", "onContactAction", "onConfirmRemoveContact", "onResize"]);
	},
	setup:function() {
		// this needs to be first to set activePage correctly
		this.setActivePage(this.getDefaultPage());
		
		// enables QuickContact widget to render appropriately for driving/normal mode
		$('mojo-scene-main').addClassName(Mojo.Controller.getAppController().assistant.settings.mode);
		
		/** Setup Widgets **/
		
		LBB.Util.loadTheme(this.controller);
		
		this.setupScrollers();
		this.initContactWidgets();
		LBB.Util.setupCommandMenu(this.controller, 'grid', false);
		this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, LBB.Util.getAppMenuModel("grid"));
		
		/** Event Handlers **/
		
		this.controller.listen($('h-scroller'), Mojo.Event.propertyChange, this.handlers.onPageChange);
		this.controller.listen(document, Mojo.Event.tap, this.handlers.onClearSelected, false);
		this.controller.listen(document, 'orientationchange', this.handlers.onOrientationChange);
		this.controller.listen(document, 'resize', this.handlers.onResize);
		this.controller.listen($('contactButton'), Mojo.Event.tap, this.handlers.onContactButtonTap);
		this.controller.listen($('pageButton'), Mojo.Event.tap, this.handlers.onPageButtonTap);
		this.controller.watchModel(this.getModel(), this, this.handlers.handleModelChanged);
		
		/** Other Setup **/
		
		this.resizeScroller();
	},
	cleanup:function() {
		this.controller.stopListening(document, Mojo.Event.tap, this.handlers.onClearSelected, false);
		this.controller.stopListening(document, 'orientationchange', this.handlers.onOrientationChange);
		
		// cleanup QC handlers, iterate all pages and get all contact widgets
		var pages = this.getModel().getPages();
		for(var p=0;i<pages.length;p++) { 
			var contacts = pages[p].getContacts();
			for(var i=0;i<contacts.length;i++) {
				var id = 'qc_' + contacts[i].id;
				var o = $(id);
				Mojo.Event.stopListening(o, Mojo.Event.hold, this.handlers.onEnableDrag);
				Mojo.Event.stopListening(o, Mojo.Event.tap, this.handlers.onSelect);
			}
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
			this.initContactWidgets();
		}
		
		this.onOrientationChange(null);
		this.onNamePositionChange();
		this.layoutContacts();
		this.getScroller().mojo.scrollTo(undefined, 0);
	},
	setupScrollers:function() {
		//Mojo.Log.info("> setupScrollers");
		
		var hScrollWrapper = $('h-scroller-scroll-wrapper');
		var hScroller = $('h-scroller');
		var pageCount=this.getModel().getPages().length;
		var pages = [];
		
		for(var i=0;i<pageCount;i++) {
			var id='page'+i;
			var c = Mojo.View.render({"template":"main/contact-page", attributes:{'id':id,width:window.innerWidth}, model:{}});
			hScrollWrapper.insert(c);
			this.controller.setupWidget(id+'-scroller', {mode:'vertical'}, {});
		}
		
		this.controller.newContent(hScroller);
		
		for(var i=0;i<pageCount;i++) {
			pages.push($('page'+i+'-scroller'));	
		}
		
		this.controller.setupWidget('h-scroller', {mode:'horizontal-snap'}, {snapElements:{x:pages}, snapIndex:0});
	},
	resizeScroller:function() {
		var offsetTop = $('h-scroller').cumulativeOffset().top;
		var hScrollWrapper = $('h-scroller-scroll-wrapper');
		var margin = 6;
		
		var pageCount = this.getModel().getPages().length;
		for(var i=0;i<pageCount;i++) {
			var s = $('page'+i+'-scroller');
			s.style.width = (window.innerWidth-margin) + "px";
			s.style.height = (window.innerHeight - offsetTop - margin) + "px";
		}
		
		hScrollWrapper.style.width = (window.innerWidth*pageCount) + "px";
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
		//Mojo.Log.info("> MainAssistant.initContactWidgetsByPage");
	
		var contacts = this.getModel().getPage(page).getContacts();
		var dim = this.getLayoutDimensions();
		 
		// init any new contacts
		for(var i=0;i<contacts.length;i++) {
			var id = 'qc_' + contacts[i].id;
			
			// if element doesn't already exist (when returning from select contact), create it and set it up
			if($(id) == null) {
				// if this is called during setup, the scene controller will take care of initializing widgets
				// if it's called otherwise (e.g. when returning from select contact), calling newContent to force init
				this.getScrollWrapper(page).insert(new Element("div", {"id":id, "x-mojo-element":"QuickContact"}));
				this.controller.setupWidget(id, {dimensions:dim}, contacts[i]);
				
				var o = $(id);
				Mojo.Event.listen(o, Mojo.Event.hold, this.handlers.onEnableDrag);
				Mojo.Event.listen(o, Mojo.Event.tap, this.handlers.onSelect);
			} else {
				// if it does exist, just re-render it
				$(id).mojo.render();
			}
		}
		
		this.controller.newContent(this.getScroller(page));
		
		// drop any removed contacts
		var that = this;
		this.controller.select("#" + this.getScroller(page).id + " .QuickContact").each(function(el) {
			var id = el.id.substring(3);
			var c = LBB.Model.getInstance().getPage(page).findContactById(id);
			if(c.index == -1) {
				that.controller.remove(el);
			}
		});

		//Mojo.Log.info("< MainAssistant.initContactWidgetsByPage");
	},
	layoutContacts:function(position, dragComplete) {
		var pages = this.getModel().getPages();
		for(var i=0;i<pages.length;i++) {
			this.layoutContactsByPage(i, position, dragComplete);
		}
	},
	layoutContactsByPage:function(page, position, dragComplete) {
		//Mojo.Log.info("> MainAssistant.layoutContacts");
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
		this.getPaddingElement(page).style.top = bottomPaddingTop + "px";
		
		//Mojo.Log.info("< MainAssistant.layoutContacts");
	},
	getLayoutDimensions:function() {
		//Mojo.Log.info("> getLayoutDimensions");
		
		// handles driving/normal modes
		var aa = Mojo.Controller.getAppController().assistant;
		var minWidth = (aa.settings.mode == "driving") ? 120 : 90;
		
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
		var x = pos.x-(this.getScroller().offsetWidth*this.activePage);		// adjust x for current page
		var col = Math.floor(x/dim.size);
		var row = Math.floor(pos.y/dim.size);		
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
		if(typeof(_page) == "undefined") {
			_page = this.activePage;
		}
		
		return $('page' + _page + '-' + id);
	},
	getDefaultPage:function() {
		// TODO: pull from preferences
		return 0;
	},
	setActivePage:function(page) {
		this.activePage = page;
		//IC+ $('pageTitle').update(this.getCurrentPageModel().getTitle());
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
			items: [{label: $L('Add'), command: 'add'},{label: $L('Edit'), command: 'edit', disabled:disabled},{label: $L('Remove'), command: 'delete', disabled:disabled}]
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
		var c = [];
		for(var i=0;i<pages.length;i++) {
			var contacts = pages[i].getContacts();
			for(var key in contacts) {
	  			c.push(contacts[key].id);
	  		}
	  	}
	  		
		this.controller.stageController.pushScene(
		  { appId :'com.palm.app.contacts', name: 'list' },
		  { mode: 'picker', exclusions: c, message: $L("Select a Contact")}
		 );
	},
	onEditContact:function() {
		try {
			var c = LBB.Model.getInstance().findContactById(this.selected.id.substring(3));
			if(c.contact != null) {
				this.controller.stageController.pushScene("edit-contact", c.contact);
			}
		} catch (e) {
			Mojo.Log.error("Unable to find a contact for selected contact.  selected might not exist.  Msg: " + e);
		}
	},
	// TODO: copied from edit-contact.  need to remove duplicate code
	onRemoveContact:function() {
		//Mojo.Log.info("> EditContactAssistant.onDelete");
		
		this.controller.showAlertDialog(
		{
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
			m.remove(this.selected.id.substring(3));
			m.save();
			
			this.invalidate();
		}
	},
	onPageButtonTap:function(event) {
	
		event.stopPropagation();
	},
	onClearSelected:function(event) {
		//Mojo.Log.info("> MainAssistant.onClearSelected");
		if(this.selected != null) this.selected.mojo.select(false);
		this.selected = null;
	},
	handleModelChanged:function(contact) {
		//Mojo.Log.info("> MainAssistant.handleModelChanged");
		
		LBB.Model.save();
	},
	onContactSelected:function(contact) {
		this.getCurrentPageModel().getContacts().push(contact);
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
		
		event.stopPropagation();
	},
	onEnableDrag:function(e) {
		//Mojo.Log.info("> MainAssistant.onEnableDrag");
		
		this.onClearSelected();

		var pageCount = this.getModel().getPages().length;
		for(var i=0;i<pageCount;i++) {
			Mojo.Drag.setupDropContainer(this.getScroller(i), new DropTarget(this));
		}
		
		var dim = this.getLayoutDimensions();
		
		// have to set maxHorizontalPixel to width of scroller - size of qc.  subtraction seems (is) arbitrary.
		// guessing that dragger won't let *left* side of element go beyond that point ....
		var m =
		{
			allowExit:true,
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
		if(this.dragger == null) return;

		var contactId = this.dragger.element.id.split("_")[1];
		var m = this.getCurrentPageModel();
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
			
			// fixes horizontal scroller positioning
			$('h-scroller').mojo.setSnapIndex(this.activePage);
			
			// fixes grid offset high when scrolled down in previous orientation
			this.getScroller().mojo.scrollTo(0,0,false);
		}
	},
	onPageChange:function(event) {
		//Mojo.Log.info("> onPageChange");
		//var prevPage = event.oldValue;
		var page = event.value;
		
		this.setActivePage(page);
	},
	onHover:function(position) {
		var dim = this.getLayoutDimensions();
		nextPage = this.getScroller().offsetWidth-(dim.size/2)-5;
		prevPage = (dim.size/2)+5;
		
		if( (position.x <= prevPage || position.x >= nextPage) && this.pageChangeTimer == null) {
			this.pageChangeDirection = (position.x <= prevPage) ? -1 : 1;
			this.pageChangeTimer = setTimeout(this.handlers.onPageChangeTimer, 1000);
		} else if (position.x > prevPage && position.x < nextPage && this.pageChangeTimer != null) {
			clearTimeout(this.pageChangeTimer);
			this.pageChangeTimer = null;
		}
		
		this.layoutContactsByPage(this.activePage, position);
	},
	onPageChangeTimer:function() {
		$('h-scroller').mojo.setSnapIndex(this.activePage+this.pageChangeDirection, true);
		
		// reset
		clearTimeout(this.pageChangeTimer);
		this.pageChangeTimer = null;
		this.pageChangeDirection = 0;
	},
	onAddPage:function() {
		var m = this.getModel();
		m.getPages().push(new LBB.Page("Untitled Page", []));
		m.save();
	},
	onRemovePage:function() {
		this.controller.showAlertDialog(
		{
			onChoose:this.onConfirmRemovePage.bind(this),
			title:$L("Confirm Deletion"),
			message:$L("Are you sure you want to delete this page?"),
			choices:
			[
				{label:"Delete",value:"DELETE",type:"negative"},
				{label:"Cancel",value:"CANCEL",type:"dismiss"},
			]
		});
	},
	onConfirmRemovePage:function() {
		var m = this.getModel();
		m.getPages().splice(this.activePage, 1);
		m.save();	
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
});