var MainAssistant = Class.create(MainAssistantBase, {
	initialize:function($super, model, prefs) {
		$super(model, prefs);
		this.handlers.bind(["onConfirmUpgrade", "onCancelUpgrade"]);
	},
	setup:function($super) {
		$super();
		this.setupUpgradeDialog();
	},
	cleanup:function($super) {
		this.controller.stopListening($('upgrade-button'), Mojo.Event.tap, this.handlers.onConfirmUpgrade);
		this.controller.stopListening($('cancel-upgrade-button'), Mojo.Event.tap, this.handlers.onCancelUpgrade);
		
		$super();
	},
	setupUpgradeDialog:function() {
		$('upgrade-dialog').hide();
		
		this.controller.setupWidget('upgrade-button', {}, {label:$L("Open in App Catalog"),buttonClass:"affirmative"});
		this.controller.setupWidget('cancel-upgrade-button', {}, {label:$L("Cancel"),buttonClass:"secondary"});
		
		this.controller.listen($('upgrade-button'), Mojo.Event.tap, this.handlers.onConfirmUpgrade);
		this.controller.listen($('cancel-upgrade-button'), Mojo.Event.tap, this.handlers.onCancelUpgrade);
	},
	showUpgradeDialog:function(show) {
		LBB.Util.log("> MainAssistant.showUpgradeDialog");
		
		$('upgrade-dialog')[(show) ? "show" : "hide"]();
	},
	onConfirmUpgrade:function() {
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
});