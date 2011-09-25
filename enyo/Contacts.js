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
	get:function(id) {
		var contact;
		enyo.forEach(this.contacts, function(c) {
			if(c.id === id) {
				contact = c;
			}
		}, this);
		
		return contact;
	}
};

enyo.kind(_Contacts);