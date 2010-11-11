var MainAssistant = Class.create(MainAssistantBase, {
	initialize:function($super, model, prefs) {
		$super(model, prefs);
		this.handlers.bind(["onConfirmUpgrade", "onCancelUpgrade", "onShowUpgrade"]);
	},
	setup:function($super) {
		$super();
		this.setupUpgradeDialog();
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
		this.controller.get('showUpgradeButton').show();
		
		this.controller.setupWidget('upgrade-button', {}, {label:$L("Download"),buttonClass:"affirmative"});
		//this.controller.setupWidget('migrate-button', {}, {label:$L("Copy Data to Plus"),buttonClass:"primary"});
		this.controller.setupWidget('cancel-upgrade-button', {}, {label:$L("Close"),buttonClass:"secondary"});
		this.controller.setupWidget('upgrade-scroller', {mode:'vertical'}, {});
		
		this.controller.listen(this.controller.get('upgrade-button'), Mojo.Event.tap, this.handlers.onConfirmUpgrade);
		//this.controller.listen(this.controller.get('migrate-button'), Mojo.Event.tap, this.handlers.onMigrateData);
		this.controller.listen(this.controller.get('cancel-upgrade-button'), Mojo.Event.tap, this.handlers.onCancelUpgrade);
		this.controller.listen(this.controller.get('showUpgradeButton'), Mojo.Event.tap, this.handlers.onShowUpgrade)
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