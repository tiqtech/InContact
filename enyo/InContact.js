var _InContact = {
	name: "InContactView",
	kind:"Control",
	layoutKind:"VFlexLayout",
	components: [
		{name:"header", kind: "Toolbar", pack:"start", components: [
		    {name:"tabs", kind:"Repeater", onSetupRow:"setupTabs", height:"50px", layoutKind:"HFlexLayout"},
			{kind:"Button", caption:"+", style:"font-size:larger;font-weight:bold", className:"enyo-button-affirmative", onclick:"addPageClicked"},
		]},
		{kind:"HFlexBox", flex:1, components:[
		    {name:"scroller",kind:"SnapScroller",vertical:false,autoVertical:false,flex:1,onSnapFinish:"pageChanged"},
		    {name:"toolbar", kind:"VToolbar", width:"55px", components:[
            	{content:"Add", icon:"images/contact-icon.png", onclick:"addClicked"},
            	{content:"Edit", icon:"images/contact-icon.png", onclick:"editClicked"},
            	{content:"Remove", icon:"images/contact-icon.png", onclick:"removeClicked"},
            	{content:"Message", icon:"images/card-icon.png", onclick:"messageClicked"},
            ]},
		]},
		{name:"contacts", kind:"InContact.Contacts"},
		{name:"addPopup", kind:"PopupSelect", onSelect:"addSelected", components:[
            {kind:"MenuItem", caption:$L("Add Contact"), value:0},
            {kind:"MenuItem", caption:$L("Add Group"), value:1}
        ]},
        {name:"messagePopup", kind:"PopupSelect", onSelect:"messageSelected", components:[
            {kind:"MenuItem", caption:$L("Email"), value:0},
            {kind:"MenuItem", caption:$L("SMS"), value:1}
        ]}
	],
	published:{

	},
	create:function() {
		this.inherited(arguments);
		this.createPages(this.$.contacts.getPages());
	},
	rendered:function() {
		this.resized();
		this.selectTab(0);
	},
	createPages:function(pages, render) {
		var kinds = [], i=0, p;
		while(p = pages[i]) {
			kinds.push({page:p});
			i++;
		}
		
		this.$.scroller.createComponents(kinds, {
			kind:"InContactPage",
			owner:this
		});
		
		if(render) {
			this.$.scroller.render();
			this.$.tabs.render();
			this.resizeHandler();
		}
	},
	setupTabs:function(source, index) {
		var p = this.$.contacts.getPage(index);
		
		if(p) {
			return {kind:"InContact.PageTab", label:p.title, onSelect:"tabClicked", onChange:"tabChanged", onmousehold:"tabHeld", index:index};
		}
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
	tabHeld:function(source, event) {
		this.tabClicked(source);
		this.resetTabs(source);
		source.edit();
	},
	tabChanged:function(source, value) {
		this.log(source.index, value);
	},
	resetTabs:function(selectedTab) {
		for(var i=0,controls=this.$.header.getControls(),c;c = controls[i];i++) {
			if(c.kind === "InContact.PageTab" && c !== selectedTab) {
				c.reset();
			}
		}
	},
	selectTab:function(index) {
		var controls = this.$.tabs.getControls();
		this.resetTabs(controls[index]);
		
		for(var i=0,c;c = controls[i];i++) {
			enyo.log(c.kind);
			if(c.kind === "InContact.PageTab") {
				c.addRemoveClass("selected", i===index);
			}
		}
	},
	addClicked:function(source) {
		this.$.addPopup.openAtControl(source);
	},
	editClicked:function() {
		
	},
	removeClicked:function() {
		
	},
	messageClicked:function(source) {
		enyo.log(source);
		this.$.messagePopup.openAtControl(source);
	},
	addSelected:function(source, selected) {
		var v = selected.getValue();
		switch(v) {
			case 0:
				this.log("Add contact");
				break;
			case 1:
				this.log("Add group");
				break;
		}
	},
	messageSelected:function(source, selected) {
		var v = selected.getValue();
		switch(v) {
			case 0:
				this.log("Email");
				break;
			case 1:
				this.log("SMS");
				break;
		}
	},
    addPageClicked:function() {
    	var p = this.$.contacts.newPage();
    	this.createPages([p], true);
    }
};

var _VToolbar = {
	name:"VToolbar",
	kind:"Control",
	className:"vtoolbar",
	defaultKind:"ToolButton"
};

enyo.kind(_VToolbar);

var _PageTab = {
	name:"InContact.PageTab",
	kind:"Control",
	className:"page-tab",
	published:{
		label:""
	},
	events:{
		onChange:"",
		onSelect:""
	},
	components:[
	    {kind:"Control", name:"text", onclick:"doSelect"},
	    {kind:"HFlexBox", name:"editBox", showing:false, onmouseup:"editBoxReleased", components:[
	        {kind:"Input", name:"input", onkeypress:"inputKeyPressed", onblur:"acceptClicked", selectAllOnFocus:true},
	        //{kind:"Button", name:"accept", caption:"/", className:"enyo-button-affirmative", onclick:"acceptClicked"}
	    ]}
    ],
    create:function() {
    	this.inherited(arguments);
    	
    	this.labelChanged();
    },
    labelChanged:function() {
    	this.$.text.setContent(this.label);
    	this.$.input.setValue(this.label);
    },
    editBoxReleased:function() {
    	this.$.input.forceFocus();
    },
    inputKeyPressed:function(source, event) {
    	if(event.keyCode === 13) {
    		this.reset(true);
    	}
    },
    edit:function() {
    	this.$.input.setValue(this.label);  // reset value to model
    	
    	this.$.text.hide();
    	this.$.editBox.show();
    },
    reset:function(acceptChanges) {
    	this.$.text.show();
    	this.$.editBox.hide();
    	
    	if(acceptChanges) {
    		this.label = this.$.input.getValue();
        	this.$.text.setContent(this.label);
        	
        	this.doChange(this.label);
    	}
    },
    acceptClicked:function() {
    	this.log("blur");
    	this.reset(true);
    }
};

enyo.kind(_PageTab);

enyo.kind(_InContact);