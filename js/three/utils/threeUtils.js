
	function makeLight(x, y, z, lookAtPosition, param) {
		
		var res = {};
		
		//////////////////////////////////////////////////////////////////////////////////
		//		add a volumetric spotligth				//
		//////////////////////////////////////////////////////////////////////////////////

		if(typeof param == "undefined") {
			param = {};
		}

		// add spot light
		var geometry	= new THREE.CylinderGeometry( 0.1, 1.5, 5, 32*2, 20, true);
		geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, -geometry.parameters.height/2, 0 ) );
		geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
		var material	= new THREEx.VolumetricSpotLightMaterial()
		var mesh	= new THREE.Mesh( geometry, material );
		mesh.position.set(x,y,z)
		mesh.lookAt(lookAtPosition)
		material.uniforms.lightColor.value.set(0xFFFFFF)
		material.uniforms.spotPosition.value = mesh.position
		
		if(param.anglePower) {
			material.uniforms.anglePower.value = param.anglePower;
		}else{
			material.uniforms.anglePower.value = 20;
		}
		
		if(param.attenuation) {
			material.uniforms.attenuation.value = param.attenuation;
		}else{
			material.uniforms.attenuation.value = 3;
		}
		
		res.lightMesh = mesh;
		//scene.add( mesh );

		//////////////////////////////////////////////////////////////////////////////////
		//		link it with a spotLight					//
		//////////////////////////////////////////////////////////////////////////////////

		var spotLight	= new THREE.SpotLight()
		spotLight.position.copy(mesh.position)
		spotLight.color		= mesh.material.uniforms.lightColor.value
		spotLight.exponent	= 30
		spotLight.angle		= Math.PI/3;
		spotLight.intensity	= 0.8
		//scene.add( spotLight )
		//scene.add( spotLight.target )
		res.spotLight = spotLight;


		mesh.lookAt(lookAtPosition)
		spotLight.target.position.copy(lookAtPosition)

//		onRenderFcts.push(function(delta, now){
//			var angle	= 0.1 * Math.PI*2*now
//			var target	= new THREE.Vector3(0,0,1)
//		})

		var light	= spotLight
		light.castShadow	= true
		light.shadow.camera.near	= 0.01
		light.shadow.camera.ar	= 15
		light.shadow.camera.fov	= 45

		light.shadow.camera.left	= -8
		light.shadow.camera.right	=  8
		light.shadow.camera.top	=  8
		light.shadow.camera.bottom= -8

		// light.shadowCameraVisible = true

		light.shadow.bias	= 0.0
		light.shadow.darkness	= 0.5

		light.shadow.mapSize.width	= 1024
		light.shadow.mapSize.height	= 1024

		return res;
	}
	var textureBuffer = {};

	function loadTexture(texturePath) {
		if(textureBuffer[texturePath]) {
			return textureBuffer[texturePath];
		}
		var texloader = new THREE.TextureLoader();
		var texture = texloader.load( texturePath );
		texturePath[texturePath] = texture;
		return texture;
	}