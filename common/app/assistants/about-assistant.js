var _AboutAssistant = {
	initialize:function() {
	},
	setup:function() {
		LBB.Util.loadTheme(this.controller);

		// allowing event to bubble to app assistant to handle		
		this.controller.setupWidget(Mojo.Menu.commandMenu, {}, {visible:true,items:[{},{label: $L('OK'), command:'close-about',value:true}]});
	}
};

var AboutAssistant = Class.create(_AboutAssistant);

