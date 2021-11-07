const G = 0.005;

/* Calculate distance between two bodies. */
function distance(a, b) {
  return Math.sqrt(Math.pow(a.position.x - b.position.x, 2)
                 + Math.pow(a.position.y - b.position.y, 2)
                 + Math.pow(a.position.z - b.position.z, 2));
}

/* Calculate force vector between two bodies. */
function gvector(a, b) {
  const dist = distance(a, b);
	const force = G * ((a.mass + b.mass) / Math.pow(dist, 2));
  return {
    x: ((a.position.x - b.position.x) / dist) * force,
    y: ((a.position.y - b.position.y) / dist) * force,
    z: ((a.position.z - b.position.z) / dist) * force,
  };
}

class Body {
  constructor(size, mass, scene) {
    this.size = size;
    this.mass = mass;

    this.scene = scene;

		this.step = 0;

    this.position     = { x: 0, y: 0, z: 0 };
    this.velocity     = { x: 0, y: 0, z: 0 };
    this.acceleration = { x: 0, y: 0, z: 0 };

    this.trail = [];
    const geometry = new THREE.BufferGeometry().setFromPoints(this.trail);
    const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
    this.line = new THREE.Line(geometry, material);
    scene.add(this.line)
  }

  update() {
    this.velocity.x += this.acceleration.x;
    this.velocity.y += this.acceleration.y;
    this.velocity.z += this.acceleration.z;
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.position.z += this.velocity.z;

		this.step += 1;
		if (!(this.step % 5)) {
			this.scene.remove(this.line);
			this.trail.push({ x: this.position.x, y: this.position.y, z: this.position.z })
			if (this.trail.length > 200) {
				this.trail.shift();
			}
			this.scene.remove(this.line);
			const geometry = new THREE.BufferGeometry().setFromPoints(this.trail);
			const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
			this.line = new THREE.Line(geometry, material);

			this.scene.add(this.line);
		}
  }

  collide(other) {
    if (distance(this, other) < this.radius + other.radius) {
      console.log('collision!');
    }
  }

	destroy() {
	}
}

class Planet extends Body {
  constructor(size, mass, scene) {
    super(size, mass, scene);

    let that = this;
    var loader = new THREE.TextureLoader();
    loader.load('/img/mars.jpg', function (texture) {
      that.geometry = new THREE.SphereGeometry(that.size, 32, 16);
      that.material = new THREE.MeshPhongMaterial({ map: texture, color: 0xffffff });
      that.sphere = new THREE.Mesh(that.geometry, that.material);
      that.sphere.receiveShadow = true;
      that.sphere.castShadow = true;
      scene.add(that.sphere);
    })
  }

  update() {
    super.update();
    if (this.sphere) {
      this.sphere.position.x = this.position.x;
      this.sphere.position.y = this.position.y;
      this.sphere.position.z = this.position.z;
			this.sphere.rotation.y += 0.3;
    }
  }

	destroy() {
		super.destroy()
		this.scene.remove(this.sphere);
	}
}

class Star extends Body {
  constructor(size, mass, scene) {
    super(size, mass, scene);

    let that = this;
    var loader = new THREE.TextureLoader();
    loader.load('/img/sun.jpg', function (texture) {
      const sphere = new THREE.SphereGeometry(that.size, 32, 16);
      that.light = new THREE.PointLight(0xffffff, 1.5);
      that.light.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff })));
      that.light.position.set(0, 0, 0);
      that.light.castShadow = true;
      scene.add(that.light);
    })
  }

  update() {
    super.update();
    if (this.light) {
      this.light.position.x = this.position.x;
      this.light.position.y = this.position.y;
      this.light.position.z = this.position.z;
			this.light.rotation.y += 0.002;
    }
  }

	destroy() {
		super.destroy()
		this.scene.remove(this.light);
	}
};

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMapEnabled = true;
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);

// Let's setup our solar system. Ugly but it works.
// Should we calculate size and mass based on density?
// What about procedurally generated planets using perlin noise?
// Load real data from our solar system?
const bodies = [
	new Star  (5.0, 100, scene),
	new Planet(0.8,   1, scene),
	new Planet(0.8,   1, scene),
	new Planet(0.8,   1, scene),
	new Planet(0.8,   1, scene),
];

_ = bodies[1]; _.velocity.z = -0.10; _.position.x = 25; _.position.y =  7;
_ = bodies[2]; _.velocity.x =  0.10; _.position.z = 35; _.position.y =  2;
_ = bodies[3]; _.velocity.z = -0.07; _.position.x = 50; _.position.y =  7;
_ = bodies[4]; _.velocity.x =  0.05; _.position.z = 50; _.position.y = -3;

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onWindowResize);

function animate() {
  requestAnimationFrame(animate);

  // calculate all combinations and iterate through them, thanks StackOverflow
  bodies.flatMap((v, i) => bodies.slice(i + 1).map(w => [v, w])).forEach((i) => {
    const a = i[0];
    const b = i[1];
    const f = gvector(a, b);

    a.velocity.x += -f.x / a.mass;
    a.velocity.y += -f.y / a.mass;
    a.velocity.z += -f.z / a.mass;

    b.velocity.x += f.x / b.mass;
    b.velocity.y += f.y / b.mass;
    b.velocity.z += f.z / b.mass;

    a.collide(b)
  })

  controls.update();

  bodies.forEach(b => b.update())

  renderer.render(scene, camera);
}
animate();
