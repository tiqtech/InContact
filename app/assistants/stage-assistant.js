var StageAssistant = Class.create(
{
	setup:function()
	{
		this.model = null;
		this.showHelp = false;
		this.state = {pref:false,model:false,version:false};

		this.db = new Mojo.Depot({name:"InContact-Contacts",version:1}, this.onCreateDb.bind(this), this.onCreateDbFailure.bind(this));
		
		AdMob.ad.initialize({pub_id:"a14be4b9a87e63a",bg_color:"rgba(237,240,255,.5)",text_color:"#000",test_mode:false});
	},
	onCreateDb:function()
	{
		//Mojo.Log.info("> StageAssistant.onCreateDb");
		LBB.Model.load(this.db, this.onModelReady.bind(this));
		LBB.Preferences.load(this.db, this.onPrefsReady.bind(this));
	},
	onCreateDbFailure:function(errorCode)
	{
		//TODO handle onCreateDbFailure
		Mojo.Log.error("onCreateDbFailure: " + errorCode);
	},
	onPrefsReady:function()
	{
		//Mojo.Log.info("> StageAssistant.onPrefsReady");
		this.state.pref = true;
		this.checkVersion();
		this.onReady();
	},
	onModelReady:function()
	{
		//Mojo.Log.info("> StageAssistant.onModelReady");
		
		this.state.model = true;
		this.onReady();
	},
	onReady:function()
	{
		//Mojo.Log.info("> StageAssistant.onReady");
		if(this.state.model && this.state.pref && this.state.version) {
			if(this.model == null) this.model = LBB.Model.getInstance();

			var prefs = LBB.Preferences.getInstance();
			var rotate = prefs.getProperty("allowRotate");		
			this.controller.setWindowOrientation((rotate) ? "free" : "up");
				
			LBB.Util.loadTheme(this.controller);
			
			if(this.showHelp) {
				this.onShowHelp();
			} else {
				var view = prefs.getProperty("initialView");
				this.onSwapScene(view);
			}
		}
	},
	handleCommand:function(event)
	{
		if (event.type === Mojo.Event.command) {
			switch (event.command) {
				case Mojo.Menu.prefsCmd:
					this.controller.pushScene("prefs");
					break;
				case "scene-list":
					this.onSwapScene("list");
					break
				case "scene-grid":
					this.onSwapScene("main");
					break;
				case Mojo.Menu.helpCmd:
					this.onShowHelp();
					break;
				case "scene-contact":
					this.onEditContact();
					break;
				case "add":
					this.onAddContact();
					break;
			}
		} else if(event.type == Mojo.Event.back) {
			this.onBack();
		}
	},
	onBack:function() {
		var scenes = this.controller.getScenes();
		// when the help scene was shown on start-up due to new version, it's the only scene on the stack
		// if that's the case, swap the scene out with the initial view
		if(scenes.length == 1 && scenes[0].sceneName == "help") {
			var prefs = LBB.Preferences.getInstance();
			var view = prefs.getProperty("initialView");
			this.onSwapScene(view);
			
			event.stop();			
		}
	},
	onSwapScene:function(scene)
	{
		// TODO: figure out why pushScene doesn't work as expected
		if(!this.controller.activeScene() || this.controller.activeScene().sceneName != scene) {
			this.controller.swapScene({
				name:scene,
				transition:Mojo.Transition.crossFade,
				disableSceneScroller:(scene == "main")
			});
		}
				
	},
	onShowHelp:function() {
		this.controller.pushScene("help");
	},
	onAddContact:function()
	{
		var contacts = LBB.Model.getInstance().contacts;
		var c = [];
		for(var key in contacts)
	  		c.push(contacts[key].id);
	  		
		this.controller.pushScene(
		  { appId :'com.palm.app.contacts', name: 'list' },
		  { mode: 'picker', exclusions: c, message: "Select a Contact"}
		 );
	},
	onEditContact:function()
	{
		try {
			var c = LBB.Model.getInstance().findContactById(this.controller.activeScene().assistant.selected.id.substring(3));
			if(c.contact != null) {
				this.controller.pushScene("edit-contact", c.contact);
			}
		} catch (e) {
			Mojo.Log.error("Unable to find a contact for selected contact.  selected might not exist.  Msg: " + e);
		}
	},
	checkVersion:function() {
		new Ajax.Request(Mojo.appPath + "/appinfo.json", {
			method:"get",
			onSuccess:this.onGetVersion.bind(this)
		});
	},
	onGetVersion:function(xhr) {
		//Mojo.Log.info("< onGetVersion");
		
		// should always be 200 ...
		if(xhr.status == 200) {
			var prefs = LBB.Preferences.getInstance();
			var v = prefs.getProperty("version");
			var appInfo = eval('('+xhr.responseText+')');
			
			if(v != appInfo.version) {
				this.showHelp = true
				LBB.Model.getInstance().update(v);
				prefs.setProperty("version", appInfo.version);
			}
		} else {
			Mojo.Log.error("Unable to retrieve version info");
		}
		
		this.state.version = true;
		this.onReady();
	}
});