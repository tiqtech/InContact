var MainAssistant = Class.create(MainAssistantBase, {
	initialize:function($super, isDeferred) {
		$super(isDeferred);
	},
	setup:function($super) {
		$super();
		this.setupUpgradeDialog();
	},
	activate:function($super, event) {
		$super(event);
		
		this.controller.listen(this.$.get('upgrade-button'), Mojo.Event.tap, this.handlers.onConfirmUpgrade);
		this.controller.listen(this.$.get('cancel-upgrade-button'), Mojo.Event.tap, this.handlers.onCancelUpgrade);
		this.controller.listen(this.$.get('showUpgradeButton'), Mojo.Event.tap, this.handlers.onShowUpgrade)
	},
	deactivate:function($super) {
		$super();
		
		this.controller.stopListening(this.$.get('upgrade-button'), Mojo.Event.tap, this.handlers.onConfirmUpgrade);
		this.controller.stopListening(this.$.get('cancel-upgrade-button'), Mojo.Event.tap, this.handlers.onCancelUpgrade);
		this.controller.stopListening(this.$.get('showUpgradeButton'), Mojo.Event.tap, this.handlers.onShowUpgrade)
	},
	cleanup:function($super) {
		this.controller.stopListening(this.controller.get('upgrade-button'), Mojo.Event.tap, this.handlers.onConfirmUpgrade);
		this.controller.stopListening(this.controller.get('cancel-upgrade-button'), Mojo.Event.tap, this.handlers.onCancelUpgrade);
		
		$super();
	},
	handleCommand:function(event) {
		var dlg = this.controller.get('upgrade-dialog');
		if(event.type == Mojo.Event.back && dlg.visible()) {
			this.showUpgradeDialog(false);
			event.stop();
		}
	},
	setupUpgradeDialog:function() {
		this.$.get('showUpgradeButton').show();
		
		this.$.get('upgrade-dialog').insert(Mojo.View.render({
			"template": "main/upgrade"
		}));
		
		this.controller.setupWidget('upgrade-button', {}, {label:$L("Download"),buttonClass:"affirmative"});
		this.controller.setupWidget('cancel-upgrade-button', {}, {label:$L("Close"),buttonClass:"secondary"});
		this.controller.setupWidget('upgrade-scroller', {mode:'vertical'}, {});
	},
	showUpgradeDialog:function(show) {
		LBB.Util.log("> MainAssistant.showUpgradeDialog");
		
		var transition = this.controller.prepareTransition(Mojo.Transition.crossFade);
		this.controller.get('upgrade-dialog')[(show) ? "show" : "hide"]();
		transition.run();
	},
	onShowUpgrade:function(event) {
		this.showUpgradeDialog(true);
	},
	onConfirmUpgrade:function(event) {
		LBB.Util.log("> MainAssistant.onConfirmUpgrade");
		
		this.controller.serviceRequest("palm://com.palm.applicationManager", {
			method:"open",
			parameters:{ target: "http://developer.palm.com/appredirect/?packageid=com.tiqtech.incontactplus"}
		});

		this.showUpgradeDialog(false);
	},
	onCancelUpgrade:function() {
		LBB.Util.log("> MainAssistant.onCancelUpgrade");
		
		this.showUpgradeDialog(false);
	}
//	onMigrateData:function() {
//		new Mojo.Service.Request('palm://com.palm.applicationManager', {
//		    method: 'launch',
//		    parameters:  {
//		        id: "com.tiqtech.incontactplus",
//				params: {action:"upgrade",model:LBB.Model.getInstance().getContacts(),preferences:LBB.Preferences.getInstance()}
//		    },
//		    onFailure:function(e) {
//				this.controller.getActiveStageController("card").activeScene().assistant.showUpgradeDialog(true, true);
//			}.bind(this)
//		});
//	}
});