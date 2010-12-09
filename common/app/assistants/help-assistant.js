var _HelpAssistant = {
	initialize:function(key) {
		this.startupKey = key;
		this.handlers = new HandlerManager(this);
		this.handlers.bind(["loadRemoteHelp", "loadLocalHelp", "formatSeeAlso"]);
	},
	setup:function(key) {
		this.controller.get("help-title").update($L("Help"));
		
		this.controller.setupWidget("help-loading-spinner",{spinnerSize: "large"},{spinning: true}); 
	},
	activate:function() {
		var helpContent = this.getHelpContent();
		if (helpContent) {
			this.loadHelp(helpContent);
		} else {
			new Ajax.Request("http://www.tiqtech.com/help.php?appid=" + Mojo.appInfo.id, {
				"method": "get",
				"onSuccess": this.handlers.loadRemoteHelp,
				"onFailure": this.handlers.loadLocalHelp
			});
		}
	},
	loadRemoteHelp:function(xhr) {
		Mojo.Log.info("> loadRemoteHelp");
		
		if(xhr.status == 0) {
			this.loadLocalHelp();
			return;
		}
		
		this.loadHelp(xhr.responseText.evalJSON());
	},
	loadLocalHelp:function() {
		Mojo.Log.info("> loadLocalHelp");
		new Ajax.Request(Mojo.appPath + "/app/models/help.json", {
			"method":"get",
			"onSuccess": function(xhr){
				this.loadHelp(xhr.responseText.evalJSON())
			}.bind(this)
		});
	},
	loadHelp:function(content) {
		Mojo.Log.info("> loadHelp");
		
		// stop loading spinner
		this.controller.get("help-loading-scrim").hide();
		this.controller.get("help-loading-spinner").mojo.stop();
		
		try {
			var index = 0;
			for(var category in content) {
				var topics = this.selectTopics(content[category]);
				this.displayTopics(category, topics, index);
				index++;
			}
						
			this.setHelpContent(content);
			
			// call newContent to render the list and drawers
			this.controller.newContent(this.controller.get("help-topics"));
			
			// bind seeAlso links
			$A(this.controller.select(".seeAlso-link")).each(function(seeAlsoLink) {
				this.controller.listen(seeAlsoLink, Mojo.Event.tap, this.handlers.onSeeAlsoTap);
			}.bind(this));
			
			// show requested topic
			if (this.startupKey) {
				this.showTopic(this.startupKey)
				this.startupKey = null;
			}
		} catch(e) {
			this.controller.get("topic-list").update($L("Unable to load help topics"))
			Mojo.Log.error("Unable to load help",e,xhr.responseText);
		}
		
	},
	selectTopics:function(topics) {
		var topicArray = [];
		
		// build array of topics
		for(var i=0;i<topics.length;i++) {
			var t = topics[i];
			if(!t.version || t.version == Mojo.appInfo.id) {
				topicArray.push(t);
			}
		}
		
		return topicArray;
	},
	displayTopics:function(category, topics, index) {
		// add kickout for version-specific categories
		if(topics.length == 0) return;
		
		var id = "category-list-"+index;
		var helpTopics = this.controller.get("help-topics");
		
		helpTopics.insert(Mojo.View.render({"template":"help/category-group", "object":{category:category, index:index}}))
		
		this.controller.setupWidget(id, {itemTemplate:"help/topic-row", formatters: {"seeAlso": this.handlers.formatSeeAlso}}, {items:topics});
		this.controller.listen(this.controller.get(id), Mojo.Event.listTap, this.handlers.onTopicTap)
		
		// setup drawers for each topic
		$A(topics).each(function (topic) {
			this.controller.setupWidget("topic-section-drawer-"+topic.key, {"unstyled":true}, {"open":false});
		}.bind(this));
	},
	onTopicTap:function(e) {
		Mojo.Log.info("> onTopicTap")
		e.stopPropagation();
		this.showTopic(e.item.key, true);
	},
	onSeeAlsoTap:function(e) {
		Mojo.Log.info("> onSeeAlsoTap");
		e.stopPropagation();
		this.showTopic(e.currentTarget.getAttribute("name"), false);
	},
	showTopic:function(key, closeIfOpen) {
		Mojo.Log.info("> showTopic");
		
		// close any open drawers
//		$A(this.controller.select(".topic-drawer")).each(function(drawer) {
//			thisKey = drawer.id.substring(21); 
//			if(thisKey != key && drawer.mojo.getOpenState() == true) {
//				drawer.mojo.setOpenState(false);
//			}
//		}.bind(this));
		
		// open tapped drawer
		var drawer = this.controller.get("topic-section-drawer-"+key);
		if(drawer.mojo.getOpenState()) {
			if(closeIfOpen) {
				drawer.mojo.setOpenState(false);
			} else {
				this.controller.getSceneScroller().mojo.revealElement(drawer, false);
			}
		} else {
			drawer.mojo.setOpenState(true);
		}
	},
	formatSeeAlso:function(value, model) {
		var sHTML = ["<div class='seeAlso-header'>",$L("See Also"),"</div>"];
		var helpContent = this.getHelpContent();

		// iterate seeAlso keys
		$A(value).each(function(key) {
			// iterate categories		
			for (var category in helpContent) {			
				// iterate topics
				$A(helpContent[category]).each(function(topic){
					if (topic.key === key && (!topic.version || topic.version === Mojo.appInfo.id)) {
						
						sHTML.push("<div class='palm-body-text seeAlso-link' name='");
						sHTML.push(topic.key);
						sHTML.push("'>");
						sHTML.push(topic.title);
						sHTML.push("</div>");
						
						return false; // TODO: find a way to cancel iteration
					}
				});
			}
		}.bind(this));
		
		// if only contains header, add "none"
		if(sHTML.length == 3) {
			sHTML.push("<div class='palm-body-text'>");
			sHTML.push($L("None"));
			sHTML.push("</div>");
		} 
		
		return sHTML.join('');
	},
	getHelpContent:function() {
		return Mojo.Controller.getAppController().assistant._helpContent;
	},
	setHelpContent:function(content) {
		Mojo.Controller.getAppController().assistant._helpContent = content;
	}
};

var HelpAssistant = Class.create(_HelpAssistant);
