if(!LBB) LBB = {};

LBB.Model.prototype.initialize = function() {
	this.loaded = false;
	this.modified = false;
	this.pages = [new LBB.Page("Friends"), new LBB.Page("Family"), new LBB.Page("Work")];
};
