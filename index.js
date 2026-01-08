const numberOfParticles = 6000;

// Reduce particles on mobile for better performance
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const adjustedParticleCount = isMobile ? Math.floor(numberOfParticles * 0.7) : numberOfParticles;

const particleImage = 'https://motionarray.imgix.net/preview-34649aJ93evd9dG_0008.jpg?w=660&q=60&fit=max&auto=format',
particleColor = '0xff0000',
particleSize = isMobile ? 0.3 : 0.2; // Slightly larger on mobile

const defaultAnimationSpeed = 1,
morphAnimationSpeed = 3;

const triggers = document.getElementsByClassName('triggers')[0].querySelectorAll('span');

var stats = new Stats();
stats.showPanel(0);

// Adjust renderer for mobile
var renderer = new THREE.WebGLRenderer({
    antialias: !isMobile, // Disable antialias on mobile for performance
    alpha: true,
    powerPreference: isMobile ? "low-power" : "default"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2)); // Limit pixel ratio on mobile
document.body.appendChild(renderer.domElement);

// Store original window dimensions
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;

function fullScreen() {
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    
    renderer.setSize(windowWidth, windowHeight);
    camera.aspect = windowWidth / windowHeight;
    camera.updateProjectionMatrix();
    
    // Adjust camera for different screen sizes
    if (windowWidth < 768) {
        // Mobile adjustment
        camera.position.y = 20;
        camera.position.z = 30;
    } else {
        // Desktop
        camera.position.y = 25;
        camera.position.z = 36;
    }
}

window.addEventListener('resize', fullScreen, false);
// Also handle orientation change
window.addEventListener('orientationchange', function() {
    setTimeout(fullScreen, 100);
});

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);

// Initial camera position based on screen size
fullScreen(); // This will set the initial camera position

var controls = new THREE.OrbitControls(camera);
// Adjust controls for mobile
controls.enableZoom = true;
controls.enablePan = false;
controls.rotateSpeed = isMobile ? 0.5 : 1.0;
controls.zoomSpeed = isMobile ? 0.5 : 1.0;

var particleCount = adjustedParticleCount;


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

// Adjust geometry sizes for different screens
const sphereRadius = windowWidth < 768 ? 4 : 5;
var geometry = new THREE.SphereGeometry(sphereRadius, 
    windowWidth < 768 ? 20 : 30, 
    windowWidth < 768 ? 20 : 30
);

spherePoints = THREE.GeometryUtils.randomPointsInGeometry(geometry, particleCount);

const cubeSize = windowWidth < 768 ? 7 : 9;
var geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

cubePoints = THREE.GeometryUtils.randomPointsInGeometry(geometry, particleCount);

const codepenAssetUrl = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/605067/';

// Track loaded assets
const assetsLoaded = {
    sphere: true,
    cube: true,
    rocket: false,
    spaceman: false
};

// Auto-cycle variables
let currentShapeIndex = 0;
let autoCycleInterval = null;
let isAutoCycling = true;
// Shorter cycle time on mobile for better experience
const cycleTime = isMobile ? 4000 : 5000;

// Loading indicator variable
let loadingStatus;

var objLoader = new THREE.OBJLoader();
objLoader.setPath(codepenAssetUrl);
objLoader.load('CartoonRocket.obj', 
    function(object) {
        object.traverse(function(child) {
            if (child instanceof THREE.Mesh) {
                let scale = windowWidth < 768 ? 1.8 : 2.1;
                let area = new THREE.Box3();
                area.setFromObject(child);
                let yoffset = (area.max.y + area.min.y) / 2;

                child.geometry.scale(scale, scale, scale);
                rocketPoints = THREE.GeometryUtils.randomPointsInBufferGeometry(child.geometry, particleCount);
                createVertices(rocketParticles, rocketPoints, yoffset, 2);
                assetsLoaded.rocket = true;
                
                // Start auto-cycle if all assets are loaded
                checkAllAssetsAndStartCycle();
            }
        });
    },
    function(xhr) {
        updateLoadingProgress('Rocket', xhr.loaded / xhr.total);
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
                let scale = windowWidth < 768 ? 4.0 : 4.6;
                let area = new THREE.Box3();
                area.setFromObject(child);
                let yoffset = (area.max.y + area.min.y) / 2;

                child.geometry.scale(scale, scale, scale);
                spacemanPoints = THREE.GeometryUtils.randomPointsInBufferGeometry(child.geometry, particleCount);
                createVertices(spacemanParticles, spacemanPoints, yoffset, 3);
                assetsLoaded.spaceman = true;
                
                // Start auto-cycle if all assets are loaded
                checkAllAssetsAndStartCycle();
            }
        });
    },
    function(xhr) {
        updateLoadingProgress('Astronaut', xhr.loaded / xhr.total);
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

// Adjust animation speeds for mobile
const normalSpeed = (defaultAnimationSpeed / 100) * (isMobile ? 0.8 : 1),
fullSpeed = (morphAnimationSpeed / 100) * (isMobile ? 0.8 : 1);

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

// Check if device can handle the animation
let canAnimate = true;
try {
    // Test WebGL capabilities
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
        canAnimate = false;
        showWebGLError();
    }
} catch (e) {
    canAnimate = false;
    showWebGLError();
}

