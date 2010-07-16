var HandlerManager = Class.create({
	initialize:function(owner, methods) {
		this._owner = owner;
		if(Object.isArray(methods)) {
			this.bind(methods);
		}
	},
	bind:function(name) {
		if(!Object.isArray(name)) {
			name = [name];
		}
		
		for(var i=0;i<name.length;i++) {
			var n = name[i];
			this[n] = this._owner[n].bind(this._owner);
		} 
	},
	release:function(name) {
		if(name) {
			this[name] = null;
		} else {
			for(var p in this) {
				if(p.indexOf("_") != 0 && typeof(p) == "object") {
					this[p] = null;
				}
			}
		}
	}
});