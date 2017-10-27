
var MainScene = function(renderEngine) {
	this.setupMember(renderEngine);
	this.frame = 0;
};

MainScene.prototype = new Scene();

MainScene.prototype.initialize = function() {

}

MainScene.prototype.resetButtonActives = function() {

};

MainScene.prototype.setButtonActive = function(id_str) {

}

MainScene.prototype.setupEvents = function() {

}


/******************************************************
 * Camera control
 ******************************************************/
MainScene.prototype.onDocumentMouseWheel = function(event) {
	
}



MainScene.prototype.onDocumentMouseMove = function(event) {
	event.preventDefault();
}


MainScene.prototype.onDocumentMouseUp = function(event) {
	event.preventDefault();
}

MainScene.prototype.onDocumentContextmenu = function(event) {
	event.preventDefault();

}

MainScene.prototype.setupModels = function() {
}


MainScene.prototype.setupPostProcess = function() {
	
	RenderEngine.ShaderMaterial.Raster.uniforms.wave_size.value = 20;
	RenderEngine.ShaderEnable.Ssao = true;
	//RenderEngine.ShaderEnable.Dof = true;
}

MainScene.prototype.setupLights = function() {

	var spot = new THREE.PointLight(0xFFCC66);
	spot.intensity = 1.0;
	spot.position.z = 300;
	spot.position.x = 0;
	spot.position.y = 1600;
	// spot.castShadow = true;
	this._scene.add(spot);


	var ambient = new THREE.AmbientLight(0xDDDDDD);
	this._scene.add(ambient);
}

MainScene.prototype.preRender = function() {
}

/******
 * Setup objects.
 ******/
MainScene.prototype.setupObjects = function() {
	
	

	var texture2 	= loadTexture( './textures/retina_wood.png');
	texture2.wrapS  = texture2.wrapT = THREE.RepeatWrapping;
	texture2.repeat.set( 12, 4 );
	var material2 	= new THREE.MeshPhongMaterial({map:texture2, color:0xFFFFFF});
	var plane2 		= new THREE.PlaneGeometry(11*500, 11*100);
	var mesh2 		= new THREE.Mesh( plane2, material2 );
	mesh2.position.z = -30;
	mesh2.receiveShadow = true;
	this._scene.add(mesh2);
}



/*****
 * update.
 *****/
MainScene.prototype.update = function(time) {


	this.frame++;
}