if (canAnimate) {
    animate();
}

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
   currentShapeIndex = 0;
}

function toCube() {
   if (animationVars.isMorphing) return;
   handleTriggers(1);
   morphTo(cubeParticles);
   currentShapeIndex = 1;
}

function toRocket() {
   if (animationVars.isMorphing || !assetsLoaded.rocket) return;
   handleTriggers(2);
   morphTo(rocketParticles);
   currentShapeIndex = 2;
}

function toSpaceman() {
   if (animationVars.isMorphing || !assetsLoaded.spaceman) return;
   handleTriggers(3);
   morphTo(spacemanParticles);
   currentShapeIndex = 3;
}

// Function to cycle to the next shape
function cycleToNextShape() {
    if (animationVars.isMorphing) return;
    
    currentShapeIndex = (currentShapeIndex + 1) % 4;
    
    // Check if the shape is loaded before cycling to it
    switch(currentShapeIndex) {
        case 0:
            if (assetsLoaded.sphere) toSphere();
            else cycleToNextShape(); // Skip to next if not loaded
            break;
        case 1:
            if (assetsLoaded.cube) toCube();
            else cycleToNextShape();
            break;
        case 2:
            if (assetsLoaded.rocket) toRocket();
            else cycleToNextShape();
            break;
        case 3:
            if (assetsLoaded.spaceman) toSpaceman();
            else cycleToNextShape();
            break;
    }
}

