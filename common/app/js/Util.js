var LBB = {};

LBB.Util =
{
	_log:[],
	_isDebug:(Mojo.appInfo.id.indexOf(".debug")>0),
	appMenuModel: {items:[]},
	cmdMenuModel: {
	    visible: true,
	    items: [
       		{},
       		{ items: [] },	// placeholder for items from preferences
       		{}
	    ]
	},
	log:function() {
		if(this._isDebug) {
			this._log.push($A(arguments).join(" "));
		}
		
		Mojo.Log.info.apply(Mojo.Log, arguments);
	},
	error:function() {
		if(this._isDebug) {
			this._log.push($A(arguments).join(" "));
			this.emailLog();
		}
		
		Mojo.Log.error.apply(Mojo.Log, arguments);
	},
	emailLog:function() {
		new Mojo.Service.Request("palm://com.palm.applicationManager", {
			method:"open",
			parameters:{
				id:"com.palm.app.email",
				params:{
					summary:"Error Log for InContact",
					text:this._log.join("\r\n"),
					recipients:[{type:"email",role:1,value:"incontact-support@tiqtech.com",contactDisplay:"InContact Support"}]
				}
			}
		});
	},
	getAppMenuModel:function(scene) {
		var i = this.appMenuModel.items;
		
		i.clear();
		i.push(Mojo.Menu.editItem);
		if(scene == "grid") {
			var currentMode = Mojo.Controller.getAppController().assistant.settings.mode;
			var mode, label;
			if(currentMode == "normal") {
				label = $L("Driving Mode");
				mode = "driving";
			} else {
				label = $L("Normal Mode");
				mode = "normal";
			}
			
			i.push({label: label,  shortcut:'m', command:"mode-"+mode});
		}
		
		i.push({label: $L("Preferences"),command: Mojo.Menu.prefsCmd});
		i.push({label: $L("Help"),command: Mojo.Menu.helpCmd});
		i.push({label: $L("About"),command: "scene-about"});
		
		// upgrade code
		if(Mojo.appInfo.id.substring(Mojo.appInfo.id.length-4) != "plus") {
			i.push({label: $L("Upgrade"), command: "upgrade"});
		}
		
		return this.appMenuModel;
	},
	updateCommandMenuModel:function(controller) {
		var apps = LBB.Preferences.getInstance().getProperty("launcherApps");
		
		var selectedApps = [];
		for(var i=0;i<apps.length;i++) {
			if(apps[i].value) {
				selectedApps.push(apps[i]);
			}
		}
		
		this.cmdMenuModel.items[1].items = selectedApps;
		
		if (controller) {
			controller.modelChanged(this.cmdMenuModel);
		}
	},
	setupCommandMenu:function(controller, scene) {
		LBB.Util.log("> LBB.Util.setupCommandMenu");
				
		this.updateCommandMenuModel();

		controller.setupWidget(Mojo.Menu.commandMenu, {}, this.cmdMenuModel);
		controller.watchModel(this.cmdMenuModel);
	},
	loadTheme:function(controller) {
		var prefs = LBB.Preferences.getInstance();
		var theme = prefs.getProperty("theme");
		new Ajax.Request(Mojo.appPath + "/themes/" + theme + "/config.json", {
			method:"get",
			onSuccess:function(xhr) { 
				var c = controller;
				var t = theme;
				this.onLoadTheme(xhr, c, t);
			}.bind(this)
		});
	},
	onLoadTheme:function(xhr, controller, theme) {
		if(xhr.status == 200) {
			try {
				var attr = eval("("+xhr.responseText+")");
				if(typeof(attr) == "object") {
					attr.theme = theme;
					var content = Mojo.View.render({"template":"themes/style", attributes:attr});
					var themeNode = controller.get('theme-style');
					
					if(themeNode == null) {
						controller.get(controller.document.body).insert(content);
					} else {
						themeNode.replace(content);
					}
				}
			} catch (ex) {
				Mojo.Log.error(ex);
			}
		}
	},
	updateAppIcon:function() {
		var icon = LBB.Preferences.getInstance().getProperty("icon");
		if(!icon) return;
		
		var iconUrl = Mojo.appPath + 'images/launcher/' + icon + '.png';
		
		var updateIconRequest = new Mojo.Service.Request('palm://com.palm.applicationManager', {
    		method: 'updateLaunchPointIcon',
    		parameters: { launchPointId: Mojo.appInfo.id + '_default', icon: iconUrl},
			onSuccess: function(e) { Mojo.Log.info("Set icon"); },
			onFailure: function(e) { Mojo.Log.info("Failed to set icon",Object.toJSON(e)); }
		});
	}
}

var HandlerManager = Class.create({
	initialize:function(owner, methods) {
		this._owner = owner;

		if(Object.isArray(methods)) {
			this.bind(methods);
		}
	},
	bind:function(name) {
		if(!Object.isArray(name)) {
			name = [name];
		}
		
		for(var i=0;i<name.length;i++) {
			var n = name[i];
			this[n] = this._owner[n].bind(this._owner);
		} 
	},
	release:function(name) {
		try {
			if(name) {
				this[name] = null;
			} else {
				for(var p in this) {
					if(p.indexOf("_") != 0 && typeof(p) == "object") {
						this[p] = null;
					}
				}
			}
		} catch (e) {
			Mojo.Log.warn(e);
		}
	}
});

//Function.prototype.async = function(caller) {
//	var func = this;
//	var args = [];
//	
//	for(var i=1;i<arguments.length;i++) {
//		args.push(arguments[i]);
//	}
//		
//	var f = function() {
//		var _args = args;
//		var c = caller;
//		func.apply(c, _args);
//	};
//	
//	new Ajax.Request(Mojo.appPath + "/appinfo.json", {
//		method:"get",
//		onSuccess:f
//	});
//}

/*
var LoggingClass = {
	entry:function(prefix, method) {
		var s = (!prefix) ? method : prefix + "." + method;
		Mojo.Log.info(">",s);
	},
	exit:function(prefix, method) {
		var s = (!prefix) ? method : prefix + "." + method;
		Mojo.Log.info("<",s); 
	},
	create:function(baseClass, classDef) {
		if(typeof(baseClass) == "object") {
			classDef = baseClass;
		}
		
		for(var member in classDef) {
			if(typeof(classDef[member]) == "function") {
				Mojo.Log.info("overriding",member);
				classDef[member] = classDef[member].wrap(
					function(callOriginal) {
						LoggingClass.entry(this.logPrefix,member);
						callOriginal();
						LoggingClass.exit(this.logPrefix,member);
					}
				);
			}
		}
		
		return Class.create(baseClass, classDef);
	}
};
*/