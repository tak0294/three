var ModelManager = function() {
	this._id = "ModelManager";
	this._geometryBuffer = {};
	this._materialBuffer = {};
	this._loadJSONStack  = [];
	this._JSONloadedCount = 0;
	
	this._eventListener = {};
}

ModelManager.Event = {};
ModelManager.Event.LoadComplete = "MODEL_LOAD_COMPLETE";
ModelManager.Event.LoadProcess  = "MODEL_LOAD_PROCESS";

ModelManager.prototype.setId = function(id) {
	this._id = id;
}

ModelManager.prototype.loadJSON = function(jsonPath, callback) {
	
	var jsonLoader = new THREE.JSONLoader();
	var _this = this;
	jsonLoader.load( jsonPath, function(geometry, materials) {
		_this._geometryBuffer[jsonPath] = geometry;
		_this._materialBuffer[jsonPath] = materials;
		if(callback) {
			callback(geometry, materials);
		}
	});
}


ModelManager.prototype.loadJSONs = function(pathList) {
	this._loadJSONStack = pathList;

	var jsonLoader = new THREE.JSONLoader();
	var _this = this;

	for(var ii=0;ii<this._loadJSONStack.length;ii++) {
		
		var jsonPath = this._loadJSONStack[ii];
		jsonLoader.load( jsonPath, function(geometry, materials, jsonPath) {
			console.log(jsonPath);
			_this._geometryBuffer[jsonPath] = geometry;
			_this._materialBuffer[jsonPath] = materials;
			_this.checkStackCount();
		});
		
	}
}


ModelManager.prototype.checkStackCount = function(path) {
	this._JSONloadedCount++;
	this.notify(ModelManager.Event.LoadProcess);
	if(this._JSONloadedCount == this._loadJSONStack.length) {
		this.notify(ModelManager.Event.LoadComplete);
	}
}


ModelManager.prototype.notify = function(event) {
	
	if(!this._eventListener[event]) {
		return false;
	}
	
	for(var ii=0;ii<this._eventListener[event].length;ii++) {
		this._eventListener[event][ii].onEvent(event, this._id);
	}
}

ModelManager.prototype.addEventListener = function(event, obj) {
	if(!this._eventListener[event]) {
		this._eventListener[event] = [];
	}
	this._eventListener[event].push(obj);
}

ModelManager.prototype.getGeometryFromBuffer = function(jsonPath) {
	if(!this._geometryBuffer[jsonPath]) {
		return false;
	}
	
	return this._geometryBuffer[jsonPath];
}

ModelManager.prototype.getMaterialFromBuffer = function(jsonPath) {
	if(!this._materialBuffer[jsonPath]) {
		return false;
	}
	
	return this._materialBuffer[jsonPath];
}