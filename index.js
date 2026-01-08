const numberOfParticles = 6000;

const particleImage = 'https://motionarray.imgix.net/preview-34649aJ93evd9dG_0008.jpg?w=660&q=60&fit=max&auto=format',
particleColor = '0xff0000',
particleSize = 0.2;

const defaultAnimationSpeed = 1,
morphAnimationSpeed = 3;

const triggers = document.getElementsByClassName('triggers')[0].querySelectorAll('span');

var stats = new Stats();
stats.showPanel(0);

var renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);


function fullScreen() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

window.addEventListener('resize', fullScreen, false);

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);

camera.position.y = 25;
camera.position.z = 36;

var controls = new THREE.OrbitControls(camera);
controls.update();

var particleCount = numberOfParticles;


let spherePoints,
cubePoints,
rocketPoints,
spacemanPoints;

var particles = new THREE.Geometry(),
sphereParticles = new THREE.Geometry(),
cubeParticles = new THREE.Geometry(),
rocketParticles = new THREE.Geometry(),
spacemanParticles = new THREE.Geometry();

var pMaterial = new THREE.PointCloudMaterial({
    color: particleColor,
    size: particleSize,
    map: THREE.ImageUtils.loadTexture(particleImage),
    blending: THREE.AdditiveBlending,
    transparent: true
});

var geometry = new THREE.SphereGeometry(5, 30, 30);

spherePoints = THREE.GeometryUtils.randomPointsInGeometry(geometry, particleCount);

var geometry = new THREE.BoxGeometry(9, 9, 9);

cubePoints = THREE.GeometryUtils.randomPointsInGeometry(geometry, particleCount);

const codepenAssetUrl = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/605067/';

// Track loaded assets
const assetsLoaded = {
    sphere: true,
    cube: true,
    rocket: false,
    spaceman: false
};

