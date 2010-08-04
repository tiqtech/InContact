var AppAssistant = Class.create(
{
	initialize:function() {
		//Mojo.Log.info("> AppAssistant.initialize");
		
		this.handlers = new HandlerManager(this, ["startMainStage", "onCreateDb", "onCreateDbFailure", "onModelReady", "onPrefsReady", "onGetVersion"]);
		this.model = null;
		this.showHelp = false;
		this.state = {pref:false,model:false,version:false};
		this.versionCookie = new Mojo.Model.Cookie("version");
		this.settings = {
			mode:"normal"	// normal or driving
		};
	},
	setup:function() {
		this.setUpdateIconAlarm();
	},
	cleanup:function() {
	},
	handleLaunch:function(params) {
		if(params.action == "updateIcon") {
			// TODO: create background stage
			this.updateIcon();
		} else {
			var c = this.controller.getStageController("main");
			if(!c) {
				this.controller.createStageWithCallback("main", this.handlers.startMainStage, "card");
			} else {
				c.activate();
			}
		}
	},
	startMainStage:function(stageController) {
		this.loadDepot(true);
	},
	loadDepot:function(isForeground) {
		this.isForeground = isForeground
		this.db = new Mojo.Depot({name:"InContact-Contacts",version:1}, this.handlers.onCreateDb, this.handlers.onCreateDbFailure);
	},
	updateIcon:function() {
		var prefs = LBB.Preferences.getInstance();
		
		if(prefs.isLoaded()) {
			LBB.Util.updateAppIcon();
			this.setUpdateIconAlarm();
		} else {
			this.loadDepot(false);
		}
	},
	setUpdateIconAlarm:function() {
		new Mojo.Service.Request("palm://com.palm.power/timeout", {
		    method: "set",
		    parameters: {
		        "wakeup": false,
		        "key": "updateIcon",
		        "uri": "palm://com.palm.applicationManager/launch",
		        "params": '{"id":"com.tiqtech.incontact","params":{"action":"updateIcon"}}',
		        "in": "00:15:00"
		    },
		    onFailure: function(e) { Mojo.Log.info("alarm failed",Object.toJSON(e)); }
		});
	},
	onCreateDb:function()
	{
		//Mojo.Log.info("> AppAssistant.onCreateDb");
		
		LBB.Model.load(this.db, this.handlers.onModelReady);
		LBB.Preferences.load(this.db, this.handlers.onPrefsReady);
	},
	onCreateDbFailure:function(errorCode)
	{
		//TODO handle onCreateDbFailure
		Mojo.Log.error("onCreateDbFailure: " + errorCode);
	},
	onPrefsReady:function()
	{
		//Mojo.Log.info("> AppAssistant.onPrefsReady");
	
		this.state.pref = true;
		this.onReady();
	},
	onModelReady:function()
	{
		//Mojo.Log.info("> AppAssistant.onModelReady");

		this.state.model = true;
		this.checkVersion();
		this.onReady();
	},
	onReady:function()
	{
		//Mojo.Log.info("> AppAssistant.onReady");
		if(this.state.model == true && this.state.pref == true && this.state.version == true) {
			if(this.model == null) this.model = LBB.Model.getInstance();
			
			LBB.Util.updateAppIcon();
			
			if(this.isForeground) {			
				var prefs = LBB.Preferences.getInstance();
				var rotate = prefs.getProperty("allowRotate");
				
				var controller = this.controller.getActiveStageController("card");		
				controller.setWindowOrientation((rotate) ? "free" : "up");
				
				if(this.showHelp == true) {
					this.onShowHelp();
				} else {
					//var view = prefs.getProperty("initialView");
					this.onSwapScene("main");
				}
			}
		}
	},
	handleCommand:function(event)
	{
		if (event.type === Mojo.Event.command) {
			switch (event.command) {
				case Mojo.Menu.prefsCmd:
					this.controller.getActiveStageController("card").pushScene("prefs");
					break;
//				case "scene-list":
//					this.onSwapScene("list");
//					break
//				case "scene-grid":
//					this.onSwapScene("main");
//					break;
				case Mojo.Menu.helpCmd:
					this.onShowHelp();
					break;
				case "scene-contact":
					this.onEditContact();
					break;
				case "add":
					this.onAddContact();
					break;
				case "mode-driving":
					this.onModeChange("driving");
					break;
				case "mode-normal":
					this.onModeChange("normal");
					break;
				case "launch-phone":
					this.onLaunch("com.palm.app.phone");
					break;
				case "launch-email":
					this.onLaunch("com.palm.app.email");
					break;
				case "launch-messaging":
					this.onLaunch("com.palm.app.messaging");
					break;
				case "launch-contacts":
					this.onLaunch("com.palm.app.contacts");
					break;
				case "close-help":
					this.onBack(event);
					break;
			}
		} else if(event.type == Mojo.Event.back) {
			this.onBack(event);
		}
	},
	onModeChange:function(mode) {
		this.settings.mode = mode;
		var scene = this.controller.getActiveStageController("card").activeScene();
		this.onSwapScene(scene.sceneName, true);
	},
	onBack:function(event) {
		var stageController = this.controller.getActiveStageController("card");
		
		// when the help scene was shown on start-up due to new version, it's the only scene on the stack
		// if that's the case, swap the scene out with the initial view
		if(stageController.activeScene().sceneName == "help") {
			//var prefs = LBB.Preferences.getInstance();
			//var view = prefs.getProperty("initialView");
			
			if(stageController.getScenes().length == 1) {
				// if it's the only scene, swap
				this.onSwapScene("main");
			} else {
				// otherwise, just pop
				stageController.popScene();
			}
			
			event.stop();
		}
	},
	onLaunch:function(appid) {
		LBB.Util.cmdMenuModel.items[1].toggleCmd = "";
		//this.controller.getActiveStageController("card").activeScene().modelChanged(LBB.Util.cmdMenuModel);
		
		new Mojo.Service.Request('palm://com.palm.applicationManager', {
		    method: 'launch',
		    parameters:  {
		        id: appid
		    },
		    onFailure:function(e) { Mojo.Log.info(e.errorText); }
		});
	},
	onSwapScene:function(scene, force)
	{
		// TODO: figure out why pushScene doesn't work as expected
		var controller = this.controller.getActiveStageController("card")
		if(force || !controller.activeScene() || controller.activeScene().sceneName != scene) {
			controller.swapScene({
				name:scene,
				transition:Mojo.Transition.crossFade,
				disableSceneScroller:(scene == "main")
			}, LBB.Model, LBB.Preferences);
		}
	},
	onShowHelp:function() {
		//Mojo.Log.info("> onShowHelp");
		this.controller.getActiveStageController("card").pushScene("help");
	},
	onAddContact:function()
	{
		var pages = LBB.Model.getInstance().getPages();
		var c = [];
		for(var i=0;i<pages.length;i++) {
			var contacts = pages[i].getContacts();
			for(var key in contacts) {
	  			c.push(contacts[key].id);
	  		}
	  	}
	  		
		this.controller.getActiveStageController("card").pushScene(
		  { appId :'com.palm.app.contacts', name: 'list' },
		  { mode: 'picker', exclusions: c, message: $L("Select a Contact")}
		 );
	},
	onEditContact:function()
	{
		try {
			var controller = this.controller.getActiveStageController("card");
			var c = LBB.Model.getInstance().findContactById(controller.activeScene().assistant.selected.id.substring(3));
			if(c.contact != null) {
				controller.pushScene("edit-contact", c.contact);
			}
		} catch (e) {
			Mojo.Log.error("Unable to find a contact for selected contact.  selected might not exist.  Msg: " + e);
		}
	},
	checkVersion:function() {
		new Ajax.Request(Mojo.appPath + "/appinfo.json", {
			method:"get",
			onSuccess:this.handlers.onGetVersion
		});
	},
	onGetVersion:function(xhr) {
		//Mojo.Log.info("> onGetVersion");
		
		// should always be 200 ...
		if(xhr.status == 200) {
			var appInfo = eval('('+xhr.responseText+')');
			var version = this.versionCookie.get();
			
			if(version != appInfo.version) {
				this.showHelp = true
				LBB.Model.getInstance().update(version);
				this.versionCookie.put(appInfo.version);
				
				//Mojo.Log.info("Version cookie set to " + appInfo.version);
			}
		} else {
			Mojo.Log.error("Unable to retrieve version info");
		}
		
		this.state.version = true;
		this.onReady();
	}
});