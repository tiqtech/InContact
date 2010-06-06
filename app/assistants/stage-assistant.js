var StageAssistant = Class.create(
{
	setup:function()
	{
		this.model = null;
		this.state = {pref:false,model:false};

		this.db = new Mojo.Depot({name:"LittleBlackBook-Contacts",version:1}, this.onCreateDb.bind(this), this.onCreateDbFailure.bind(this));
		
		AdMob.ad.initialize({pub_id:"a14be4b9a87e63a",bg_color:"rgba(2,2,2,.5)",text_color:"#ffffff",test_mode:false});
	},
	onCreateDb:function()
	{
		//Mojo.Log.info("> StageAssistant.onCreateDb");
		LBB.Model.load(this.db, this.onModelReady.bind(this));
		LBB.Preferences.load(this.db, this.onPrefsReady.bind(this));
	},
	onCreateDbFailure:function(errorCode)
	{
		//TODO handle onCreateDbFailure
		Mojo.Log.error("onCreateDbFailure: " + errorCode);
	},
	onPrefsReady:function()
	{
		//Mojo.Log.info("> StageAssistant.onPrefsReady");
		this.state.pref = true;
		this.onReady();
	},
	onModelReady:function()
	{
		//Mojo.Log.info("> StageAssistant.onModelReady");
		
		this.state.model = true;
		this.onReady();
	},
	onReady:function()
	{
		//Mojo.Log.info("> StageAssistant.onReady");
		if(this.state.model && this.state.pref) {
			if(this.model == null) this.model = LBB.Model.getInstance();
			
			var prefs = LBB.Preferences.getInstance();
			var rotate = prefs.getProperty("allowRotate");		
			this.controller.setWindowOrientation((rotate) ? "free" : "up");
			
			var view = prefs.getProperty("initialView");
			this.controller.pushScene({name:view, disableSceneScroller:true});
		}
			
	},
	handleCommand:function(event)
	{
		if (event.type === Mojo.Event.command) {
			switch (event.command) {
				case Mojo.Menu.prefsCmd:
					this.controller.pushScene("prefs");
					break;
				case "scene-list":
					this.onSwapScene("list");
					break
				case "scene-grid":
					this.onSwapScene("main");
					break;
				case "scene-contact":
					this.onEditContact();
					break;
				case "add":
					this.onAddContact();
					break;
			}
		}
	},
	onSwapScene:function(scene)
	{
		// TODO: figure out why pushScene doesn't work as expected
		if(this.controller.activeScene().sceneName != scene) {
			this.controller.swapScene({
				name:scene,
				transition:Mojo.Transition.crossFade
			});
		}
				
	},
	onAddContact:function()
	{
		var contacts = LBB.Model.getInstance().contacts;
		var c = [];
		for(var key in contacts)
	  		c.push(contacts[key].id);
	  		
		this.controller.pushScene(
		  { appId :'com.palm.app.contacts', name: 'list' },
		  { mode: 'picker', exclusions: c, message: "Select a Contact"}
		 );
	},
	onEditContact:function()
	{
		try {
			var c = LBB.Model.getInstance().findContactById(this.controller.activeScene().assistant.selected.id.substring(3));
			if(c.contact != null) {
				this.controller.pushScene("edit-contact", c.contact);
			}
		} catch (e) {
			Mojo.Log.error("Unable to find a contact for selected contact.  selected might not exist.  Msg: " + e);
		}
	}
});