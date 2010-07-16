Function.prototype.async = function(caller) {
	var func = this;
	var args = [];
	
	for(var i=1;i<arguments.length;i++) {
		args.push(arguments[i]);
	}
		
	var f = function() {
		var _args = args;
		var c = caller;
		func.apply(c, _args);
	};
	
	new Ajax.Request(Mojo.appPath + "/appinfo.json", {
		method:"get",
		onSuccess:f
	});
}