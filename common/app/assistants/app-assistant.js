var _AppAssistant = {
	initialize:function() {
		try {
			LBB.Util.log("> AppAssistant.initialize");
			
			Mojo.Timing.resume("AppAssistant");
			Mojo.Timing.resume("PreLoad");
			
			// instantiate on Class and create a copy on this instance
			this.Metrix = new Metrix();		
			
			this.handlers = new HandlerManager(this);
			this.handlers.bind("startMainStage");
			
			this.model = null;
			this.showAbout = false;
			this.state = {pref:false,model:false};
			this.versionCookie = new Mojo.Model.Cookie("version");
			this.settings = {
				mode:"normal"	// normal or driving
			};
			
			//this.launchParams = {model:undefined,preferences:undefined};
			
		} catch (e) {
			LBB.Util.error("AppAssistant.initialize", e);
		}
	},
	setup:function() {
		try {
			LBB.Util.log("> AppAssistant.setup");
			this.setUpdateIconAlarm();
		} catch (e) {
			LBB.Util.error("AppAssistant.setup", e);
		}
	},
	cleanup:function() {
	},
	handleLaunch:function(params) {
		try {
			LBB.Util.log("> AppAssistant.handleLaunch");
			
			if(params && params.action == "updateIcon") {
				//this.launchParams = params;
				
				this.updateIcon();
			} else {				
				var c = this.controller.getStageController("main");
				if(!c) {
					// only post data when Main is created
					this.Metrix.postDeviceData();
					
					LBB.Util.log("create stage");
					Mojo.Timing.resume("createStageWithCallback");
					this.controller.createStageWithCallback({
						name: "main",
						lightweight: true
					}, this.handlers.startMainStage, "card");
				} else {
					LBB.Util.log("activate stage")
					
					// dropping upgrade code for now
					//LBB.Preferences.importData(this.launchParams.preferences);
					//LBB.Model.importData(this.launchParams.model);
					
					//this.onSwapScene("main", true);
					c.activate();
				}
			}
		} catch (e) {
			LBB.Util.error("AppAssistant.handleLaunch", e);
		}
	},
	startMainStage:function(stageController) {
		Mojo.Timing.pause("createStageWithCallback");
		Mojo.Timing.reportTiming("createStageWithCallback","createStageWithCallback");
		try {
			LBB.Util.log("> AppAssistant.startMainStage");
			this.loadDepot(true);
		} catch(e) {
			LBB.Util.error("AppAssistant.startMainStage", e);
		}
	},
	loadDepot:function(isForeground) {
		Mojo.Timing.pause("PreLoad");
		Mojo.Timing.reportTiming("PreLoad", "PreLoad");
		Mojo.Timing.resume("DB");
		try {
			LBB.Util.log("> AppAssistant.loadDepot");
			this.isForeground = isForeground
			this.db = new Mojo.Depot({name:"InContact-Contacts",version:1}, this.handlers.onCreateDb, this.handlers.onCreateDbFailure);
		} catch(e) {
			LBB.Util.error("AppAssistant.loadDepot", e);
		}
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
		    onFailure: function(e) { LBB.Util.log("alarm failed",Object.toJSON(e)); }
		});
	},
	onCreateDb:function() {
		Mojo.Timing.pause("DB");
		Mojo.Timing.reportTiming("DB","DB");
		try {
			LBB.Util.log("> AppAssistant.onCreateDb");
			
			Mojo.Timing.resume("Model");
			Mojo.Timing.resume("Prefs");
			// param 2 is for upgrade code
			LBB.Model.load(this.db, undefined, this.handlers.onModelReady);
			LBB.Preferences.load(this.db, undefined, this.handlers.onPrefsReady);
		} catch(e) {
			LBB.Util.error("AppAssistant.onCreateDb", e);
		}
	},
	onCreateDbFailure:function(errorCode) {
		//TODO handle onCreateDbFailure
		LBB.Util.criticalError("onCreateDbFailure: ", errorCode);
	},
	onPrefsReady:function() {
		LBB.Util.log("> AppAssistant.onPrefsReady");
	
		Mojo.Timing.pause("Prefs");
		Mojo.Timing.reportTiming("Prefs", "Prefs");
	
		this.state.pref = true;
		this.onReady();
	},
	onModelReady:function() {
		LBB.Util.log("> AppAssistant.onModelReady");
		
		Mojo.Timing.pause("Model");
		Mojo.Timing.reportTiming("Model", "Model");

		this.state.model = true;
		this.checkVersion();
		this.onReady();
	},
	onReady:function() {
		try {
			LBB.Util.log("> AppAssistant.onReady");
			
			if(this.state.model == true && this.state.pref == true) {
				if(this.model == null) this.model = LBB.Model.getInstance();
				
				LBB.Util.updateAppIcon();
				
				if(this.isForeground) {
					
					var prefs = LBB.Preferences.getInstance();
					var rotate = prefs.getProperty("allowRotate");
					this.settings.mode = prefs.getProperty("startMode");
					
					// TODO: need to change to delegateToSceneAssistant to avoid start up issue when app is deactivated right after launch
					var controller = this.controller.getStageProxy("main");		
					controller.setWindowOrientation((rotate) ? "free" : "up");
					
					Mojo.Timing.pause("AppAssistant");
					Mojo.Timing.reportTiming("AppAssistant", "AppAssistant");
					
					if(this.showAbout == true) {
						this.onShowAbout();
					} else {
						//var view = prefs.getProperty("initialView");
						this.onSwapScene("main");
					}
				}
			}
		} catch(e) {
			LBB.Util.error("AppAssistant.onReady",e);
		}
	},
	handleCommand:function(event) {
		try {
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
					case "scene-about":
						this.onShowAbout();
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
					case "launch-calendar":
						this.onLaunch("com.palm.app.calendar");
						break;
					case "close-about":
						this.onBack(event);
						break;
					case "upgrade":
						this.onUpgrade();
						break;
				}
			} else if(event.type == Mojo.Event.back) {
				this.onBack(event);
			}
		} catch(e) {
			LBB.Util.error("AppAssistant.handleCommand", e);
		}
	},
	onModeChange:function(mode) {
		this.settings.mode = mode;
		var sceneController = this.controller.getStageController("main");
		if (sceneController) {
			var scene = sceneController.activeScene();
			this.onSwapScene(scene.sceneName, true);
		}
	},
	onBack:function(event) {
		LBB.Util.log("> AppAssistant.onBack");
		
		var stageController = this.controller.getActiveStageController("card");
		
		// when the about scene was shown on start-up due to new version, it's the only scene on the stack
		// if that's the case, swap the scene out with the initial view
		if(stageController.activeScene() && stageController.activeScene().sceneName == "about") {
			LBB.Util.log("about scene is active");
			
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
		    onFailure:function(e) { LBB.Util.log(e.errorText); }
		});
	},
	onSwapScene:function(scene, force) {
		LBB.Util.log("> AppAssistant.onSwapScene");
		
		// TODO: figure out why pushScene doesn't work as expected
		var controller = this.controller.getStageProxy("main");
		if(controller && (force || !controller.activeScene() || controller.activeScene().sceneName != scene)) {
			controller.swapScene({
				name:scene,
				transition:Mojo.Transition.crossFade,
				disableSceneScroller:(scene == "main")
			});
		}
	},
	onShowHelp:function() {
		LBB.Util.log("> AppAssistant.onShowHelp");
		this.controller.getActiveStageController("card").pushScene("help");
	},
	onShowAbout:function() {
		LBB.Util.log("> AppAssistant.onShowAbout");
		this.controller.getActiveStageController("card").pushScene("about");
	},
	checkVersion:function() {
		try {
			LBB.Util.log("> AppAssistant.checkVersion");
			
			var version = this.versionCookie.get();
				
			if(version != Mojo.appInfo.version) {
				this.showAbout = true
				LBB.Model.getInstance().update(version, Mojo.appInfo.version);
				this.versionCookie.put(Mojo.appInfo.version);
				
				LBB.Util.log("Version cookie set to " + Mojo.appInfo.version);
			}
		} catch (e) {
			LBB.Util.error("AppAssistant.checkVersion", e);
		}
	},
	onUpgrade:function() {
		LBB.Util.log("> AppAssistant.onUpgrade");
		
		var controller = this.controller.getStageController("main");
		controller.delegateToSceneAssistant("onShowUpgrade");
	}
};

var AppAssistant = Class.create(_AppAssistant);
