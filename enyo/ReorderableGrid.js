var _ReorderableGrid = {
	name:"InContact.ReorderableGrid",
	kind:"extras.Grid",
	published:{
		capturedElement:null
	},
	events:{
		onReorder:""
	},
	constructor:function() {
		this.inherited(arguments);
		this.controlOrder = [];
	},
	create:function() {
		this.inherited(arguments);
	},
	createComponent:function() {
		
		var r = this.inherited(arguments);
		
		if(r instanceof enyo.Control) {
			r.mouseholdHandler = enyo.bind(this, "controlHeld");
			r.dragstartHandler = enyo.bind(this, "startDraggingControl");
			r.dragfinishHandler = enyo.bind(this, "stopDraggingControl");
			r.dragHandler = enyo.bind(this, "dragControl");
			
			this.controlOrder.push(r);
		}
		
		return r;
	},
	capturedElementChanged:function(original) {
		if(original) {
			original.removeClass("dragging");
		}
		
		if(this.capturedElement) {
			this.capturedElement.addClass("dragging");
		}
		
		this.capturedElementIndex = enyo.indexOf(this.capturedElement, this.controlOrder);
	},
	controlHeld:function(source, event) {
		while(source) {
			if(source.container === this) break;
			source = source.container;
		}
		
		var x = enyo.dom.calcNodeOffset(source.hasNode(), this.hasNode());
		this.coords = {x:x.left,y:x.top};
		
		if(!this.pos) {
			var x = enyo.dom.calcNodeOffset(this.hasNode(), document.body);
			this.pos = {x:x.left,y:x.top};
		}

		this.setCapturedElement(source);
		event.stopPropagation();
	},
	startDraggingControl:function(source, event) {
		if(!this.capturedElement) return;
		
		event.stopPropagation();
	},
	stopDraggingControl:function(source, event) {
		if(!this.capturedElement) return;
		
		// move capturedElement in controlOrder ...
		var index = enyo.indexOf(this.capturedElement, this.controlOrder);
		this.controlOrder.splice(index, 1);
		this.controlOrder.splice(this.hoverIndex, 0, this.capturedElement);
		
		this.doReorder(index, this.hoverIndex)
		
		// ... clear state variables ...
		this.hoverIndex = undefined;
		this.setCapturedElement(null);
		
		// ... and reposition controls
		this.positionControls();
		
		event.stopPropagation();
	},
	dragControl:function(source, event) {
		if(!this.capturedElement) return;
		
		this.capturedElement.applyStyle("top", this.coords.y + event.dy + "px");
		this.capturedElement.applyStyle("left", this.coords.x + event.dx + "px");
		
		var hi = this.calcHoverIndex(event);
		
		if(hi !== this.hoverIndex) {
			this.hoverIndex = hi;
			this.positionControls();
		}
		
		event.stopPropagation();
	},
	positionControl:function(control, index, colsPerRow) {
		if(control === this.capturedElement) return;
		
		index = enyo.indexOf(control, this.controlOrder);
		
		if(typeof(this.hoverIndex) !== "undefined" && this.hoverIndex !== this.capturedElementIndex) {
			if(this.hoverIndex <= index && index <= this.capturedElementIndex)  {
				index += 1;
			} else if(this.hoverIndex >= index && index >= this.capturedElementIndex) {
				index -= 1;
			}
		}
		
		arguments[1] = index;
		
		this.inherited(arguments);
	},
	calcHoverIndex:function(event) {
		var cell = this.getCell(event.pageX-this.pos.x, event.pageY-this.pos.y);
		var dim = this.getDimensions();
		var cellsPerRow = Math.floor(dim.width/this.cellWidth);
		return (cellsPerRow*cell.row)+cell.col;
	},
	getCell:function(x, y) {
		var d = this.getDimensions();
		var col = Math.floor(x/this.cellWidth);
		var row = Math.floor(y/this.cellHeight);
		
		return {row:row, col:col};
	}
};

enyo.kind(_ReorderableGrid);