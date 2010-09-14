var _MainAssistant = {
	initialize:function($super, model, prefs) {
		$super(model, prefs);
		
		this.handlers.bind(["onPageButtonTap","onPageAction"]);
	},
	setup:function($super) {
		$super();
		
		$('pageButton').show();
		$('pageTicks').show();
		
		this.controller.listen($('pageButton'), Mojo.Event.tap, this.handlers.onPageButtonTap);
	},
	activate:function($super, event) {
		$super(event);
		
		// captures changes to launcher from preferences
		LBB.Util.updateCommandMenuModel(this.controller);
	},
	cleanup:function($super) {
	
		this.controller.stopListening($('pageButton'), Mojo.Event.tap, this.handlers.onPageButtonTap);
		
		$super();	// calling at end because super calls handlers.release()
	},
	updateScrollers:function() {
		// re-setup h-scroller
		this.controller.setupWidget('h-scroller', {mode:'horizontal-snap'}, this.hScrollerModel);
		this.controller.newContent($('h-scroller'));
		this.resizeScroller();
	},
	setupPageScroller:function($super, i) {
		$super(i);
		
		var e = new Element("div", {id:"page" + i + "-tick-mark", class:"tickMark"});
		$('pageTicks').insert(e);
	},
	getTickMark:function(page, idOnly) {
		return this.getPageElement("tick-mark", page, idOnly);
	},
	setActivePage:function($super, page) {
		$super(page);
		this.setPageTitle();
		this.onClearSelected();
		
		// snap to current page.  insulate from incomplete setup.
		var hScroller = $('h-scroller');
		if(hScroller && hScroller.mojo) {
			hScroller.mojo.setSnapIndex(this.activePage, true);
		}
		
		// update tick marks
		for(var i=0;i<this.getModel().getPages().length;i++) {
			var tm = this.getTickMark(i);
			if(i == page) {
				tm.hide();
			} else {
				tm.show();
				if(i < page) {
					tm.addClassName("active");
				} else {
					tm.removeClassName("active");
				}
			}
		}
	},
	setPageTitle:function() {
		$('pageTitle').update(this.getCurrentPageModel().getTitle());
	},
	onPageChangeTimer:function() {
		$('h-scroller').mojo.setSnapIndex(this.activePage+this.pageChangeDirection, true);
		
		// reset
		clearTimeout(this.pageChangeTimer);
		this.pageChangeTimer = null;
		this.pageChangeDirection = 0;
	},
	onPageButtonTap:function(event) {
		Mojo.Log.info("> onPageButtonTap");
		
		var items = [
				{label: $L('Add'), command: 'add'},
				{label: $L('Rename'), command: 'rename'},
				{label: $L('Remove'), command: 'delete', disabled:disabled}
			];
		
		// add page-wide contact actions when page has contacts
		if(this.getCurrentPageModel().hasContacts()) {
			items.push({
				label: $L('Actions'),
				items:[
					{label:$L('SMS Page'), command:'sms-page'},
					{label:$L('Email Page'), command:'email-page'}
				]
			});
		}

		var disabled = (this.getModel().getPages().length==1);
		this.controller.popupSubmenu({
			onChoose:this.handlers.onPageAction,
			placeNear:event.target,
			items:items 
		});
		
		event.stopPropagation();
	},
	onPageAction:function(command) {
		switch(command) {
			case 'add':
				this.onAddPage();
				break;
			case 'rename':
				this.onRenamePage();
				break;
			case 'delete':
				this.onRemovePage();
				break;
			case 'sms-page':
				this.onSmsPage();
				break;
			case 'email-page':
				this.onEmailPage();
				break;
		}
	},
	onAddPage:function() {
		var m = this.getModel();
		var p = m.getPages();
		
		// create page and save model
		p.push(new LBB.Page($L("New Page")));
		m.save();
		
		var index = p.length-1;
		
		// setup new page scroller and add to snapElements
		this.setupPageScroller(index);
		this.hScrollerModel.snapElements.x.push($('page'+index+'-scroller'));
		
		// update scrollers
		this.updateScrollers();
		this.setActivePage(index);
	},
	onRemovePage:function() {
		this.controller.showAlertDialog(
		{
			onChoose:this.onConfirmRemovePage.bind(this),
			title:$L("Confirm Removal"),
			message:$L("Are you sure you want to remove this page?"),
			choices:
			[
				{label:$L("Remove Page And Contacts"), value:"DELETE",type:"negative"},
				{label:$L("Remove Page Only"),value:"PRESERVE",type:"secondary"},
				{label:$L("Cancel"),value:"CANCEL",type:"dismiss"},
			]
		});
	},
	onConfirmRemovePage:function(command) {
		var doDelete = (command == "DELETE");
		var m = this.getModel();
		var p = m.getPages();
		
		var destPage = (this.activePage == p.length-1) ? this.activePage-1 : this.activePage+1;
		
		if(command == "PRESERVE") {
			doDelete = true;

			var c = p[this.activePage].getContacts();
			for(var i=0;i<c.length;i++) {
				p[destPage].getContacts().push(c[i]);
			}
		}
		
		if(doDelete) {
			// remove from snap elements
			this.hScrollerModel.snapElements.x.splice(this.activePage, 1);
			
			// re-id scrollers
			for(var i=0;i<p.length;i++) {
				if(i == this.activePage) continue;
				var i2 = (i > this.activePage) ? i-1 : i;
				
				this.getScroller(i).id = this.getScroller(i2, true);
				this.getScrollWrapper(i).id = this.getScrollWrapper(i2, true);
				this.getPaddingElement(i).id = this.getPaddingElement(i2, true);
				this.getTickMark(i).id = this.getTickMark(i2, true);
			}
			
			// remove html elements
			this.getScroller().remove();
			this.getTickMark().remove();

			// remove from model
			p.splice(this.activePage, 1);
			m.save();

			// destPage is the location to which contacts were moved.  when removing the second to last page,
			// destPage will be out of bounds for the array of pages so we must decrement to last page.
			// otherwise, destPage is the correct page to focus 
			var activePage = (destPage == p.length) ? p.length - 1 : destPage;
			
			this.setActivePage(activePage);
			this.updateScrollers();
			this.invalidate();
		}
	},
	onRenamePage:function() {
		this.controller.showDialog({
    		template: 'dialogs/input',
    		assistant: new RenamePageAssistant(this, {pageTitle:this.getCurrentPageModel().getTitle()})
    	});
	},
	onConfirmRenamePage:function(newTitle) {
		this.getCurrentPageModel().title = newTitle;
		this.getModel().save();
		
		this.setPageTitle();
	},
	onSmsPage:function() {
		var r = [];
		var c = this.getCurrentPageModel().getContacts();
		for(var i=0;i<c.length;i++) {
			var pref = Mojo.Widget.QuickContact.getPreference(c[i], "sms");
			if(typeof(pref) == "object") {
				r.push({address: pref.value});
			}
		}
		
		if (r.length == 0) {
			Mojo.Log.info("nada");
		} else {
			this.controller.serviceRequest('palm://com.palm.applicationManager', {
				method: 'launch',
				parameters: {
					id: "com.palm.app.messaging",
					params: {composeRecipients: r}
				}
			});
		}
	},
	onEmailPage:function() {
		var r = [];
		var c = this.getCurrentPageModel().getContacts();
		for(var i=0;i<c.length;i++) {
			var pref = Mojo.Widget.QuickContact.getPreference(c[i], "email");
			if(typeof(pref) == "object") {
				r.push({type:"email",role:1,value: pref.value});
			}
		}
		
		if (r.length == 0) {
			Mojo.Log.info("nada");
		} else {
			this.controller.serviceRequest("palm://com.palm.applicationManager", {
				method: 'open',
				parameters: {
					id: "com.palm.app.email",
					params: {
						recipients: r
					}
				}
			});
		}
		
	},
	onHover:function($super, position) {
		$super(position);
		/*
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
		*/
	}
};

