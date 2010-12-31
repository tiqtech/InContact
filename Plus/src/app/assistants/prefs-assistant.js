var _PrefsAssistant = {
	initialize:function($super) {
		$super();
		this.handlers.bind("onLauncherReorder");
	},
	setup:function($super) {
		$super();
		
		LBB.Util.log("> PrefsAssistant.setup");
	
		this.prefs = LBB.Preferences.getInstance();
		this.controller.get('launcherPreferencesTitle').insert($L("App Shortcuts"));
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
		
		this.controller.listen(this.controller.get('launcherPreferencesList'), Mojo.Event.listReorder, this.handlers.onLauncherReorder);
	},
	onLauncherReorder:function(event) {
		this.launcherItems.splice(event.fromIndex, 1);
		this.launcherItems.splice(event.toIndex, 0, event.item);
		
		this.prefs.setProperty("launcherApps", this.launcherItems);
	}
};

var PrefsAssistant = Class.create(PrefsAssistantBase,_PrefsAssistant);