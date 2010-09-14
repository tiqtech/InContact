var _AppAssistant = {
	initialize:function() {
		try {
			LBB.Util.log("> AppAssistant.initialize");
			
			// instantiate on Class and create a copy on this instance
			//AppAssistant.Metrix = new Metrix();
			//this.Metrix = AppAssistant.Metrix;		
			
			this.handlers = new HandlerManager(this, ["startMainStage", "onCreateDb", "onCreateDbFailure", "onModelReady", "onPrefsReady"]);
			this.model = null;
			this.showHelp = false;
			this.state = {pref:false,model:false};
			this.versionCookie = new Mojo.Model.Cookie("version");
			this.settings = {
				mode:"normal"	// normal or driving
			};
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
				// TODO: create background stage
				this.updateIcon();
			} else {
				if(params && params.action == "upgrade") {
					Mojo.Log.info("upgrading!!!!");
				}
				
				var c = this.controller.getStageController("main");
				if(!c) {
					// only post data when Main is created
					//this.Metrix.postDeviceData();
					
					LBB.Util.log("create stage");
					this.controller.createStageWithCallback("main", this.handlers.startMainStage, "card");
				} else {
					LBB.Util.log("activate stage")
					c.activate();
				}
			}
		} catch (e) {
			LBB.Util.error("AppAssistant.handleLaunch", e);
		}
	},
	startMainStage:function(stageController) {
		try {
			LBB.Util.log("> AppAssistant.startMainStage");
			this.loadDepot(true);
		} catch(e) {
			LBB.Util.error("AppAssistant.startMainStage", e);
		}
	},
	loadDepot:function(isForeground) {
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
		try {
			LBB.Util.log("> AppAssistant.onCreateDb");
			
			LBB.Model.load(this.db, this.handlers.onModelReady);
			LBB.Preferences.load(this.db, this.handlers.onPrefsReady);
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
	
		this.state.pref = true;
		this.onReady();
	},
	onModelReady:function() {
		LBB.Util.log("> AppAssistant.onModelReady");

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
						this.controller.getActiveStageController("card").pushAppSupportInfoScene();
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
					case "close-help":
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
		var scene = this.controller.getActiveStageController("card").activeScene();
		this.onSwapScene(scene.sceneName, true);
	},
	onBack:function(event) {
		LBB.Util.log("> AppAssistant.onBack");
		
		var stageController = this.controller.getActiveStageController("card");
		
		// when the help scene was shown on start-up due to new version, it's the only scene on the stack
		// if that's the case, swap the scene out with the initial view
		if(stageController.activeScene() && stageController.activeScene().sceneName == "help") {
			LBB.Util.log("help scene is active");
			
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
		LBB.Util.log("> AppAssistant.onShowHelp");
		this.controller.getActiveStageController("card").pushScene("help");
	},
	checkVersion:function() {
		try {
			LBB.Util.log("> AppAssistant.checkVersion");
			
			var version = this.versionCookie.get();
				
			if(version != Mojo.appInfo.version) {
				this.showHelp = true
				LBB.Model.getInstance().update(version);
				this.versionCookie.put(Mojo.appInfo.version);
				
				LBB.Util.log("Version cookie set to " + Mojo.appInfo.version);
			}
		} catch (e) {
			LBB.Util.error("AppAssistant.checkVersion", e);
		}
	},
	onUpgrade:function() {
		new Mojo.Service.Request('palm://com.palm.applicationManager', {
		    method: 'launch',
		    parameters:  {
		        id: "com.tiqtech.incontactplus",
				params: {action:"upgrade",model:LBB.Model.getInstance(),preferences:LBB.Preferences.getInstance()}
		    },
		    onFailure:function(e) {
				this.controller.getActiveStageController("card").activeScene().assistant.showUpgradeDialog(true);
			}.bind(this)
		});
	}
};

var AppAssistant = Class.create(_AppAssistant);
