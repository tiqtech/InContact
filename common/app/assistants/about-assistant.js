var _AboutAssistant = {
	initialize:function() {
	},
	setup:function() {
		// loadTheme will fail on first run after pref cookie migration
		// ignoring as it doesn't really matter in this case
		try {
			LBB.Util.loadTheme(this.controller);
		} catch(e){}
		
		// allowing event to bubble to app assistant to handle		
		this.controller.setupWidget(Mojo.Menu.commandMenu, {}, {visible:true,items:[{},{label: $L('OK'), command:'close-about',value:true}]});
	}
};

var AboutAssistant = Class.create(_AboutAssistant);

