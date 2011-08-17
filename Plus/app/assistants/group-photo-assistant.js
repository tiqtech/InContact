
var _GroupPhotoAssistant = {
	initialize:function(model, params) {
		this.model = model;
		this.handlers = new HandlerManager(this);
	},
	setup: function() {
		var collection = [];
		for(var i=0;i<this.model.members.length;i++) {
			var m = this.model.members[i];
			if(m.contact && (m.contact.pictureLocBig || m.contact.pictureLoc)) {
				collection.push({
					name:"",
					photo:(m.contact.pictureLocBig) ? m.contact.pictureLocBig : m.contact.pictureLoc
				});
			}
		}
		
		if(collection.length == 0) {
			this.controller.get("group-photo-message").update($L("No photos available from group members"));
			$(this.controller.get("group-photo-message-list")).show();
			
			return;
		}
		
		var content = Mojo.View.render({
			template:"group-photo/photo",
			collection:collection
		})
		
		this.controller.get("group-photo-grid").update(content);
	},
	activate:function(event) {
		var _this = this;
		$(this.controller.select("#group-photo-grid .photo")).each(function(o) {
			_this.controller.listen(o, Mojo.Event.tap, _this.handlers.onTapPhoto)
		})
	},
	deactivate:function() {
		var _this = this;
		$(this.controller.select("#group-photo-grid .photo")).each(function(o) {
			_this.controller.stopListening(o, Mojo.Event.tap, _this.handlers.onTapPhoto)
		})
	},
	cleanup:function() {
	},
	onTapPhoto:function(event) {
		var photo = event.currentTarget.getAttribute("photo");
		this.model.photo = photo;
		this.controller.stageController.popScene();
	}
};

var GroupPhotoAssistant = Class.create(_GroupPhotoAssistant);
