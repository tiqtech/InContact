Function.prototype.async = function(caller) {
	new Ajax.Request(Mojo.appPath + "/appinfo.json", {
		method:"get",
		onSuccess:this.bind(caller, arguments)
	});
}