function morphTo(newParticles, color = '0xffffff') {
    animationVars.isMorphing = true;
    
    // Shorter animation on mobile
    const morphDuration = isMobile ? 3 : 4;
    
    TweenMax.to(animationVars, 0.3, {
        ease: Power4.easeIn,
        speed: fullSpeed,
        onComplete: function() {
            animationVars.isMorphing = false;
        }
    });
    
    particleSystem.material.color.setHex(color);

    // Create tweens for all particles with staggered delays for better effect
    const stagger = isMobile ? 0.3 : 0.5;
    const baseDuration = morphDuration;
    
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

// Check if all assets are loaded and start auto-cycle
function checkAllAssetsAndStartCycle() {
    const allLoaded = Object.values(assetsLoaded).every(v => v);
    if (allLoaded && isAutoCycling) {
        startAutoCycle();
    }
}

// Start auto-cycling through shapes
function startAutoCycle() {
    if (autoCycleInterval) {
        clearInterval(autoCycleInterval);
    }
    
    autoCycleInterval = setInterval(function() {
        cycleToNextShape();
    }, cycleTime);
    
    // Update UI to show auto-cycle is active
    document.getElementById('auto-cycle-status').innerHTML = 'Auto-cycle: ON';
    document.getElementById('toggle-cycle').innerHTML = 'Stop Auto-Cycle';
}

// Stop auto-cycling
function stopAutoCycle() {
    if (autoCycleInterval) {
        clearInterval(autoCycleInterval);
        autoCycleInterval = null;
    }
    
    // Update UI to show auto-cycle is off
    document.getElementById('auto-cycle-status').innerHTML = 'Auto-cycle: OFF';
    document.getElementById('toggle-cycle').innerHTML = 'Start Auto-Cycle';
}

// Toggle auto-cycle on/off
function toggleAutoCycle() {
    isAutoCycling = !isAutoCycling;
    
    if (isAutoCycling) {
        startAutoCycle();
    } else {
        stopAutoCycle();
    }
    
    // Vibrate on mobile if available
    if (navigator.vibrate && isMobile) {
        navigator.vibrate(50);
    }
}

// Event listeners with loading checks
triggers[0].addEventListener('click', function() {
    toSphere();
    handleUserInteraction();
});

triggers[1].addEventListener('click', function() {
    toCube();
    handleUserInteraction();
});

triggers[2].addEventListener('click', function() {
    if (assetsLoaded.rocket) {
        toRocket();
        handleUserInteraction();
    }
});

triggers[3].addEventListener('click', function() {
    if (assetsLoaded.spaceman) {
        toSpaceman();
        handleUserInteraction();
    }
});

// Handle user interaction with auto-cycle
function handleUserInteraction() {
    // Vibrate on mobile if available
    if (navigator.vibrate && isMobile) {
        navigator.vibrate(30);
    }
    
    // When user manually clicks, reset the cycle timer
    if (autoCycleInterval) {
        clearInterval(autoCycleInterval);
        autoCycleInterval = setTimeout(function() {
            if (isAutoCycling) startAutoCycle();
        }, cycleTime);
    }
}

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

// Update loading progress
function updateLoadingProgress(assetName, progress) {
    if (loadingStatus) {
        const loadedCount = Object.values(assetsLoaded).filter(v => v).length;
        const totalCount = Object.keys(assetsLoaded).length;
        const percentage = Math.round((loadedCount / totalCount) * 100);
        loadingStatus.innerHTML = `Loading: ${percentage}%`;
    }
}

// Create enhanced UI with auto-cycle controls
function createEnhancedUI() {
    // Remove existing instructions if any
    const existingInstructions = document.querySelector('#instructions');
    if (existingInstructions) {
        existingInstructions.remove();
    }
    
    // Create main control panel
    const controlPanel = document.createElement('div');
    controlPanel.id = 'control-panel';
    controlPanel.style.position = 'fixed';
    controlPanel.style.top = '10px';
    controlPanel.style.left = '10px';
    controlPanel.style.color = 'white';
    controlPanel.style.fontSize = isMobile ? '11px' : '12px';
    controlPanel.style.fontFamily = 'Arial, sans-serif';
    controlPanel.style.zIndex = '1000';
    controlPanel.style.background = 'rgba(0,0,0,0.7)';
    controlPanel.style.padding = isMobile ? '8px' : '10px';
    controlPanel.style.borderRadius = '5px';
    controlPanel.style.maxWidth = isMobile ? '200px' : '250px';
    
    // Add title
    const title = document.createElement('div');
    title.innerHTML = '<strong>Particle Morph</strong>';
    title.style.marginBottom = '8px';
    title.style.fontSize = isMobile ? '12px' : '14px';
    controlPanel.appendChild(title);
    
    // Add instructions
    const instructions = document.createElement('div');
    instructions.innerHTML = isMobile 
        ? '• Tap shapes below<br>• Drag to rotate<br>• Pinch to zoom' 
        : '• Click shapes below<br>• Drag to rotate camera<br>• Scroll to zoom';
    instructions.style.marginBottom = '10px';
    instructions.style.paddingBottom = '10px';
    instructions.style.borderBottom = '1px solid rgba(255,255,255,0.2)';
    controlPanel.appendChild(instructions);
    
    // Add auto-cycle status
    const autoCycleStatus = document.createElement('div');
    autoCycleStatus.id = 'auto-cycle-status';
    autoCycleStatus.innerHTML = 'Auto-cycle: Loading...';
    autoCycleStatus.style.marginBottom = '8px';
    controlPanel.appendChild(autoCycleStatus);
    
    // Add toggle button
    const toggleButton = document.createElement('button');
    toggleButton.id = 'toggle-cycle';
    toggleButton.innerHTML = 'Start Auto-Cycle';
    toggleButton.style.background = '#ff0000';
    toggleButton.style.color = 'white';
    toggleButton.style.border = 'none';
    toggleButton.style.padding = isMobile ? '4px 8px' : '5px 10px';
    toggleButton.style.borderRadius = '3px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.fontSize = isMobile ? '10px' : '11px';
    toggleButton.style.width = '100%';
    toggleButton.addEventListener('click', toggleAutoCycle);
    
    // Add touch feedback for mobile
    toggleButton.addEventListener('touchstart', function() {
        this.style.transform = 'scale(0.95)';
    });
    
    toggleButton.addEventListener('touchend', function() {
        this.style.transform = 'scale(1)';
    });
    
    controlPanel.appendChild(toggleButton);
    
    // Hide control panel on very small screens
    if (windowWidth < 480) {
        const hideButton = document.createElement('button');
        hideButton.innerHTML = 'Hide';
        hideButton.style.background = 'transparent';
        hideButton.style.color = '#ff0000';
        hideButton.style.border = '1px solid #ff0000';
        hideButton.style.padding = '3px 6px';
        hideButton.style.borderRadius = '3px';
        hideButton.style.cursor = 'pointer';
        hideButton.style.fontSize = '9px';
        hideButton.style.marginTop = '5px';
        hideButton.style.width = '100%';
        hideButton.addEventListener('click', function() {
            controlPanel.style.display = 'none';
            // Show a small toggle to bring it back
            showControlPanelToggle();
        });
        controlPanel.appendChild(hideButton);
    }
    
    document.body.appendChild(controlPanel);
    
    // Create loading status
    loadingStatus = document.createElement('div');
    loadingStatus.id = 'loading-status';
    loadingStatus.style.position = 'fixed';
    loadingStatus.style.top = isMobile ? '5px' : '10px';
    loadingStatus.style.right = isMobile ? '5px' : '10px';
    loadingStatus.style.color = 'white';
    loadingStatus.style.fontSize = isMobile ? '10px' : '12px';
    loadingStatus.style.fontFamily = 'Arial, sans-serif';
    loadingStatus.style.zIndex = '1000';
    loadingStatus.style.background = 'rgba(0,0,0,0.7)';
    loadingStatus.style.padding = isMobile ? '4px 8px' : '5px 10px';
    loadingStatus.style.borderRadius = '3px';
    loadingStatus.innerHTML = 'Loading...';
    document.body.appendChild(loadingStatus);
    
    // Update loading status
    const loadingInterval = setInterval(function() {
        const loadedCount = Object.values(assetsLoaded).filter(v => v).length;
        const totalCount = Object.keys(assetsLoaded).length;
        const percentage = Math.round((loadedCount / totalCount) * 100);
        
        if (loadedCount === totalCount) {
            loadingStatus.innerHTML = 'Ready!';
            clearInterval(loadingInterval);
            setTimeout(function() {
                loadingStatus.style.opacity = '0';
                loadingStatus.style.transition = 'opacity 1s';
                setTimeout(function() {
                    loadingStatus.style.display = 'none';
                }, 1000);
            }, 2000);
        } else {
            loadingStatus.innerHTML = `Loading: ${percentage}%`;
        }
    }, 100);
}

// Show control panel toggle when hidden
function showControlPanelToggle() {
    const toggle = document.createElement('div');
    toggle.id = 'show-controls';
    toggle.innerHTML = '☰';
    toggle.style.position = 'fixed';
    toggle.style.top = '5px';
    toggle.style.left = '5px';
    toggle.style.color = 'white';
    toggle.style.background = 'rgba(0,0,0,0.7)';
    toggle.style.padding = '5px 8px';
    toggle.style.borderRadius = '3px';
    toggle.style.cursor = 'pointer';
    toggle.style.zIndex = '1001';
    toggle.style.fontSize = '14px';
    
    toggle.addEventListener('click', function() {
        document.getElementById('control-panel').style.display = 'block';
        this.style.display = 'none';
    });
    
    document.body.appendChild(toggle);
}

// Show WebGL error message
function showWebGLError() {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '50%';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translate(-50%, -50%)';
    errorDiv.style.color = 'white';
    errorDiv.style.background = 'rgba(255, 0, 0, 0.8)';
    errorDiv.style.padding = '20px';
    errorDiv.style.borderRadius = '10px';
    errorDiv.style.textAlign = 'center';
    errorDiv.style.zIndex = '10000';
    errorDiv.innerHTML = '<h3>WebGL Not Supported</h3><p>Your device/browser does not support WebGL.<br>Try updating your browser or using a different device.</p>';
    document.body.appendChild(errorDiv);
}

// Initialize enhanced UI
createEnhancedUI();

// Add click/touch effects to triggers
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
    
    // Touch feedback for mobile
    trigger.addEventListener('touchstart', function() {
        if (this.getAttribute('data-disabled') === 'true') return;
        this.style.transform = 'scale(0.95)';
    });
    
    trigger.addEventListener('touchend', function() {
        this.style.transform = 'scale(1)';
    });
});

// Handle back button on mobile to prevent accidental exit
if (isMobile) {
    window.addEventListener('beforeunload', function(e) {
        // Optional: Add confirmation on mobile
        // e.preventDefault();
        // e.returnValue = '';
    });
}