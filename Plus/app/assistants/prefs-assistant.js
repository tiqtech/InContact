var _PrefsAssistant = {
	initialize:function($super) {
		$super();
		this.handlers.bind("onLauncherReorder");
		this.themes.unshift({label:$L("Custom"),value:"custom"});
		this.pickerVisible = false;
	},
	setup:function($super) {
		$super();
		
		LBB.Util.log("> PrefsAssistant.setup");
	
		this.prefs = LBB.Preferences.getInstance();
		this.controller.get('launcherPreferencesTitle').insert($L("App Shortcuts"));
		this.launcherItems = this.prefs.getProperty("launcherApps");
		
		this.controller.get('labelCustomBGColor').update($L("Background Color"));
		this.controller.get('labelCustomTextColor').update($L("Accent Color"));
		
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
		
		this.initThemeRow();
	},
	activate:function($super) {
		$super();
		
		this.controller.listen(this.controller.get('fieldCustomBGColor'), Mojo.Event.tap, this.handlers.onSelectBGColor);
		this.controller.listen(this.controller.get('fieldCustomTextColor'), Mojo.Event.tap, this.handlers.onSelectTextColor);
		this.controller.listen(this.controller.document, Mojo.Event.tap, this.handlers.onHidePickers)
		this.controller.listen(this.controller.get('launcherPreferencesList'), Mojo.Event.listReorder, this.handlers.onLauncherReorder);
		
	},
	deactivate:function($super) {
		$super();
		
		this.onHidePickers({});
		
		this.controller.stopListening(this.controller.get('fieldCustomBGColor'), Mojo.Event.tap, this.handlers.onSelectBGColor);
		this.controller.stopListening(this.controller.get('fieldCustomTextColor'), Mojo.Event.tap, this.handlers.onSelectTextColor);
		this.controller.stopListening(this.controller.document, Mojo.Event.tap, this.handlers.onHidePickers);
		this.controller.stopListening(this.controller.get('launcherPreferencesList'), Mojo.Event.listReorder, this.handlers.onLauncherReorder);
	},
	handleCommand:function(event) {
		if(event.type == Mojo.Event.back && this.pickerVisible) {
			this.onHidePickers({});
			event.stop();
		}
	},
	onHidePickers:function(event) {
		var e = event.srcElement;
		
		while(e) {
			if(e.name === "picker-border-box") return;
			e = e.parentNode;
		}
		
		this.pickerVisible = false;
		
		this.controller.get("prefs-scrim").hide();
		this.controller.get('fieldCustomBGColor').color.hidePicker();
		this.controller.get('fieldCustomTextColor').color.hidePicker();
	},
	onLauncherReorder:function(event) {
		this.launcherItems.splice(event.fromIndex, 1);
		this.launcherItems.splice(event.toIndex, 0, event.item);
		
		this.prefs.setProperty("launcherApps", this.launcherItems);
	},
	initThemeRow:function() {

		jscolor.dir = "app/js/jscolor/";
		jscolor.window = this.controller.window;
		jscolor.document = this.controller.document;
		
		var bg = this.controller.get('fieldCustomBGColor');
		var accent = this.controller.get('fieldCustomTextColor');
		
		bg.color = new jscolor.color(bg);
		accent.color = new jscolor.color(accent);
		
		var theme = this.prefs.getProperty("theme");
		
		this.controller.get("customThemeRow")[theme === "custom" ? "show" : "hide"]();
		
		var t = this.getCustomTheme();
		
		bg.style.backgroundColor = t.body.bgcolor;
		accent.style.backgroundColor = t.list.bgcolor;
	},
	handleThemeChange:function($super, event) {
		if(event.value === "custom") {
			this.controller.get("customThemeRow").show();
		} else {
			this.controller.get("customThemeRow").hide();
		}
		
		$super(event);
	},
	onSelectBGColor:function(event) {
		var bg = this.controller.get('fieldCustomBGColor');
		this.pickerVisible = true;
		
		bg.color.callback = Mojo.Function.debounce(undefined, function(color) {
			var theme = this.getCustomTheme();
			theme.body.bgcolor = "#" + color;
			this.prefs.setProperty("customTheme", theme);
			
			LBB.Util.loadTheme(this.controller);
		}.bind(this), 0.25);
		
		this.controller.get("prefs-scrim").show();
		bg.color.showPicker();
		bg.color.importColor();
		event.stopPropagation();
	},
	onSelectTextColor:function(event) {
		var accent = this.controller.get('fieldCustomTextColor');
		this.pickerVisible = true;
		
		accent.color.callback = Mojo.Function.debounce(undefined, function(color) {
			var theme = this.getCustomTheme();
			theme.list.bgcolor = "#" + color;
			this.prefs.setProperty("customTheme", theme);
			
			LBB.Util.loadTheme(this.controller);
		}.bind(this), 0.25);
		
		this.controller.get("prefs-scrim").show();
		accent.color.showPicker();
		accent.color.importColor();
		event.stopPropagation();
	},
	getCustomTheme:function() {
		return this.prefs.getProperty("customTheme") || LBB.Util.newTheme();
	}
};

var PrefsAssistant = Class.create(PrefsAssistantBase,_PrefsAssistant);