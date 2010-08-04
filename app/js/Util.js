LBB.Util =
{
	appMenuModel: {items:[]},
	cmdMenuModel: {
	    visible: true,
	    items: [
       		//{label: $L('Add'), icon:"add_icon", command:'add'},
       		{},
       		{ items: [
       			{label: $L('Phone'), icon:'phone-icon', command:'launch-phone'},
       			{label: $L('Email'), icon:'email-icon', command:'launch-email'},
       			{label: $L('Messaging'), icon:'messaging-icon', command:'launch-messaging'},
       			{label: $L('Contacts'), icon:'contacts-icon', command:'launch-contacts'}
       			]
       		},
       		{}
       		//{label: $L('Edit'), command:'scene-contact'}
	    ]
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
		
		return this.appMenuModel;
	},
	setupCommandMenu:function(controller, scene) {
		//Mojo.Log.info("setupCommandMenu");
				
		this.cmdMenuModel.items[2].toggleCmd = 'scene-' + scene;
			
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
						$(document.body).insert(content);
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
    		parameters: { launchPointId: 'com.tiqtech.incontact_default', icon: iconUrl},
			onSuccess: function(e) { },
			onFailure: function(e) { Mojo.Log.info("Failed to set icon",Object.toJSON(e)); }
		});
	}
}