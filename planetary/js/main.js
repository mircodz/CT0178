const G = 0.005;

function distance(a, b) {
  const sqrt = Math.sqrt;
  const pow = Math.pow;
  return sqrt(pow(a.position.x - b.position.x, 2)
            + pow(a.position.y - b.position.y, 2)
            + pow(a.position.z - b.position.z, 2));
}

function gforce(a, b) {
  const pow = Math.pow;
  return G * ((a.mass + b.mass) / pow(distance(a, b), 2));
}

function gvector(a, b) {
  const force = gforce(a, b);
  const dist = distance(a, b);
  return {
    x: ((a.position.x - b.position.x) / dist) * force,
    y: ((a.position.y - b.position.y) / dist) * force,
    z: ((a.position.z - b.position.z) / dist) * force,
  };
}

class body {
  constructor(mass, scene) {
    this.mass = mass;

    this.trail = [];
    this.scene = scene;

    this.radius = 0;

    const geometry = new THREE.BufferGeometry().setFromPoints(this.trail);
    const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
    this.line = new THREE.Line(geometry, material);
    scene.add(this.line)

    this.position = {
      x: 0,
      y: 0,
      z: 0,
    };

    this.velocity = {
      x: 0,
      y: 0,
      z: 0,
    };

    this.acceleration = {
      x: 0,
      y: 0,
      z: 0,
    };
  }

  update() {
    this.velocity.x += this.acceleration.x;
    this.velocity.y += this.acceleration.y;
    this.velocity.z += this.acceleration.z;
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.position.z += this.velocity.z;

    this.scene.remove(this.line);
    this.trail.push({
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
    })

    if (this.trail.length > 1000) {
      this.trail.shift();
    }

    this.scene.remove(this.line);
    const geometry = new THREE.BufferGeometry().setFromPoints(this.trail);
    const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
    this.line = new THREE.Line(geometry, material);

    this.scene.add(this.line);
  }

  collide(other) {
    if (distance(this, other) < this.radius + other.radius) {
      console.log('collision!');
    }
  }
}

class planet extends body {
  constructor(mass, scene) {
    super(mass, scene);

    this.radius = this.mass * 10

    let that = this;
    var loader = new THREE.TextureLoader();
    loader.load('http://localhost:8080/img/mars.jpg', function (texture) {
      that.geometry = new THREE.SphereGeometry(that.radius, 32, 16);
      that.material = new THREE.MeshPhongMaterial({ map: texture, color: 0xffffff });
      that.sphere = new THREE.Mesh(that.geometry, that.material);
      that.sphere.receiveShadow = true;
      that.sphere.castShadow = true;
      scene.add(that.sphere);
    })
  }

  update () {
    super.update();
    if (this.sphere) {
      this.sphere.position.x = this.position.x;
      this.sphere.position.y = this.position.y;
      this.sphere.position.z = this.position.z;
    }
  }
}

class star extends body {
  constructor(mass, scene) {
    super(mass, scene);

    this.radius = this.mass

    let that = this;
    var loader = new THREE.TextureLoader();
    loader.load('http://localhost:8080/img/sun.jpg', function (texture) {
      const sphere = new THREE.SphereGeometry(that.radius, 32, 16);
      that.light = new THREE.PointLight(0xffffff, 1.5);
      that.light.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff })));
      that.light.position.set(0, 0, 0);
      that.light.castShadow = true;
      scene.add(that.light);
    })

  }

  update () {
    super.update();
    if (this.light) {
      this.light.position.x = this.position.x;
      this.light.position.y = this.position.y;
      this.light.position.z = this.position.z;
    }
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

const bodies = [];

bodies.push(new star  (5, scene));
bodies.push(new planet(0.1, scene));
bodies.push(new planet(0.1, scene));
bodies.push(new planet(0.1, scene));
bodies.push(new planet(0.1, scene));

const a = bodies[1]; a.velocity.z = -0.10; a.position.x = 25; a.position.y =  7;
const b = bodies[2]; b.velocity.x =  0.10; b.position.z = 35; b.position.y =  2;
const c = bodies[3]; c.velocity.z = -0.07; c.position.x = 50; c.position.y =  7;
const d = bodies[4]; d.velocity.x =  0.05; d.position.z = 50; d.position.y = -3;

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onWindowResize);

function animate() {
  requestAnimationFrame(animate);

  // calculate all combinations and iterate through them
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
