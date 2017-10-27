var Scene = function(renderEngine) {
	this.setupMember(renderEngine);
};

Scene.prototype.setupMember = function(renderEngine) {
	this._renderEngine = renderEngine;
	this._scene		   = new THREE.Object3D();
	this._sceneDepth = new THREE.Object3D();
	this._modelManager = null;
}

/****
 * Setup scene.
 */
Scene.prototype.setup = function() {
	this.setupEvents();
	this.setupModels();
	this.setupLights();
	this.setupObjects();
	this.setupPostProcess();
	this._renderEngine.addRootScene(this._scene);
	this._renderEngine.addRootScene(this._sceneDepth);

	this.initialize();
}

/*****
 * Initializer.
 *****/
Scene.prototype.initialize = function() {
	
}

/*****
 * Setup Events.
 *****/
Scene.prototype.setupEvents = function() {
}


/*****
 * Setup models.
 *****/
Scene.prototype.setupModels = function() {
}


/****
 * Setup scene lights.
 ****/
Scene.prototype.setupLights = function() {

	// create a point light
	var pointLight = new THREE.PointLight( 0xFFFFFF );

	// set its position
	pointLight.position.x = 0;
	pointLight.position.y = 0;
	pointLight.position.z = 5;
	pointLight.intensity = 1;
	pointLight.castShadow = true;
	
	this._scene.add(pointLight);
}


/****
 * Setup scene objects.
 ****/
Scene.prototype.setupObjects = function() {
	
	// Create objects
	var material = new THREE.MeshLambertMaterial( { color: 0xdddddd, shading: THREE.FlatShading } );
	var box      = new THREE.BoxGeometry(1, 1, 1);
	var mesh     = new THREE.Mesh( box, material);
	mesh.position.y = 0;
	mesh.position.z = 0;
	mesh.rotation.x = -45 * (Math.PI/180);
	mesh.rotation.z = -45 * (Math.PI/180);
	mesh.receiveShadow	= true;
	mesh.castShadow		= true;
	
	this._scene.add(mesh);
}

/*****
 * Setup postprocess.
 *****/
Scene.prototype.setupPostProcess = function() {

}

/*****
 * Update scene.
 */
Scene.prototype.update = function(time) {
}



/*****
 * Pre render.
 *****/
Scene.prototype.preRender = function() {
}

/*****
 * Post render.
 *****/
Scene.prototype.postRender = function() {
}