LBB.Util =
{
	appMenuModel:{items: [Mojo.Menu.editItem,{label: $L("Preferences"),command: Mojo.Menu.prefsCmd}, {label: $L("Help"),command: Mojo.Menu.helpCmd}]},
	cmdMenuModel:
	{
	    visible: true,
	    items: [
	        {label: $L('Add'), icon:'add_icon', command:'add'},
	        {},
	        {	items:
	        	[
	        		{label: $L('List'), icon:'list_icon', command:'scene-list'},
	        		{label: $L('List'), icon:'grid_icon', command:'scene-grid'}
	        	],
	        	toggleCmd:'scene-grid'
	        },
			{},
			{label:$L('Edit'), disabled:true, command:'scene-contact'}
	    ]
	},
	setupCommandMenu:function(controller, scene)
	{
		//Mojo.Log.info("setupCommandMenu");
				
		this.cmdMenuModel.items[2].toggleCmd = 'scene-' + scene;
			
		controller.setupWidget(Mojo.Menu.commandMenu, {}, this.cmdMenuModel);
		controller.watchModel(this.cmdMenuModel);
	},
	enableEditMenu:function(controller, enabled)
	{
		this.cmdMenuModel.items[this.cmdMenuModel.items.length-1].disabled = !enabled;
		controller.modelChanged(this.cmdMenuModel);
	},
	displayAd:function(targetId, source)
	{
		var disabled = LBB.Preferences.getInstance().getProperty("disableAds");
		if(disabled) {
			$(targetId).style.display = "none";
		} else {
			$(targetId).style.display = "block";
			AdMob.ad.request(
			{
				onSuccess:(function(ad){
					this.controller.get(targetId).update(ad);
					setTimeout(function() { LBB.Util.displayAd(targetId, source); }, 300000);	// new add ever 5 minutes
				}).bind(source),
				onFailure:function(msg) {
					setTimeout(function() { LBB.Util.displayAd(targetId, source); }, 30000);	// retry after 30 seconds
				}
			});
		}
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
			onSuccess: function(e) { Mojo.Log.info("Set icon"); },
			onFailure: function(e) { Mojo.Log.info("Failed to set icon " + Object.toJSON(e)); }
		});
	}
}