var _RenamePageAssistant = {
	initialize:function(caller, model) {
		this.caller = caller;
		this.model = model;
		this.handlers = new HandlerManager(this, ["onOk", "onExit"]); 
	},
	setup:function(widget) {
		this.widget = widget;
				
		$('dialogLabel').update($L('Rename Page'));
		this.caller.controller.setupWidget('currentValue', {}, {value:this.model.pageTitle});
		this.caller.controller.setupWidget('okButton', {}, {label:$L("OK"),buttonClass:"affirmative"});
		this.caller.controller.setupWidget('cancelButton', {}, {label:$L("Cancel"),buttonClass:"secondary"}); 
		
		this.caller.controller.listen($('okButton'), Mojo.Event.tap, this.handlers.onOk);
		this.caller.controller.listen($('cancelButton'), Mojo.Event.tap, this.handlers.onExit);
	},
	cleanup:function() {
		this.caller.controller.stopListening($('okButton'), Mojo.Event.tap, this.handlers.onOk);
		this.caller.controller.stopListening($('cancelButton'), Mojo.Event.tap, this.handlers.onExit);
		
		this.handlers.release();
	},
	onOk:function() {
		this.caller.onConfirmRenamePage($('currentValue').mojo.getValue());
		
		this.onExit();
	},
	onExit:function() {
		this.widget.mojo.close();
	}
};

var RenamePageAssistant = Class.create(_RenamePageAssistant);
var MainAssistant = Class.create(MainAssistantBase, _MainAssistant); 