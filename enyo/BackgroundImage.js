var _BackgroundImage = {
	name:"BackgroundImage",
	kind:"Control",
	className:"background-image",
	published:{
		defaultImage:null,
		image:null,
	},
	chrome:[
		{name:"client",kind:"Control",className:"background-image"}
	],
	create:function() {
		this.inherited(arguments);
		
		this.defaultImageChanged();
		this.imageChanged();
	},
	defaultImageChanged:function(oldDefaultImage) {
		this.applyStyle("background-image", this.resize(this.defaultImage));
	},
	imageChanged:function(oldImage) {
		// only update style if it's a "real" value
		if (this.image && this.image.length > 0) {
			this.$.client.applyStyle("background-image", this.resize(this.image));
		}
	},
	resize:function(img) {
		// will use to resize image later if possible
		return "url('" + img + "')";
	}
};

enyo.kind(_BackgroundImage);
