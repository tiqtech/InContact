var __Main = {
	name:"InContactMain",
	kind:"Pane",
	components:[
		{kind:"InContactView", name:"app"},
		{kind:"InContactAbout", name:"about"},
		{kind:"AppMenu", name:"appMenu", style:"z-index:1000", components:[
			{caption:" "},
			{caption:"About", onclick:"onAbout"}
		]}
	],
	create:function() {
		this.inherited(arguments);
		
		this.broadcastMessage("resize");
	},
	onAbout:function() {
		this.selectView(this.$.about)
	},
	openAppMenuHandler:function() {
		this.$.appMenu.open();
	},
	closeAppMenuHandler:function() {
		this.$.appMenu.close();
	}
}

enyo.kind(__Main);
