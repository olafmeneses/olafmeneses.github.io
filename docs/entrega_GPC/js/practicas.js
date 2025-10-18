// Variables globales que van siempre
var renderer, scene, camera;
var cameraControls;
var angulo = -0.01;
var cameraTop; // cámara cenital para la miniatura

// interface gui
var controls = {
  giroBase: 0,
  giroEjeZ: 0,
  giroAntebrazoY: 0,
  giroAntebrazoZ: 0,
  rotPinzaZ: 0,
  separacionPinza: 10,
  alambres: false,
  anima: function() { animacion(); }
};

// 1-inicializa 
init();
// 2-Crea una escena
loadScene();
// 3-renderiza
render();

function init()
{
  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( new THREE.Color(0xFFFFFF) );
  document.getElementById('container').appendChild( renderer.domElement );

  scene = new THREE.Scene();

  var aspectRatio = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera( 50, aspectRatio , 0.1, 1000 );
  camera.position.set( 250, 400, 500 );

  cameraControls = new THREE.OrbitControls( camera, renderer.domElement );
  cameraControls.target.set( 0, 0, 0 );

  // Cámara cenital (miniatura),cuadrada, mirada desde arriba
  cameraTop = new THREE.PerspectiveCamera( 50, 1, 0.1, 1000 );
  cameraTop.position.set( 0, 400, 0 );
  cameraTop.lookAt( 0, 0, 0 );

  
  // interface de usuario
  gui = new  lil.GUI({title: 'Control Robot'});

  gui.add(controls, 'giroBase', -180, 180).name('Giro Base')
  gui.add(controls, 'giroEjeZ', -45, 45).name('Giro Brazo (eje Z)')
  gui.add(controls, 'giroAntebrazoY', -180, 180).name('Giro Antebrazo Y')
  gui.add(controls, 'giroAntebrazoZ', -90, 90).name('Giro Antebrazo Z')
  gui.add(controls, 'rotPinzaZ', -40, 220).name('Rot Pinza Z')
  gui.add(controls, 'separacionPinza', 0, 15).name('Separacion Pinza')
  gui.add(controls, 'alambres').name('alambres')
  gui.add(controls, 'anima').name('Anima');

  window.addEventListener('resize', updateAspectRatio );
}


function loadScene()
{
	// Añade el objeto grafico a la escena
  let material = new THREE.MeshNormalMaterial();

  robot = new THREE.Object3D();

  base = new THREE.Mesh(
    new THREE.CylinderGeometry(50,50,15,64),
    material
  );

  brazo = new THREE.Object3D();

  eje = new THREE.Mesh(
    new THREE.CylinderGeometry(20,20,18,32),
    material
  );
  eje.rotateOnAxis(new THREE.Vector3(1,0,0), -Math.PI/2);

  esparrago = new THREE.Mesh(
    new THREE.CylinderGeometry(18,12,120,32),
    material
  );

  rotula = new THREE.Mesh(
    new THREE.SphereGeometry(20,32,32),
    material
  );

  antebrazo = new THREE.Object3D();

  let disco = new THREE.Mesh(
    new THREE.CylinderGeometry(22,22,6,32),
    material
  );

  let nervio1 = new THREE.Mesh(
    new THREE.CylinderGeometry(4,4,80,32),
    material
  );
  let nervio2 = new THREE.Mesh(
    new THREE.CylinderGeometry(4,4,80,32),
    material
  );
  let nervio3 = new THREE.Mesh(
    new THREE.CylinderGeometry(4,4,80,32),
    material
  );
  let nervio4 = new THREE.Mesh(
    new THREE.CylinderGeometry(4,4,80,32),
    material
  );

  nervio1.position.set(8, 40, 8);
  nervio2.position.set(-8, 40, 8);
  nervio3.position.set(8, 40, -8);
  nervio4.position.set(-8, 40, -8);

  mano = new THREE.Mesh(
    new THREE.CylinderGeometry(15,15,40,32),
    material
  );
  mano.position.y = 80;
  mano.rotateOnAxis(new THREE.Vector3(1,0,0), -Math.PI/2);
  mano.rotateOnAxis(new THREE.Vector3(0,1,0), Math.PI/2);

  pinzalz = new THREE.Object3D();
  pinzaDe = new THREE.Object3D();

  function crear_geometria_dedo() {
    let geometry = new THREE.BufferGeometry();
    let vertices = [
      -10,-2,19,
       10,-2,19,
       10,2,19,
      -10,2,19,
       -6,-1,38,
        6,-1,38,
        6,1,38,
       -6,1,38
    ];
    let indices = [
      0,2,1,  0,3,2,
      0,1,5,  0,5,4,
      3,6,2,  3,7,6,
      0,4,7,  0,7,3,
      1,2,6,  1,6,5,
      4,5,6,  4,6,7
    ];
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    return geometry;
  }

  let geometria_dedo = crear_geometria_dedo();

  // Pinza Izquierda
  let baseIzq = new THREE.Mesh(
    new THREE.BoxGeometry(20, 4, 19),
    material
  );
  
  baseIzq.position.z = 19/2;
  let dedoIzq = new THREE.Mesh(
    geometria_dedo,
    material
  );
  pinzalz.add(baseIzq);
  pinzalz.add(dedoIzq);

  // Pinza Derecha
  let baseDer = new THREE.Mesh(
    new THREE.BoxGeometry(20, 4, 19),
    material
  );
  baseDer.position.z = 19/2;
  let dedoDer = new THREE.Mesh(
    geometria_dedo,
    material
  );
  pinzaDe.add(baseDer);
  pinzaDe.add(dedoDer);

  // Posicion de las pinzas
  pinzalz.position.set(-2,10,8);
  pinzaDe.position.set(-2,-10,8);

  // Posicionamiento de los componentes
  base.position.y = 7.5;
  eje.position.y = 7.5;
  esparrago.position.y = 60;
  rotula.position.y = 120;
  antebrazo.position.y = 120;
  disco.position.y = 3;

  robot.add(base);
  base.add(brazo);
  brazo.add(eje);
  brazo.add(esparrago);
  brazo.add(rotula);
  brazo.add(antebrazo);
  antebrazo.add(disco);
  antebrazo.add(nervio1);
  antebrazo.add(nervio2);
  antebrazo.add(nervio3);
  antebrazo.add(nervio4);
  antebrazo.add(mano);
  mano.add(pinzalz);
  mano.add(pinzaDe);

  // suelo
  let geometriaPiso = new THREE.PlaneGeometry(1000, 1000, 10, 10);
  let piso = new THREE.Mesh(geometriaPiso, new THREE.MeshBasicMaterial({ color: 0xAAAAAA }));
  piso.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI/2);

  // escena
  scene.add(robot);
  scene.add(piso);
}


