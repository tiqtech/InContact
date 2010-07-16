var PrefsAssistant = Class.create(
{
	initialize:function(model) {
		this.model = model;
		this.prefs = null;
		this.handlers = new HandlerManager(this, ["handleAutoDialChange", "handleAllowRotateChange", "handleInitialViewChange", "handleIconChange", "handleThemeChange", "handleNamePositionChange", "handleContactSizeChange"]);
	},
	setup:function() {
		//Mojo.Log.info("> LBB.Preferences.setup");
	
		this.prefs = LBB.Preferences.getInstance();
		
		$('generalPreferencesTitle').insert($L("General Preferences"));
		//$('contactPreferencesTitle').insert($L("Contact Preferences"));
	
		// auto-dial
		$('labelAutoDial').insert($L("Auto-Dial Phone"));
		this.controller.setupWidget('fieldAutoDial', {trueLabel:$L("Yes"),falseLabel:$L("No")},this.prefs.getPropertyObject("autoDial"));
		Mojo.Event.listen($('fieldAutoDial'), Mojo.Event.propertyChange, this.handlers.handleAutoDialChange);
		
		// rotate
		$('labelAllowRotate').insert($L("Allow Display Rotation"));
		this.controller.setupWidget('fieldAllowRotate', {trueLabel:$L("Yes"),falseLabel:$L("No")},this.prefs.getPropertyObject("allowRotate"));
		Mojo.Event.listen($('fieldAllowRotate'), Mojo.Event.propertyChange, this.handlers.handleAllowRotateChange);
		
		// initial view
		$('labelInitialView').insert($L("Start Up View"));
		this.controller.setupWidget('fieldInitialView', {choices:[{label:$L("Grid"),value:"main"},{label:$L("List"),value:"list"}]},this.prefs.getPropertyObject("initialView"));
		Mojo.Event.listen($('fieldInitialView'), Mojo.Event.propertyChange, this.handlers.handleInitialViewChange);

		// icon
		$('labelIcon').insert($L("Launcher Icon"));
		this.controller.setupWidget('fieldIcon', {choices:[{label:$L("Default"),value:"icon"},{label:$L("Phone"),value:"phone"}]},this.prefs.getPropertyObject("icon"));
		Mojo.Event.listen($('fieldIcon'), Mojo.Event.propertyChange, this.handlers.handleIconChange);
		
		// theme
		$('labelTheme').insert($L("Theme"));
		this.controller.setupWidget('fieldTheme', {choices:[{label:$L("Default"),value:"default"},{label:$L("Blue Steel"),value:"bluesteel"}, {label:$L("Spring"),value:"spring"}]},this.prefs.getPropertyObject("theme"));
		Mojo.Event.listen($('fieldTheme'), Mojo.Event.propertyChange, this.handlers.handleThemeChange);
		
		// name position
		$('labelNamePosition').insert($L("Contact Name Position"));
		this.controller.setupWidget('fieldNamePosition', {choices:[{label:$L("Top"),value:"top"},{label:$L("Bottom"),value:"bottom"}, {label:$L("Hidden"),value:"none"}]},this.prefs.getPropertyObject("namePosition"));
		Mojo.Event.listen($('fieldNamePosition'), Mojo.Event.propertyChange, this.handlers.handleNamePositionChange);
		
		// photo size
		//$('labelContactSize').insert($L("Photo Size"));
		//this.controller.setupWidget('fieldContactSize', {choices:[{label:"Normal",value:"normal"},{label:"Large",value:"large"}]},this.prefs.getPropertyObject("contactSize"));
		//Mojo.Event.listen($('fieldContactSize'), Mojo.Event.propertyChange, this.handlers.handleContactSizeChange);
	},
	cleanup:function() {
		Mojo.Event.stopListening($('fieldAutoDial'), Mojo.Event.propertyChange, this.handlers.handleAutoDialChange);
		Mojo.Event.stopListening($('fieldAllowRotate'), Mojo.Event.propertyChange, this.handlers.handleAllowRotateChange);
		Mojo.Event.stopListening($('fieldInitialView'), Mojo.Event.propertyChange, this.handlers.handleInitialViewChange);
		Mojo.Event.stopListening($('fieldIcon'), Mojo.Event.propertyChange, this.handlers.handleIconChange);
		Mojo.Event.stopListening($('fieldTheme'), Mojo.Event.propertyChange, this.handlers.handleThemeChange);
		Mojo.Event.stopListening($('fieldNamePosition'), Mojo.Event.propertyChange, this.handlers.handleNamePositionChange);
		Mojo.Event.stopListening($('fieldContactSize'), Mojo.Event.propertyChange, this.handlers.handleContactSizeChange);
	},
	activate:function(event) {
		
	},
	deactivate:function(event) {
		var rotate = LBB.Preferences.getInstance().getProperty("allowRotate");
		
		this.controller.stageController.setWindowOrientation((rotate) ? "free" : "up");
	},
	handleAutoDialChange:function(event) {
		this.updateProperty("autoDial", event.value);
	},
	handleAllowRotateChange:function(event) {
		this.updateProperty("allowRotate", event.value);
	},
	handleAsyncPhotoChange:function(event) {
		this.updateProperty("asyncPhoto", event.value);
	},
	handleInitialViewChange:function(event) {
		this.updateProperty("initialView", event.value);
	},
	handleNamePositionChange:function(event) {
		this.updateProperty("namePosition", event.value);
	},
	handleContactSizeChange:function(event) {
		this.updateProperty("contactSize", event.value);
	},
	handleIconChange:function(event) {
		this.updateProperty("icon", event.value);
		LBB.Util.updateAppIcon();
	},
	handleThemeChange:function(event) {
		this.updateProperty("theme", event.value);
		LBB.Util.loadTheme(this.controller);
	},
	updateProperty:function(name, value) {
		this.prefs.setProperty(name, value);
	}
});

