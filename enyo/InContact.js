var _InContact = {
	name: "InContactView",
	kind:"Control",
	layoutKind:"VFlexLayout",
	components: [
		{name:"header", kind: "Toolbar", pack:"start", components: [
			{kind:"Button", caption:"Friends", onclick:"tabClicked", index:0, className:"enyo-button-blue"},
			{kind:"Button", caption:"Family", onclick:"tabClicked", index:1},
			{kind:"Button", caption:"Work", onclick:"tabClicked", index:2},
			{kind:"Button", caption:"+", style:"font-size:larger;font-weight:bold", className:"enyo-button-affirmative"},
		]},
		{name:"scroller",kind:"SnapScroller",vertical:false,autoVertical:false,flex:1,onSnapFinish:"pageChanged"},		
		{name:"contactMenu",kind:"Popup",scrim:true,className:"header-menu",components:[
			{caption:"Add Contact",onclick:"onAddContact"},
			{caption:"Add Group", onclick:"onAddGroup"},
			{caption:"Edit Contact", onclick:"onEditContact"},
			{caption:"Remove Contact", onclick:"onRemoveContact"},
		]},
		{name:"pageMenu",kind:"Popup",scrim:true,className:"header-menu",components:[
			{caption:"Add Page", onclick:"onAddPage"},
			{caption:"Rename Page", onclick:"onRenamePage"},
			{caption:"Remove Page", onclick:"onRemovePage"},
		]},
		{name:"contacts", kind:"InContact.Contacts"}
	],
	published:{

	},
	create:function() {
		this.inherited(arguments);
		
		var kinds = [];
		for(var i=0;i<3;i++) {
			kinds.push({name:"page"+i})
		}
		
		this.$.scroller.createComponents(kinds, {
			kind:"InContactPage",
			owner:this
		});
		
		this.$.page0.setContacts(page0);
	},
	rendered:function() {
		this.resized();
	},
	showContactMenu:function() {
		// TODO: fix menu item layout
		this.$.contactMenu.openNearNode(this.$.header, {t:25,l:0});
	},
	showPageMenu:function() {
		this.$.pageMenu.openNearNode(this.$.header, {t:25,l:0});
	},
	pageChanged:function(sender) {
		this.selectTab(sender.index)
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
	},
	resizeHandler:function() {
		var n = this.$.scroller.hasNode();
		if(!n) return;
		
		var dim = {w:n.offsetWidth,h:n.offsetHeight};
		
		enyo.forEach(this.$.scroller.getControls(), function(item) {
			item.applyStyle("height", dim.h-12+"px");
			item.applyStyle("width", dim.w-12+"px");
		}, this);
		
		this.inherited(arguments);
	},
	tabClicked:function(source) {
		this.$.scroller.snapTo(source.index);
		this.selectTab(source.index);
	},
	selectTab:function(index) {
		for(var i=0,controls=this.$.header.getControls(),c;c = controls[i];i++) {
			if(c.getCaption() === "+") continue;
			
			c.addRemoveClass("enyo-button-blue", i===index);
		}
	}
}

enyo.kind(_InContact);

var page0 = [
{
	id:"123",
	largePhoto:"",
	smallPhoto:"",
	selections:[
		{action:"phone",details:"p1",icon:"phone"},
		{action:"sms",details:undefined,icon:"txt"},
		{action:"email",details:"e1",icon:"email"},
		{action:"im",details:"i1",icon:"im"}
	]
},
{
	id:"456",
	largePhoto:"images/contact-icon.png",
	smallPhoto:"",
	selections:[
		{action:"phone",details:"p2",icon:"phone"},
		{action:"sms",details:"p2",icon:"sms2"},
		{action:"email",details:"e2",icon:"factory"},
		{action:"im",details:"i2",icon:"briefcase"}
	]
},
{
	id:"789",
	largePhoto:"images/contact-icon.png",
	smallPhoto:"",
	selections:[
		{action:"phone",details:"p2",icon:"phone"},
		{action:"sms",details:"p2",icon:"sms2"},
		{action:"email",details:"e2",icon:"factory"},
		{action:"im",details:"i2",icon:"briefcase"}
	]
},
{
	id:"101112",
	largePhoto:"images/contact-icon.png",
	smallPhoto:"",
	selections:[
		{action:"phone",details:"p2",icon:"phone"},
		{action:"sms",details:"p2",icon:"sms2"},
		{action:"email",details:"e2",icon:"factory"},
		{action:"im",details:"i2",icon:"briefcase"}
	]
}
             ]