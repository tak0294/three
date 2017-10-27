var RenderEngine = function() {
	
	this._container     = null;
	this._renderer 		= null;
	this._renderElement = null;
	this._camera 		= null;
	this._postprocess 	= {enabled: false};
	this._rootScene     = null;
	
	this._parameters = {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBFormat,
//		stencilBuffer: false
	};

	this._ssaoParameters = {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBFormat,
	}

	this._composer = null;
	this._shaders  = [];
	
	/****
	 * Camera settings.
	 ****/
	this._cameraZoomLevel  = 65;
	this._cameraNear	   = 1;
	this._cameraFar	   	   = 10000;
	this._cameraPosition  = new THREE.Vector3(0, 0, 740);
	this._cameraLookAt    = new THREE.Vector3(0, 0, 0);
	this._cameraDestinationPosition = this._cameraPosition.clone();
	
	/****
	 * Render state settings.
	 ****/
	this._isRunning = false;
	
	/****
	 * Active scenes.
	 ****/
	this._activeScene = null;
	
	
	
	
	/*********************************************************
	 * debug purpose.
	 **********************************************************/
	this._depthMaterial = new THREE.MeshBasicMaterial();
	this._ssaoDepathMaterial = new THREE.MeshDepthMaterial();
	this._ssaoDepathMaterial.depthPacking = THREE.RGBADepthPacking;
	this._ssaoDepathMaterial.blending = THREE.NoBlending;

	this._depthTexture  = null;
	this._depthTarget   = null;
	this._ssaoDepthTarget = null;
}

RenderEngine.Shader = {};
RenderEngine.Shader.Dof     = new WAGNER.GuidedFullBoxBlurPass();
RenderEngine.Shader.Cga 	= new WAGNER.CGAPass();
RenderEngine.Shader.Noise 	= new WAGNER.NoisePass();
RenderEngine.Shader.Noise.params.speed = 0.2;
RenderEngine.Shader.Noise.params.amount = 0.3;
RenderEngine.Shader.ChromaticAberration = new WAGNER.ChromaticAberrationPass();
RenderEngine.Shader.Halftone  = new WAGNER.HalftonePass();
RenderEngine.Shader.Halftone2 = new WAGNER.Halftone2Pass();
RenderEngine.Shader.MultiPassBloom = new WAGNER.MultiPassBloomPass();
RenderEngine.Shader.MultiPassBloom.params.blurAmount = 2;



RenderEngine.ShaderEnable = {};
RenderEngine.ShaderEnable.RadialBlur			= false;
RenderEngine.ShaderEnable.Dof					= false;
RenderEngine.ShaderEnable.Cga 					= false;
RenderEngine.ShaderEnable.Noise 				= false;
RenderEngine.ShaderEnable.ChromaticAberration 	= false;
RenderEngine.ShaderEnable.Halftone 				= false;
RenderEngine.ShaderEnable.Halftone2 			= false;
RenderEngine.ShaderEnable.MultiPassBloom		= false;
RenderEngine.ShaderEnable.Ssao 					= false;
RenderEngine.ShaderEnable.Raster				= false;



RenderEngine.ShaderMaterial = {};

