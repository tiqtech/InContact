var _InContact = {
	name: "InContactView",
	kind:"Control",
	layoutKind:"VFlexLayout",
	components: [
		{name:"header", kind: "FloatingHeader", className:"enyo-button enyo-menu-button-shape",style:"z-index:125", components: [
			{kind: "HFlexBox", className:"header-flex-box", components:[
				{kind: "MenuButton", icon:"images/contact-icon.png", className:"left", onclick:"showContactMenu"},
				{name: "pageTitle", content: "InContact", className:"title", flex:1},
				{kind: "MenuButton", icon:"images/card-icon.png",className:"right",onclick:"showPageMenu"}
			]} 
		]},
		{name:"scroller",kind:"SnapScroller",vertical:false,autoVertical:false,flex:1,onSnapFinish:"onChangePage"},
		{name:"commandMenu", kind:"CommandMenu", components:[
			{kind:"MenuToolbar", components:[
				{icon:"images/icons/phone.png"},
				{icon:"images/icons/contacts.png"},
				{icon:"images/icons/messaging.png"},
				{icon:"images/icons/email.png"},
				{icon:"images/icons/calendar.png"},
			]}
		]},
		{name:"contactMenu",kind:"PopupMenu",scrim:true,className:"header-menu",components:[
			{caption:"Add Contact",onclick:"onAddContact"},
			{caption:"Add Group", onclick:"onAddGroup"},
			{caption:"Edit Contact", onclick:"onEditContact"},
			{caption:"Remove Contact", onclick:"onRemoveContact"},
		]},
		{name:"pageMenu",kind:"PopupMenu",scrim:true,className:"header-menu",components:[
			{caption:"Add Page", onclick:"onAddPage"},
			{caption:"Rename Page", onclick:"onRenamePage"},
			{caption:"Remove Page", onclick:"onRemovePage"},
		]}
	],
	published:{

	},
	create:function() {
		this.inherited(arguments);
	},
	initComponents:function() {
		this.inherited(arguments);
		
		var contacts = [
			{
				id:"123",
				firstName:"Joe",
				lastName:"User",
				phoneNumbers:[
					{id:"p1",value:"2223334444",label:0},
					{id:"p2",value:"3334445555",label:1}
				],
				emailAddresses:[
					{id:"e1",value:"abc@def.com"},
					{id:"e2",value:"def@ghi.com"}
				],
				imNames:[
					{id:"i1",value:"joeuser",serviceName:"gtalk"},
					{id:"i2",value:"joe_user",serviceName:"yahoo"}
				],
				qc:{
					largePhoto:"",
					smallPhoto:"",
					selections:[
						{action:"phone",details:"p1",icon:"phone"},
						{action:"sms",details:undefined,icon:"txt"},
						{action:"email",details:"e1",icon:"email"},
						{action:"im",details:"i1",icon:"im"}
					]
				}
			},
			{
				id:"456",
				firstName:"Jane",
				lastName:"User",
				phoneNumbers:[
					{id:"p1",value:"2223334444",label:0},
					{id:"p2",value:"3334445555",label:1}
				],
				emailAddresses:[
					{id:"e1",value:"abc@def.com"},
					{id:"e2",value:"def@ghi.com"}
				],
				imNames:[
					{id:"i1",value:"janeuser",serviceName:"gtalk"},
					{id:"i2",value:"jane_user",serviceName:"yahoo"}
				],
				qc:{
					largePhoto:"images/contact-icon.png",
					smallPhoto:"",
					selections:[
						{action:"phone",details:"p2",icon:"phone"},
						{action:"sms",details:"p2",icon:"sms2"},
						{action:"email",details:"e2",icon:"factory"},
						{action:"im",details:"i2",icon:"briefcase"}
					]
				}
			}
		];
		
		var kinds = [];
		for(var i=0;i<3;i++) {
			kinds.push({name:"page"+i})
		}
		
		this.$.scroller.createComponents(kinds, {
			kind:"InContactPage",
			height:document.body.offsetHeight,
			width:document.body.offsetWidth,
			owner:this
		});

		this.$.page0.setContacts(contacts);
		
		this.onChangePage(this.$.scroller)
	},
	showContactMenu:function() {
		// TODO: fix menu item layout
		this.$.contactMenu.openNearNode(this.$.header, {t:25,l:0});
	},
	showPageMenu:function() {
		this.$.pageMenu.openNearNode(this.$.header, {t:25,l:0});
	},
	onChangePage:function(sender) {
		var names = ["Friends","Family","Work"];
		this.$.pageTitle.setContent(names[sender.index]);
	},
	onAddContact:function() {
		this.log("enter")
	},
	onAddGroup:function() {
		this.log("enter")
	},
	onEditContact:function() {
		this.log("enter")
	},
	onRemoveContact:function() {
		this.log("enter")
	},
	onAddPage:function() {
		this.log("enter")
	},
	onRenamePage:function() {
		this.log("enter")
	},
	onRemovePage:function() {
		this.log("enter")
	}
}

enyo.kind(_InContact);
