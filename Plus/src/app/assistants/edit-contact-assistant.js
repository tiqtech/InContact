var _EditContactAssistant = {
	areActionsReorderable:true,
	initialize:function($super, model) {
		$super(model);
		this.handlers.bind(["onReorder","onIconTap","onLabelTap","onScrimTap"]);
	},
	onItemRendered:function($super, listWidget, itemModel, itemNode) {
		$super(listWidget, itemModel, itemNode);
		
		var i = itemModel.index;
		this.controller.listen(this.controller.get("edit-contact-icon-"+i), Mojo.Event.tap, this.handlers.onIconTap);
		this.controller.listen(this.controller.get("edit-contact-label-wrapper-"+i), Mojo.Event.tap, this.handlers.onLabelTap);
	},
	cleanup:function($super) {
		for(var i=0;i<4;i++) {
			this.controller.stopListening(this.controller.get("edit-contact-icon-"+i), Mojo.Event.tap, this.handlers.onIconTap);
			this.controller.stopListening(this.controller.get("edit-contact-label-wrapper-"+i), Mojo.Event.tap, this.handlers.onLabelTap);
		}
		
		$super();
	},
	activate:function(event) {
		this.controller.listen(this.controller.get('contactPointList'), Mojo.Event.listReorder, this.handlers.onReorder);
		this.controller.listen(this.controller.get('dialog-overlay'), Mojo.Event.tap, this.handlers.onScrimTap);
	},
	deactivate:function(event) {
		this.controller.stopListening(this.controller.get('contactPointList'), Mojo.Event.listReorder, this.handlers.onReorder)
		this.controller.stopListening(this.controller.get('dialog-overlay'), Mojo.Event.tap, this.handlers.onScrimTap);
	},
	showDialog:function(placeNear, content) {
		var dlg = this.controller.get('dialog-overlay');
		
		var c = new Element("div", {"class":"dialog"})
		c.update(content);
		
		var transition = this.controller.prepareTransition(Mojo.Transition.crossFade);
		dlg.update(c);
		dlg.show();
		
		c.setStyle({
			"top": ((this.controller.getSceneScroller().getDimensions().height - c.getDimensions().height)/2) + "px"
		});
		
		transition.run();
		
		return c;
	},
	handleCommand:function(event) {
		if(event.type == Mojo.Event.back && this.controller.get('dialog-overlay').visible()) {
			this.onScrimTap();
			event.stop();
		}
	},
	onReorder:function(event) {
		LBB.Util.log("> EditContactAssistant.onReorder");
		
		// move item.  not sure why the list isn't handling this
		this.buttonModel.splice(event.fromIndex, 1);
		this.buttonModel.splice(event.toIndex, 0, event.item);
		
		// set flag to avoid invalidateItems
		this.listAction = true;
		this.controller.modelChanged(this.buttonModel);
	},
	onIconTap:function(event) {
		
		var n = this.resolveNode(event);
		if(!n) return;
		
		var content = Mojo.View.render({template:"edit-contact/icon",collection:this.ICONS});
		
		var dlg = this.showDialog(n.node, content);
		this.controller.listen(dlg, Mojo.Event.tap, function(event) {
			var n = event.target;
			
			if(n.nodeName != "IMG") return;
			
			// update model
			this.buttonModel[this.selectedIconIndex].icon = n.getAttribute("icon");
			this.controller.modelChanged(this.buttonModel);
			
		}.bind(this));
	},
	onLabelTap:function(event) {
		var n = this.resolveNode(event);
		if(!n) return;
		
		var items = [];	
		items.push({label:$L("Action")})
		for(var k in Mojo.Widget.QuickContact.ActionMap) {
			items.push({
				label:Mojo.Widget.QuickContact.ActionMap[k].label,
				command:k
			});
		}
		
		this.controller.popupSubmenu({
			onChoose:function(action) {
				// if action is undefined here, then scrim was tapped
				if (action && this.buttonModel[this.selectedIconIndex].action != action) {
					this.buttonModel[this.selectedIconIndex].action = action;
					
					// set details to "no selection" if options exist
					var details;
					if(this.model[Mojo.Widget.QuickContact.ActionMap[action].list]) {
						details = Mojo.Widget.QuickContact.SelectNone;
					}
					
					this.buttonModel[this.selectedIconIndex].details = details;
					this.controller.modelChanged(this.buttonModel);
				}
			},
			items:items
		});
	},
	onScrimTap:function(event) {
		
		this.selectedIconIndex = undefined;

		var transition = this.controller.prepareTransition(Mojo.Transition.crossFade);
		this.controller.get('dialog-overlay').hide();
		transition.run();
	}
};

var EditContactAssistant = Class.create(EditContactAssistantBase, _EditContactAssistant);