RenderEngine.ShaderMaterial.Raster = new THREE.ShaderMaterial({
	uniforms: {
		"resolution":{ type: 'v2', value: new THREE.Vector2( 1, 1 ) },
		"time":     { type: 'f', value: Date.now() },
		"tInput": { type: "t", value: null },
		"wave_phase": { type: 'f', value: 1.0 },
		"wave_size": {type: 'f', value: 30.0 },
	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join("\n"),

	fragmentShader: [
		"uniform sampler2D tInput;",
		"uniform float wave_phase;",
		"uniform float wave_size;",
		"varying vec2 vUv;",
		"void main()",
		"{",
			"vec2 p = vUv;",
			"p.x = mod(1.0 + p.x + 0.05*sin(p.y * wave_size + wave_phase * 0.75), 1.0);",
			"gl_FragColor = texture2D(tInput, p);",
		"}",
  ].join("\n"),
});

RenderEngine.ShaderMaterial.RadialBlur = new THREE.ShaderMaterial({

	uniforms: {
		"resolution":{ type: 'v2', value: new THREE.Vector2( 1, 1 ) },
		"time":     { type: 'f', value: Date.now() },
		"tInput":   { type: "t", value: null },
		"tDepth":   { type: "t", value: null },
		"steps":    { type: "f", value: 80.0 },
		"strength": { type: "f", value: 0.98 },
		"expo": 	{ type: "f", value: 3.0 },
		"center":   { type: "v2", value: new THREE.Vector2( 0.5, 0.5 ) },

	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join("\n"),

	fragmentShader: [

		"uniform float steps;",
		"uniform float strength;",
		"uniform float expo;",
		"uniform sampler2D tInput;",
		"uniform sampler2D tDepth;",
		"uniform vec2 center;",

		"varying vec2 vUv;",

		"void main() {",

		    "vec2 s = vUv;",

		    "vec3 total = vec3(0.0);",
		    "vec2 d = (center-vUv)/steps;",
		    "float w = 1.0;",

		    //"for( int i=0; i<int(steps); i++ ) {",
		    "for( int i=0; i<80; i++ ) {", // hardcode since the above fails in angle...
		        "vec3 res = texture2D( tDepth, s).xyz;",
		        "res = smoothstep(0.0,1.0,res);",
		        "total += w*res;",
		        "w *= strength;",
		        "s += d;",
		    "}",
		    "total /= steps;",

			//"gl_FragColor = vec4( total*expo, 1.0);",
			"vec3 dif = texture2D( tInput, vUv).xyz;",
			"gl_FragColor = vec4( mix(total*expo, dif*2.0, 0.5), 1.0);",

		"}"

	].join("\n")

});

RenderEngine.ShaderMaterial.Dot = new THREE.ShaderMaterial({

	uniforms: {
		"resolution":{ type: 'v2', value: new THREE.Vector2( 1, 1 ) },
		"time":     { type: 'f', value: Date.now() },
//		"tInput"  : { type: 't', value: new THREE.Texture() },
		"tInput": { type: "t", value: null },
		"tSize":    { type: "v2", value: new THREE.Vector2( 256, 256 ) },
		"center":   { type: "v2", value: new THREE.Vector2( 0.5, 0.5 ) },
		"angle":    { type: "f", value: 1.57 },
		"scale":    { type: "f", value: 1.0 }

	},

	vertexShader: [

		"varying vec2 vUv;",
		"void main() {",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join("\n"),

	fragmentShader: [

		"uniform vec2 center;",
		"uniform float angle;",
		"uniform float scale;",
		"uniform vec2 tSize;",

		"uniform sampler2D tInput;",

		"varying vec2 vUv;",

		"float pattern() {",

			"float s = sin( angle ), c = cos( angle );",
			"vec2 tex = vUv * tSize - center;",
			"vec2 point = vec2( c * tex.x - s * tex.y, s * tex.x + c * tex.y ) * scale;",
			"return ( sin( point.x ) * sin( point.y ) ) * 4.0;",

		"}",

		"void main() {",
			"vec4 color = texture2D( tInput, vUv );",
			"float average = ( color.r + color.g + color.b ) / 3.0;",
			"gl_FragColor = vec4( vec3( average * 10.0 - 5.0 + pattern() ), color.a );",

		"}"

	].join("\n")

});

RenderEngine.ShaderMaterial.Ssao = new THREE.ShaderMaterial({

	uniforms: {
		"resolution":{ type: 'v2', value: new THREE.Vector2( 1, 1 ) },
		"time":     { type: 'f', value: Date.now() },

		"tInput":     { type: "t", value: null },
		"tDepth":       { value: null },
		"size":         { value: new THREE.Vector2( 512, 512 ) },
		"cameraNear":   { value: 1 },
		"cameraFar":    { value: 100 },
		"onlyAO":       { value: 0 },
		"aoClamp":      { value: 0.5 },
		"lumInfluence": { value: 0.5 }

	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",

			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join( "\n" ),

	fragmentShader: [

		"uniform float cameraNear;",
		"uniform float cameraFar;",

		"uniform bool onlyAO;",      // use only ambient occlusion pass?

		"uniform vec2 size;",        // texture width, height
		"uniform float aoClamp;",    // depth clamp - reduces haloing at screen edges

		"uniform float lumInfluence;",  // how much luminance affects occlusion

		"uniform sampler2D tInput;",
		"uniform sampler2D tDepth;",

		"varying vec2 vUv;",

		// "#define PI 3.14159265",
		"#define DL 2.399963229728653",  // PI * ( 3.0 - sqrt( 5.0 ) )
		"#define EULER 2.718281828459045",

		// user variables

		"const int samples = 8;",     // ao sample count
		"const float radius = 5.0;",  // ao radius

		"const bool useNoise = false;",      // use noise instead of pattern for sample dithering
		"const float noiseAmount = 0.0003;", // dithering amount

		"const float diffArea = 0.4;",   // self-shadowing reduction
		"const float gDisplace = 0.4;",  // gauss bell center


		// RGBA depth

		"#include <packing>",

		// generating noise / pattern texture for dithering

		"vec2 rand( const vec2 coord ) {",

			"vec2 noise;",

			"if ( useNoise ) {",

				"float nx = dot ( coord, vec2( 12.9898, 78.233 ) );",
				"float ny = dot ( coord, vec2( 12.9898, 78.233 ) * 2.0 );",

				"noise = clamp( fract ( 43758.5453 * sin( vec2( nx, ny ) ) ), 0.0, 1.0 );",

			"} else {",

				"float ff = fract( 1.0 - coord.s * ( size.x / 2.0 ) );",
				"float gg = fract( coord.t * ( size.y / 2.0 ) );",

				"noise = vec2( 0.25, 0.75 ) * vec2( ff ) + vec2( 0.75, 0.25 ) * gg;",

			"}",

			"return ( noise * 2.0  - 1.0 ) * noiseAmount;",

		"}",

		"float readDepth( const in vec2 coord ) {",

			"float cameraFarPlusNear = cameraFar + cameraNear;",
			"float cameraFarMinusNear = cameraFar - cameraNear;",
			"float cameraCoef = 2.0 * cameraNear;",

			// "return ( 2.0 * cameraNear ) / ( cameraFar + cameraNear - unpackDepth( texture2D( tDepth, coord ) ) * ( cameraFar - cameraNear ) );",
			"return cameraCoef / ( cameraFarPlusNear - unpackRGBAToDepth( texture2D( tDepth, coord ) ) * cameraFarMinusNear );",


		"}",

		"float compareDepths( const in float depth1, const in float depth2, inout int far ) {",

			"float garea = 2.0;",                         // gauss bell width
			"float diff = ( depth1 - depth2 ) * 100.0;",  // depth difference (0-100)

			// reduce left bell width to avoid self-shadowing

			"if ( diff < gDisplace ) {",

				"garea = diffArea;",

			"} else {",

				"far = 1;",

			"}",

			"float dd = diff - gDisplace;",
			"float gauss = pow( EULER, -2.0 * dd * dd / ( garea * garea ) );",
			"return gauss;",

		"}",

		"float calcAO( float depth, float dw, float dh ) {",

			"float dd = radius - depth * radius;",
			"vec2 vv = vec2( dw, dh );",

			"vec2 coord1 = vUv + dd * vv;",
			"vec2 coord2 = vUv - dd * vv;",

			"float temp1 = 0.0;",
			"float temp2 = 0.0;",

			"int far = 0;",
			"temp1 = compareDepths( depth, readDepth( coord1 ), far );",

			// DEPTH EXTRAPOLATION

			"if ( far > 0 ) {",

				"temp2 = compareDepths( readDepth( coord2 ), depth, far );",
				"temp1 += ( 1.0 - temp1 ) * temp2;",

			"}",

			"return temp1;",

		"}",

		"void main() {",

			"vec2 noise = rand( vUv );",
			"float depth = readDepth( vUv );",

			"float tt = clamp( depth, aoClamp, 1.0 );",

			"float w = ( 1.0 / size.x )  / tt + ( noise.x * ( 1.0 - noise.x ) );",
			"float h = ( 1.0 / size.y ) / tt + ( noise.y * ( 1.0 - noise.y ) );",

			"float ao = 0.0;",

			"float dz = 1.0 / float( samples );",
			"float z = 1.0 - dz / 2.0;",
			"float l = 0.0;",

			"for ( int i = 0; i <= samples; i ++ ) {",

				"float r = sqrt( 1.0 - z );",

				"float pw = cos( l ) * r;",
				"float ph = sin( l ) * r;",
				"ao += calcAO( depth, pw * w, ph * h );",
				"z = z - dz;",
				"l = l + DL;",

			"}",

			"ao /= float( samples );",
			"ao = 1.0 - ao;",

			"vec3 color = texture2D( tInput, vUv ).rgb;",

			"vec3 lumcoeff = vec3( 0.299, 0.587, 0.114 );",
			"float lum = dot( color.rgb, lumcoeff );",
			"vec3 luminance = vec3( lum );",

			"vec3 final = vec3( color * mix( vec3( ao ), vec3( 1.0 ), luminance * lumInfluence ) );",  // mix( color * ao, white, luminance )

			"if ( onlyAO ) {",

				"final = vec3( mix( vec3( ao ), vec3( 1.0 ), luminance * lumInfluence ) );",  // ambient occlusion only

			"}",

			"gl_FragColor = vec4( final, 1.0 );",

		"}"

	].join( "\n" )


});



RenderEngine.prototype.initialize = function(renderElement) {
	
	// Create and append container.
	this._container = document.createElement( "div" );
	$(renderElement).append(this._container);
	
	// Create camera.
	this._camera = new THREE.PerspectiveCamera( this._cameraZoomLevel, 
												$(renderElement).width() / $(renderElement).height(),
												this._cameraNear,
												this._cameraFar );
	console.log(this._cameraPosition);
	this._camera.position.set(this._cameraPosition.x, this._cameraPosition.y, this._cameraPosition.z);
	this._camera.lookAt(this._cameraLookAt);
	
	// Create root scene.
	this._rootScene = new THREE.Scene();
	
	// Create renderer.
	this._renderer = new THREE.WebGLRenderer( { antialias: true } );
	this._renderer.setPixelRatio( window.devicePixelRatio );
	this._renderer.setSize( $(renderElement).width(), $(renderElement).height() );
	this._renderer.shadowMap.enabled = true;
	this._renderer.autoClear = false;
	this._container.appendChild( this._renderer.domElement );
	
	// Create renderTarget and composer.
	this._composer     = new WAGNER.Composer( this._renderer, {useRGBA: false });
	this._composer.setSize($(renderElement).width(), $(renderElement).height());
	
	this.setupShaders();
}


/****
 * Setup shaders.
 ****/
RenderEngine.prototype.setupShaders = function() {
	var _this = this;
	
	/*****
	 * Dof Shader.
	 ******/
	var sL = new ShaderLoader()
	sL.add( 'depth-vs', WAGNER.vertexShadersPath   + '/packed-depth-vs.glsl' );
	sL.add( 'depth-fs', WAGNER.fragmentShadersPath + '/packed-depth-fs.glsl' );
	sL.load();
	sL.onLoaded( function() {
//			console.log(camera.near, camera.far);
		_this._depthMaterial = new THREE.ShaderMaterial( {
			uniforms: {
				mNear: { type: 'f', value: _this._camera.near },
				mFar: { type: 'f', value: _this._camera.far }
			},
			vertexShader: this.get( 'depth-vs' ),
			fragmentShader: this.get( 'depth-fs' ),
			shading: THREE.SmoothShading
		} );
	} );
	
	this._depthTexture = WAGNER.Pass.prototype.getOfflineTexture( this._composer.width, this._composer.height, false );
	
	// RadialBlur.
	var depthScale = 1;
	this._depthTarget  = new THREE.WebGLRenderTarget( this._composer.width * depthScale, this._composer.height * depthScale, this._parameters );
	RenderEngine.ShaderMaterial.RadialBlur.uniforms[ "tDepth" ].value = this._depthTarget;
	

	// SSAO.
	this._ssaoDepthTarget = new THREE.WebGLRenderTarget( this._composer.width * depthScale, this._composer.height * depthScale, this._ssaoParameters );
	RenderEngine.ShaderMaterial.Ssao.uniforms[ "tDepth" ].value = this._ssaoDepthTarget.texture;
	RenderEngine.ShaderMaterial.Ssao.uniforms[ 'size' ].value.set( this._composer.width, this._composer.height );
	RenderEngine.ShaderMaterial.Ssao.uniforms[ 'cameraNear' ].value = this._camera.near;
	RenderEngine.ShaderMaterial.Ssao.uniforms[ 'cameraFar' ].value = this._camera.far;
	RenderEngine.ShaderMaterial.Ssao.uniforms[ 'onlyAO' ].value = 0;
	RenderEngine.ShaderMaterial.Ssao.uniforms[ 'aoClamp' ].value = 0.6;
	RenderEngine.ShaderMaterial.Ssao.uniforms[ 'lumInfluence' ].value = 0.2;
}


/****
 * Append to root scene.
 ****/
RenderEngine.prototype.addRootScene = function(obj) {
	this._rootScene.add(obj);
}



/****
 * Change render states.
 ****/
RenderEngine.prototype.startRender = function() {
	this._isRunning = true;
	this.animate();
}

RenderEngine.prototype.stopRender = function() {
	this._isRunning = false;
}


RenderEngine.prototype.addCameraDestinationPositionZ = function(z) {
	this._cameraDestinationPosition.z += z;
}

/****
 * Render functions.
 ****/
RenderEngine.prototype.animate = function(time) {

	this._camera.position.z += (this._cameraDestinationPosition.z-this._camera.position.z) * 0.1;

	if(this._isRunning) {
		requestAnimationFrame( this.animate.bind(this) );
	}
	
	if(this._activeScene) {
		this._activeScene.update(time);
	}

	if(this._activeScene) {
		this._activeScene.preRender();
	}
	
	this.render();
	
	if(this._activeScene) {
		this._activeScene.postRender();
	}
	
}

RenderEngine.prototype.render = function() {

	// camera update.
	this._camera.updateProjectionMatrix();

	// Initialize composer.
	this._composer.reset();
	
	if(RenderEngine.ShaderEnable.Dof) {
		this._depthMaterial.side = THREE.DoubleSide;
		this._rootScene.overrideMaterial = this._depthMaterial;
		this._composer.render( this._rootScene, this._camera, null, this._depthTexture );
		RenderEngine.Shader.Dof.params.tBias = this._depthTexture;
	}
	
	if(RenderEngine.ShaderEnable.Ssao) {
		this._rootScene.overrideMaterial = this._ssaoDepathMaterial;
		// this._composer.render(this._rootScene, this._camera, this._ssaoDepthTarget);
		this._renderer.render(this._rootScene, this._camera, this._ssaoDepthTarget, true);

	}

	this._rootScene.overrideMaterial = null;
	this._composer.render( this._rootScene, this._camera );

	// Noise Shader.
	if(RenderEngine.ShaderEnable.Noise) {
		this._composer.pass( RenderEngine.Shader.Noise);
	}

	// Cga Shaer (8bit!).
	if(RenderEngine.ShaderEnable.Cga) {
		this._composer.pass( RenderEngine.Shader.Cga);
	}

	// ChromaticAberration Shader.
	if(RenderEngine.ShaderEnable.ChromaticAberration) {
		this._composer.pass( RenderEngine.Shader.ChromaticAberration);
	}
	
	// Halftone2 Shader.
	if(RenderEngine.ShaderEnable.Halftone2) {
		this._composer.pass( RenderEngine.Shader.Halftone2);
	}

	// Halftone Shader.
	if(RenderEngine.ShaderEnable.Halftone) {
		this._composer.pass( RenderEngine.Shader.Halftone);
	}

	
	// MultiPassBloom.
	if(RenderEngine.ShaderEnable.MultiPassBloom) {
		this._composer.pass( RenderEngine.Shader.MultiPassBloom );
	}
	

//	this._composer.pass( RenderEngine.ShaderMaterial.Dot );

	if(RenderEngine.ShaderEnable.RadialBlur) {
		this._composer.pass( RenderEngine.ShaderMaterial.RadialBlur);	
	}

	if(RenderEngine.ShaderEnable.Ssao) {
		this._composer.pass( RenderEngine.ShaderMaterial.Ssao);
	}
	
	if(RenderEngine.ShaderEnable.Raster) {
		this._composer.pass( RenderEngine.ShaderMaterial.Raster );
	}

	// Dof.
	if(RenderEngine.ShaderEnable.Dof) {
		this._composer.pass( RenderEngine.Shader.Dof);
	}
	

	this._composer.toScreen();
	// this._renderer.render(this._rootScene, this._camera);
}


/*****
 * Add shader pass.
 *****/
RenderEngine.prototype.enableShader = function(shader) {

	

}

/****
 * Add active scene.
 ****/
RenderEngine.prototype.setActiveScene = function(scene) {
	this._activeScene = scene;
}