var objLoader = new THREE.OBJLoader();
objLoader.setPath(codepenAssetUrl);
objLoader.load('CartoonRocket.obj', 
    function(object) {
        object.traverse(function(child) {
            if (child instanceof THREE.Mesh) {
                let scale = 2.1;
                let area = new THREE.Box3();
                area.setFromObject(child);
                let yoffset = (area.max.y + area.min.y) / 2;

                child.geometry.scale(scale, scale, scale);
                rocketPoints = THREE.GeometryUtils.randomPointsInBufferGeometry(child.geometry, particleCount);
                createVertices(rocketParticles, rocketPoints, yoffset, 2);
                assetsLoaded.rocket = true;
            }
        });
    },
    function(xhr) {
        console.log('Rocket: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function(error) {
        console.error('Error loading rocket:', error);
        triggers[2].setAttribute('data-disabled', 'true');
        triggers[2].innerHTML = 'Load Failed';
    }
);

var objLoader2 = new THREE.OBJLoader();
objLoader2.setPath(codepenAssetUrl);
objLoader2.load('Astronaut.obj', 
    function(object) {
        object.traverse(function(child) {
            if (child instanceof THREE.Mesh) {
                let scale = 4.6;
                let area = new THREE.Box3();
                area.setFromObject(child);
                let yoffset = (area.max.y + area.min.y) / 2;

                child.geometry.scale(scale, scale, scale);
                spacemanPoints = THREE.GeometryUtils.randomPointsInBufferGeometry(child.geometry, particleCount);
                createVertices(spacemanParticles, spacemanPoints, yoffset, 3);
                assetsLoaded.spaceman = true;
            }
        });
    },
    function(xhr) {
        console.log('Astronaut: ' + (xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function(error) {
        console.error('Error loading astronaut:', error);
        triggers[3].setAttribute('data-disabled', 'true');
        triggers[3].innerHTML = 'Load Failed';
    }
);


for(var p = 0; p < particleCount; p++) {
    var vertex = new THREE.Vector3();
    vertex.x = 0;
    vertex.y = 0;
    vertex.z = 0;   
    
    particles.vertices.push(vertex);
}

createVertices(sphereParticles, spherePoints, null, null);
createVertices(cubeParticles, cubePoints, null, 1);

function createVertices(emptyArray, points, yoffset = 0, trigger = null) {
    for(var p = 0; p < particleCount; p++) {
        var vertex = new THREE.Vector3();
        vertex.x = points[p]['x'];
        vertex.y = points[p]['y'] - (yoffset || 0);
        vertex.z = points[p]['z'];

        emptyArray.vertices.push(vertex);
    }

    if(trigger !== null) {
        triggers[trigger].setAttribute('data-disabled', false);
    }
}

var particleSystem = new THREE.PointCloud(
    particles,
    pMaterial
);

particleSystem.sortParticles = true;

scene.add(particleSystem);

const normalSpeed = (defaultAnimationSpeed / 100),
fullSpeed = (morphAnimationSpeed / 100);

let animationVars = {
    speed: normalSpeed,
    isMorphing: false
}

function animate() {
     stats.begin();
     particleSystem.rotation.y += animationVars.speed;
     particles.verticesNeedUpdate = true;
     stats.end();

     window.requestAnimationFrame(animate);
     renderer.render(scene, camera);
}

animate();

// Safe initialization with delay
setTimeout(function() {
    if (spherePoints && spherePoints.length > 0) {
        toSphere();
    } else {
        setTimeout(toSphere, 100);
    }
}, 500);

function toSphere() {
   if (animationVars.isMorphing) return;
   handleTriggers(0);
   morphTo(sphereParticles);
}

function toCube() {
   if (animationVars.isMorphing) return;
   handleTriggers(1);
   morphTo(cubeParticles);
}

function toRocket() {
   if (animationVars.isMorphing || !assetsLoaded.rocket) return;
   handleTriggers(2);
   morphTo(rocketParticles);
}

function toSpaceman() {
   if (animationVars.isMorphing || !assetsLoaded.spaceman) return;
   handleTriggers(3);
   morphTo(spacemanParticles); // Fixed typo
}

function morphTo(newParticles, color = '0xffffff') {
    animationVars.isMorphing = true;
    
    TweenMax.to(animationVars, 0.3, {
        ease: Power4.easeIn,
        speed: fullSpeed,
        onComplete: function() {
            animationVars.isMorphing = false;
        }
    });
    
    particleSystem.material.color.setHex(color);

    // Create tweens for all particles with staggered delays for better effect
    const stagger = 0.5;
    const baseDuration = 4;
    
    for (let i = 0; i < particles.vertices.length; i++) {
        const delay = Math.random() * stagger;
        
        TweenMax.to(particles.vertices[i], baseDuration, {
            delay: delay,
            ease: Elastic.easeOut.config(1, 0.75),
            x: newParticles.vertices[i].x,
            y: newParticles.vertices[i].y,
            z: newParticles.vertices[i].z,
            onStart: function() {
                if (i === 0) {
                    TweenMax.to(animationVars, baseDuration + 1, {
                        delay: 1,
                        ease: Power2.easeOut,
                        speed: normalSpeed
                    });
                }
            }
        });
    }
}

// Remove the separate slowDown function since it's now integrated

// Event listeners with loading checks
triggers[0].addEventListener('click', toSphere);
triggers[1].addEventListener('click', toCube);
triggers[2].addEventListener('click', function() {
    if (assetsLoaded.rocket) toRocket();
});
triggers[3].addEventListener('click', function() {
    if (assetsLoaded.spaceman) toSpaceman();
});

function handleTriggers(disable) {
    for (var x = 0; x < triggers.length; x++) {
        if(disable === x) {
            triggers[x].setAttribute('data-disabled', 'true');
        } else {
            // Only enable if asset is loaded
            const assetName = x === 0 ? 'sphere' : 
                             x === 1 ? 'cube' : 
                             x === 2 ? 'rocket' : 'spaceman';
            
            if (assetsLoaded[assetName]) {
                triggers[x].setAttribute('data-disabled', 'false');
            } else {
                triggers[x].setAttribute('data-disabled', 'true');
            }
        }
    }
}

// Add loading status indicator
function createLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-status';
    loadingDiv.style.position = 'fixed';
    loadingDiv.style.top = '10px';
    loadingDiv.style.right = '10px';
    loadingDiv.style.color = 'white';
    loadingDiv.style.fontSize = '12px';
    loadingDiv.style.fontFamily = 'Arial, sans-serif';
    loadingDiv.style.zIndex = '1000';
    loadingDiv.style.background = 'rgba(0,0,0,0.7)';
    loadingDiv.style.padding = '5px 10px';
    loadingDiv.style.borderRadius = '3px';
    loadingDiv.innerHTML = 'Loading...';
    document.body.appendChild(loadingDiv);
    
    return loadingDiv;
}

// Update loading status
const loadingStatus = createLoadingIndicator();
const loadingInterval = setInterval(function() {
    const loadedCount = Object.values(assetsLoaded).filter(v => v).length;
    const totalCount = Object.keys(assetsLoaded).length;
    
    if (loadedCount === totalCount) {
        loadingStatus.innerHTML = 'Ready!';
        clearInterval(loadingInterval);
        setTimeout(function() {
            loadingStatus.style.opacity = '0';
            loadingStatus.style.transition = 'opacity 1s';
            setTimeout(function() {
                loadingStatus.style.display = 'none';
            }, 1000);
        }, 1000);
    } else {
        loadingStatus.innerHTML = `Loading: ${loadedCount}/${totalCount}`;
    }
}, 100);

// Add click effects
triggers.forEach(function(trigger) {
    trigger.addEventListener('click', function() {
        if (this.getAttribute('data-disabled') === 'true') return;
        
        // Add visual feedback
        const originalColor = this.style.color;
        this.style.color = '#ff0000';
        
        setTimeout(function() {
            this.style.color = originalColor || '#fff';
        }.bind(this), 300);
    });
});

// Add instructions
const instructions = document.createElement('div');
instructions.style.position = 'fixed';
instructions.style.top = '10px';
instructions.style.left = '10px';
instructions.style.color = 'white';
instructions.style.fontSize = '12px';
instructions.style.fontFamily = 'Arial, sans-serif';
instructions.style.zIndex = '1000';
instructions.style.background = 'rgba(0,0,0,0.7)';
instructions.style.padding = '5px 10px';
instructions.style.borderRadius = '3px';

document.body.appendChild(instructions);