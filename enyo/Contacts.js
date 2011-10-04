var _Contacts = {
	name:"InContact.Contacts",
	kind:"Component",
	contacts:[
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
			]
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
			]
		},
		{id:"789", firstName:"Bob"},
		{id:"101112", firstName:"George"}
	],
	pages:[
		{title:"Friends", contacts:[
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
         ]},
         {title:"Family", contacts:[]},
         {title:"Work", contacts:[]}
	],
	get:function(id) {
		var contact;
		enyo.forEach(this.contacts, function(c) {
			if(c.id === id) {
				contact = c;
			}
		}, this);
		
		return contact;
	},
	getPage:function(n) {
		return this.pages[n];
	},
	getPages:function() {
		return this.pages;
	},
	updatePage:function(n, p) {
		this.pages[n] = p;
		this.save();
	},
	newPage:function(title) {
		var p = {title:title || $L("New Page"), contacts:[]};
		this.pages.push(p);
		this.save();
		
		return p;
	},
	save:function() {
		this.log("saving");
	}
};

enyo.kind(_Contacts);