function updateAspectRatio()
{
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Cámara miniatura: siempre cuadrada -> aspect = 1
  cameraTop.aspect = 1;
  cameraTop.updateProjectionMatrix();
}

function update()
{
  // Cambios para actualizar la camara segun mvto del raton
  cameraControls.update();

  // Aplicar transformaciones desde gui al robot
  if (base) base.rotation.y = THREE.MathUtils.degToRad(controls.giroBase);
  if (eje) eje.rotation.z = THREE.MathUtils.degToRad(controls.giroEjeZ);
  if (rotula) {
    antebrazo.rotation.y = THREE.MathUtils.degToRad(controls.giroAntebrazoY);
    antebrazo.rotation.z = THREE.MathUtils.degToRad(controls.giroAntebrazoZ);
  }
  if (mano) mano.rotation.z = THREE.MathUtils.degToRad(controls.rotPinzaZ);

  // Separacion de pinzas (mover objetos pinzalz y pinzaDe en Y)
  if (pinzalz && pinzaDe) {
    pinzalz.position.y = 3 + controls.separacionPinza;
    pinzaDe.position.y = -3 - controls.separacionPinza;
  }

  // Actualizar alambres
  robot.traverse(function(node){
    if (controls.alambres) {
      node.material.wireframe = true;
    }
    else {
      node.material = new THREE.MeshNormalMaterial();
    }
  });

  TWEEN.update();
}

// Teclado para mover el robot sobre el suelo
var units_mov = 5;
window.addEventListener('keydown', function(e){
  switch(e.key) {
    case 'ArrowUp':
      robot.position.x -= units_mov;
      robot.position.z -= units_mov;
      break;
    case 'ArrowDown':
      robot.position.x += units_mov;
      robot.position.z += units_mov;
      break;
    case 'ArrowLeft':
      robot.position.x -= units_mov;
      robot.position.z += units_mov;
      break;
    case 'ArrowRight':
      robot.position.x += units_mov;
      robot.position.z -= units_mov;
      break;
  }
});


// Animación: mueve la base y abre/cierra la pinza
function animacion() {
  // animar giro de base 0 -> 180 -> -180 -> 0
  var baseObj = { angle: controls.giroBase };
  var t1 = new TWEEN.Tween(baseObj).to({ angle: controls.giroBase + 180 }, 1500).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function(){ controls.giroBase = baseObj.angle; });
  var t2 = new TWEEN.Tween(baseObj).to({ angle: controls.giroBase - 360 }, 2500).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function(){ controls.giroBase = baseObj.angle; });
  var t3 = new TWEEN.Tween(baseObj).to({ angle: 0 }, 1500).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(function(){ controls.giroBase = baseObj.angle; });
  t1.chain(t2); t2.chain(t3);
  t1.start();

  // pinza open/close
  var p = { sep: controls.separacionPinza };
  var p1 = new TWEEN.Tween(p).to({ sep: 15 }, 1000).easing(TWEEN.Easing.Cubic.InOut).onUpdate(function(){ controls.separacionPinza = p.sep; });
  var p2 = new TWEEN.Tween(p).to({ sep: 0 }, 1000).easing(TWEEN.Easing.Cubic.InOut).onUpdate(function(){ controls.separacionPinza = p.sep; });
  var p3 = new TWEEN.Tween(p).to({ sep: 10 }, 1000).easing(TWEEN.Easing.Cubic.InOut).onUpdate(function(){ controls.separacionPinza = p.sep; });
  p1.chain(p2); p2.chain(p3);
  p1.start();
}

function render()
{
	requestAnimationFrame( render );
	update();
  // Restaurar viewport completo antes del render principal
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.render( scene, camera );

  // Render miniatura cenital en esquina superior izquierda
  // Tamaño = 1/4 de la dimensión menor de la ventana
  var size = Math.floor( Math.min(window.innerWidth, window.innerHeight) / 4 );
  var left = 0;
  // En WebGL el origen del viewport está en la esquina inferior izquierda
  var bottom = window.innerHeight - size;

  // Limitar el render a un rectángulo (scissor)
  renderer.setScissorTest(true);
  renderer.setScissor( left, bottom, size, size );
  renderer.setViewport( left, bottom, size, size );

  renderer.render( scene, cameraTop );
}
