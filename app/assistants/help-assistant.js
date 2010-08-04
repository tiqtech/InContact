var HelpAssistant = Class.create(
{
	initialize:function() {
	},
	setup:function() {
		LBB.Util.loadTheme(this.controller);
		this.controller.setupWidget(Mojo.Menu.commandMenu, {}, {visible: true, items: [{icon:"back-icon", command:'close-help'}]});
	}
});

