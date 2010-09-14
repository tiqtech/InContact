var _PrefsAssistant = {
	initialize:function($super) {
		$super();
		this.handlers.bind("onLauncherReorder");
	},
	setup:function($super) {
		$super();
		
		LBB.Util.log("> PrefsAssistant.setup");
	
		this.prefs = LBB.Preferences.getInstance();
		$('launcherPreferencesTitle').insert($L("Launcher"));
		this.launcherItems = this.prefs.getProperty("launcherApps");

		this.controller.setupWidget("launcherPreferencesList", {
				itemTemplate: "prefs/launcher-list-item",
				swipeToDelete: false,
				reorderable: true,
				fixedHeightItems: true,
				hasNoWidgets:false
			}, {
				items:this.launcherItems
			}
		);
		
		this.controller.listen($('launcherPreferencesList'), Mojo.Event.listReorder, this.handlers.onLauncherReorder);
	},
	onLauncherReorder:function(event) {
		LBB.Preferences.getInstance().setProperty("launcherApps", this.launcherItems);
	}
};

var PrefsAssistant = Class.create(PrefsAssistantBase,_PrefsAssistant);