var _PrefsAssistantBase = {
	initialize:function(model) {
		this.model = model;
		this.prefs = null;
		this.handlers = new HandlerManager(this, ["handleAutoDialChange", "handleAllowRotateChange", "handleIconChange", "handleThemeChange", "handleNamePositionChange", "handleContactSizeChange", "handleCloseActionChange", "handleStartModeChange", "onShowHelpTopic"]);
	},
	setup:function() {
		LBB.Util.log("> LBB.Preferences.setup");
	
		this.prefs = LBB.Preferences.getInstance();
		
		this.controller.get('preferencesTitle').insert($L("Preferences"));
		this.controller.get('generalPreferencesTitle').insert($L("General"));
		this.controller.get('contactPreferencesTitle').insert($L("Contact"));
		
		// auto-dial
		this.controller.get('labelAutoDial').insert($L("Auto-Dial Phone"));
		this.controller.setupWidget('fieldAutoDial', {trueLabel:$L("Yes"),falseLabel:$L("No")},this.prefs.getPropertyObject("autoDial"));
		Mojo.Event.listen(this.controller.get('fieldAutoDial'), Mojo.Event.propertyChange, this.handlers.handleAutoDialChange);
		//Mojo.Event.listen(this.controller.get('helpAutoDial'), Mojo.Event.tap, this.handlers.onShowHelpTopic);
		
		// rotate
		this.controller.get('labelAllowRotate').insert($L("Allow Display Rotation"));
		this.controller.setupWidget('fieldAllowRotate', {label:$L("Allow Display Rotation"),labelPlacement:Mojo.Widget.labelPlacementLeft,trueLabel:$L("Yes"),falseLabel:$L("No")},this.prefs.getPropertyObject("allowRotate"));
		Mojo.Event.listen(this.controller.get('fieldAllowRotate'), Mojo.Event.propertyChange, this.handlers.handleAllowRotateChange);
		
		// initial view
		//this.controller.get('labelInitialView').insert($L("Start Up View"));
		//this.controller.setupWidget('fieldInitialView', {choices:[{label:$L("Grid"),value:"main"},{label:$L("List"),value:"list"}]},this.prefs.getPropertyObject("initialView"));
		//Mojo.Event.listen(this.controller.get('fieldInitialView'), Mojo.Event.propertyChange, this.handlers.handleInitialViewChange);

		// icon
		//this.controller.get('labelIcon').insert($L("Launcher Icon"));
		this.controller.setupWidget('fieldIcon', {label:$L("Launcher Icon"),labelPlacement:Mojo.Widget.labelPlacementLeft,choices:[{label:$L("Default"),value:"icon"},{label:$L("Phone"),value:"phone"}]},this.prefs.getPropertyObject("icon"));
		Mojo.Event.listen(this.controller.get('fieldIcon'), Mojo.Event.propertyChange, this.handlers.handleIconChange);
		
		// theme
		//this.controller.get('labelTheme').insert($L("Theme"));
		this.controller.setupWidget('fieldTheme', {label:$L("Theme"),labelPlacement:Mojo.Widget.labelPlacementLeft,choices:[{label:$L("Default"),value:"default"},{label:$L("Blue Steel"),value:"bluesteel"}, {label:$L("Spring"),value:"spring"}]},this.prefs.getPropertyObject("theme"));
		Mojo.Event.listen(this.controller.get('fieldTheme'), Mojo.Event.propertyChange, this.handlers.handleThemeChange);
		
		// name position
		//this.controller.get('labelNamePosition').insert($L("Contact Name Position"));
		this.controller.setupWidget('fieldNamePosition', {label:$L("Contact Name Position"),labelPlacement:Mojo.Widget.labelPlacementLeft,choices:[{label:$L("Top"),value:"top"},{label:$L("Bottom"),value:"bottom"}, {label:$L("Hidden"),value:"none"}]},this.prefs.getPropertyObject("namePosition"));
		Mojo.Event.listen(this.controller.get('fieldNamePosition'), Mojo.Event.propertyChange, this.handlers.handleNamePositionChange);

		// close on action
		this.controller.setupWidget('fieldCloseAction', {label:$L("Close on Action"),labelPlacement:Mojo.Widget.labelPlacementLeft,choices:[{label:$L("None"),value:"none"},{label:$L("Dial"),value:"phone"}, {label:$L("Any"),value:"any"}]},this.prefs.getPropertyObject("closeAction"));
		Mojo.Event.listen(this.controller.get('fieldCloseAction'), Mojo.Event.propertyChange, this.handlers.handleCloseActionChange);

		// start mode
		this.controller.setupWidget('fieldStartMode', {label:$L("Start Up Mode"),labelPlacement:Mojo.Widget.labelPlacementLeft,choices:[{label:$L("Normal"),value:"normal"},{label:$L("Driving"),value:"driving"}]},this.prefs.getPropertyObject("startMode"));
		Mojo.Event.listen(this.controller.get('fieldStartMode'), Mojo.Event.propertyChange, this.handlers.handleStartModeChange);
		
		// photo size
		//this.controller.get('labelContactSize').insert($L("Photo Size"));
		//this.controller.setupWidget('fieldContactSize', {choices:[{label:"Normal",value:"normal"},{label:"Large",value:"large"}]},this.prefs.getPropertyObject("contactSize"));
		//Mojo.Event.listen(this.controller.get('fieldContactSize'), Mojo.Event.propertyChange, this.handlers.handleContactSizeChange);
	},
	cleanup:function() {
		
		LBB.Preferences.save();
		
		// general prefs
		Mojo.Event.stopListening(this.controller.get('fieldAllowRotate'), Mojo.Event.propertyChange, this.handlers.handleAllowRotateChange);
		Mojo.Event.stopListening(this.controller.get('fieldIcon'), Mojo.Event.propertyChange, this.handlers.handleIconChange);
		Mojo.Event.stopListening(this.controller.get('fieldTheme'), Mojo.Event.propertyChange, this.handlers.handleThemeChange);
		Mojo.Event.stopListening(this.controller.get('fieldStartMode'), Mojo.Event.propertyChange, this.handlers.handleStartModeChange);
		
		// contact prefs
		Mojo.Event.stopListening(this.controller.get('fieldAutoDial'), Mojo.Event.propertyChange, this.handlers.handleAutoDialChange);
		Mojo.Event.stopListening(this.controller.get('fieldNamePosition'), Mojo.Event.propertyChange, this.handlers.handleNamePositionChange);
		Mojo.Event.stopListening(this.controller.get('fieldCloseAction'), Mojo.Event.propertyChange, this.handlers.handleCloseActionChange);
		
		//Mojo.Event.stopListening(this.controller.get('fieldInitialView'), Mojo.Event.propertyChange, this.handlers.handleInitialViewChange);
		//Mojo.Event.stopListening(this.controller.get('fieldContactSize'), Mojo.Event.propertyChange, this.handlers.handleContactSizeChange);
		
		this.handlers.release();
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
	//handleInitialViewChange:function(event) {
	//	this.updateProperty("initialView", event.value);
	//},
	handleNamePositionChange:function(event) {
		this.updateProperty("namePosition", event.value);
	},
	handleContactSizeChange:function(event) {
		this.updateProperty("contactSize", event.value);
	},
	handleCloseActionChange:function(event) {
		this.updateProperty("closeAction", event.value);
	},
	handleIconChange:function(event) {
		this.updateProperty("icon", event.value);
		LBB.Util.updateAppIcon();
	},
	handleThemeChange:function(event) {
		this.updateProperty("theme", event.value);
		LBB.Util.loadTheme(this.controller);
	},
	handleStartModeChange:function(event) {
		this.updateProperty("startMode", event.value);
	},
	updateProperty:function(name, value) {
		this.prefs.setProperty(name, value);
	},
	onShowHelpTopic:function(e) {
		var key = e.currentTarget.getAttribute("helpTopic");
		
		if (key) {
			this.controller.stageController.pushScene("help", key);
		}
	}
};

var PrefsAssistantBase = Class.create(_PrefsAssistantBase);
