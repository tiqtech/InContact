LBB.Util =
{
	appMenuModel:{items: [Mojo.Menu.editItem,{label: $L("Preferences"),command: Mojo.Menu.prefsCmd}, Mojo.Menu.helpItem]},
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
					Mojo.Log.info("ok");
					this.controller.get(targetId).update(ad);
					Mojo.Log.info("ok");
				}).bind(source),
				onFailure:function(msg) {
					Mojo.Log.error("ERROR: " + msg);
				}
			});
		}
	}
}