var PrefsAssistant = Class.create(
{
	initialize:function(model)
	{
		this.model = model;
		this.prefs = null;
	},
	setup:function() {
		//Mojo.Log.info("> LBB.Preferences.setup");
	
		this.prefs = LBB.Preferences.getInstance();
	
		// auto-dial
		this.controller.setupWidget('fieldAutoDial', {trueLabel:"Yes",falseLabel:"No"},this.prefs.getPropertyObject("autoDial"));
		Mojo.Event.listen($('fieldAutoDial'), Mojo.Event.propertyChange, this.handleAutoDialChange.bind(this));
		
		// rotate
		this.controller.setupWidget('fieldAllowRotate', {trueLabel:"Yes",falseLabel:"No"},this.prefs.getPropertyObject("allowRotate"));
		Mojo.Event.listen($('fieldAllowRotate'), Mojo.Event.propertyChange, this.handleAllowRotateChange.bind(this));
		
		// initial view
		this.controller.setupWidget('fieldInitialView', {choices:[{label:"Grid",value:"main"},{label:"List",value:"list"}]},this.prefs.getPropertyObject("initialView"));
		Mojo.Event.listen($('fieldInitialView'), Mojo.Event.propertyChange, this.handleInitialViewChange.bind(this));

		// icon
		this.controller.setupWidget('fieldIcon', {choices:[{label:"Default",value:"icon"},{label:"Phone",value:"phone"}]},this.prefs.getPropertyObject("icon"));
		Mojo.Event.listen($('fieldIcon'), Mojo.Event.propertyChange, this.handleIconChange.bind(this));
		
		// theme
		this.controller.setupWidget('fieldTheme', {choices:[{label:"Default",value:"default"},{label:"Blue Steel",value:"bluesteel"}, {label:"Spring",value:"spring"}]},this.prefs.getPropertyObject("theme"));
		Mojo.Event.listen($('fieldTheme'), Mojo.Event.propertyChange, this.handleThemeChange.bind(this));
		
		// async photo load
		//this.controller.setupWidget('fieldAsyncPhoto', {trueLabel:"Yes",falseLabel:"No"},this.prefs.getPropertyObject("asyncPhoto"));
		//Mojo.Event.listen($('fieldAsyncPhoto'), Mojo.Event.propertyChange, this.handleAsyncPhotoChange.bind(this));
	},
	activate:function(event) {
		
	},
	deactivate:function(event) {
		var rotate = LBB.Preferences.getInstance().getProperty("allowRotate");
		
		this.controller.stageController.setWindowOrientation((rotate) ? "free" : "up");
	},
	handleAutoDialChange:function(event)
	{
		this.updateProperty("autoDial", event.value);
	},
	handleAllowRotateChange:function(event)
	{
		this.updateProperty("allowRotate", event.value);
	},
	handleAsyncPhotoChange:function(event)
	{
		this.updateProperty("asyncPhoto", event.value);
	},
	handleInitialViewChange:function(event)
	{
		this.updateProperty("initialView", event.value);
	},
	handleIconChange:function(event) {
		this.updateProperty("icon", event.value);
		LBB.Util.updateAppIcon();
	},
	handleThemeChange:function(event) {
		this.updateProperty("theme", event.value);
		LBB.Util.loadTheme(this.controller);
	},
	updateProperty:function(name, value)
	{
		this.prefs.setProperty(name, value);
	}
});

