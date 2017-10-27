// Physics engine
// Extend THREE.Mesh.
THREE.Mesh.prototype.setBodyPosition = function(x, y) {
	if(this.userData.body) {
		this.userData.body.position[0] = x;
		this.userData.body.position[1] = y;
	}
}

THREE.Mesh.prototype.setAngle = function(angle) {
	if(this.userData.body) {
		this.userData.body.angle = angle;
	}
}

const BODY_BOX = 1;
const BODY_CIRCLE = 2;
const OBJ_3D = 3;

const REVOLUTE_CONSTRAINT = 1;
const OBJ_WRAPPER_NAME = "OBJ3D_WRAPPER";


/**********************************************************
 * Extends p2.World.
 **********************************************************/
p2.World.prototype.findConstraint = function(body) {
	var len = this.constraints.length;
	var res = [];
	for(var ii=0;ii<len;ii++) {
		if(this.constraints[ii].bodyA == body || this.constraints[ii].bodyB == body) {
			res.push(this.constraints[ii]);
		}
	}
	
	return res;
}


var PhysicsEngine = function() {

	// World.
	this._world;
	this._fixedTimeStep = 1 / 15; // seconds
	this._maxSubSteps = 10; // Max sub steps to catch up with the wall clock
	this._lastTime;
	this._isRunning = true;

	// Default material for shape.
	this._defaultMaterial = new p2.Material();
	this._defaultFrictionContactMaterial;
	this._defaultFriction = 2.5;
	this._defaultCollisionResponse = true;
	this._groundBody = null;

};

PhysicsEngine.DefaultGravity = -20;
PhysicsEngine.DefaultDamping = 0.1;
PhysicsEngine.DefaultTimeStep = 1/15;
PhysicsEngine.StoppedTimeStep = 1/300;

PhysicsEngine.ToolMode = {};
PhysicsEngine.ToolMode.None 		= 0;
PhysicsEngine.ToolMode.NailToGround = 1;

PhysicsEngine.prototype.setIsRunning = function(isRunning) {
	this._isRunning = isRunning;
}

PhysicsEngine.prototype.getIsRunning = function() {
	return this._isRunning;
}

PhysicsEngine.prototype.setGravity = function(gravity) {
	this._world.gravity = [0, gravity];
}

PhysicsEngine.prototype.getGravity = function() {
	return this._world.gravity[1];
}

PhysicsEngine.prototype.setTimeStep = function(step) {
	this._fixedTimeStep = step;
}

PhysicsEngine.prototype.setCollisionResponse = function(isResponseCollision) {
	var len = this._world.bodies.length;
	var bodies = this._world.bodies;
	for(var ii=0;ii<len;ii++) {
		bodies[ii].collisionResponse = isResponseCollision;	
	}
	this._defaultCollisionResponse = isResponseCollision;
}

PhysicsEngine.prototype.setBodyDamping = function(damping) {
	var len = this._world.bodies.length;
	var bodies = this._world.bodies;
	for(var ii=0;ii<len;ii++) {
		bodies[ii].damping = damping;
		bodies[ii].angularDamping = damping;
	}
}

PhysicsEngine.prototype.getBodyById = function(id) {
	if(!this._world.getBodyById(id)) {
		return null;
	}

	return this._world.getBodyById(id);
}

PhysicsEngine.prototype.createDefaultBody = function(params) {

	// check value.
	if(!params.type) {
		params.type = p2.Body.DYNAMIC;
	}

	return new p2.Body({
		type:params.type,
	    mass: 100,
        position: [0, 0],
        angle: 0,
        velocity: [0, 0],
        angularVelocity: 0,
        damping: 1,
        angularDamping: 1
	});
}

PhysicsEngine.prototype.createBoxBody = function(width, height, type) {
	// Create an empty dynamic body
	var body = this.createDefaultBody({type: type});
	body.collisionResponse = this._defaultCollisionResponse;

	// Add a circle shape to the body
	var shape = new p2.Box({ width:width, height:height ,material: this._defaultMaterial});
	body.addShape(shape);

	// ...and add the body to the world.
	// If we don't add it to the world, it won't be simulated.
	this._world.addBody(body);

	return body;
}

PhysicsEngine.prototype.createCircleBody = function(width, type) {
	var body = this.createDefaultBody({type: type});
	body.collisionResponse = this._defaultCollisionResponse;

	var shape = new p2.Circle({radius: width ,material: this._defaultMaterial});
	body.addShape(shape);

	this._world.addBody(body);
	return body;
}


PhysicsEngine.prototype.createWorld = function() {
	// Create a physics world, where bodies and constraints live
	var world = new p2.World({
	    gravity:[0, -9.82]
	});
	
	this._defaultFrictionContactMaterial = new p2.ContactMaterial(this._defaultMaterial, this._defaultMaterial, {
		friction: this._defaultFriction,
		restitution: 0.4
    });
    world.addContactMaterial(this._defaultFrictionContactMaterial);

    this._groundBody = new p2.Body();
    world.addBody(this._groundBody);

	this._world = world;
}

PhysicsEngine.prototype.update = function(time) {
	
	if(!this._isRunning) {
	 	return;
	}

    var deltaTime = this._lastTime ? (time - this._lastTime) / 1000 : 0;

    // this._world.step(this._fixedTimeStep, deltaTime, this._maxSubSteps);
    this._world.step(this._fixedTimeStep);
    this._lastTime = time;
}