(() => {
  const container = document.getElementById('container');
  const infoPanel = document.getElementById('infoPanel');
  const buttonsPanel = document.getElementById('buttonsPanel');
  const buttons = buttonsPanel.querySelectorAll('.btnIsland');

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000);
  container.appendChild(renderer.domElement);

  // Scene and Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(0, 3, 8); // mais perto para clareza

  // Controls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.minDistance = 5;
  controls.maxDistance = 30;
  controls.maxPolarAngle = Math.PI / 2.2;

  // Lights — intensidade aumentada
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9); // claridade forte
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // reforçada
  directionalLight.position.set(5, 15, 10);
  scene.add(directionalLight);

  const redLight = new THREE.PointLight(0xff0033, 1.0, 30);
  redLight.position.set(-10, 7, -10);
  scene.add(redLight);

  // Loader
  const loader = new THREE.GLTFLoader();

  // Ilha Casamento
  const ilhasData = [
    {
      name: 'Casamento',
      path: 'assets/ilhas/camera_lens.glb',
      position: new THREE.Vector3(0, 1, 0), // elevando para visibilidade
      scale: 3, // maior para não sumir
    },
  ];

  const ilhas = [];
  let INTERSECTED = null;

  ilhasData.forEach(({name, path, position, scale}) => {
    loader.load(path, (gltf) => {
      const model = gltf.scene;
      model.name = name;
      model.position.copy(position);
      model.scale.set(scale, scale, scale);
      scene.add(model);
      ilhas.push(model);
    }, undefined, err => console.error('Erro carregando modelo:', err));
  });

  // Raycaster e mouse
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  }

  window.addEventListener('mousemove', onMouseMove);

  // Loop animação
  function animate() {
    requestAnimationFrame(animate);
    controls.update();

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(ilhas, true);

    if(intersects.length > 0){
      if(INTERSECTED !== intersects[0].object){
        INTERSECTED = intersects[0].object;
        let root = INTERSECTED;
        while(root.parent && root.parent.type !== "Scene"){
          root = root.parent;
        }
        infoPanel.textContent = `Ilha: ${root.name}`;
        infoPanel.classList.add('visible');
      }
    } else {
      INTERSECTED = null;
      infoPanel.classList.remove('visible');
    }

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Transição suave da câmera
  function moveCameraTo(position, lookAt, duration = 1500){
    let isAnimating = true;

    const fromPos = camera.position.clone();
    const fromLook = controls.target.clone();

    let startTime = null;

    return new Promise(resolve => {
      function animateCam(time){
        if(!startTime) startTime = time;
        const elapsed = time - startTime;
        const t = Math.min(elapsed/duration, 1);

        camera.position.lerpVectors(fromPos, position, t);
        controls.target.lerpVectors(fromLook, lookAt, t);
        controls.update();

        if(t < 1){
          requestAnimationFrame(animateCam);
        } else {
          isAnimating = false;
          resolve();
        }
      }
      animateCam();
    });
  }

  // Botão Casamento
  const btnCasamento = buttonsPanel.querySelector('[data-target="Casamento"]');
  btnCasamento.addEventListener('click', () => {
    const ilha = ilhas.find(i => i.name === 'Casamento');
    if(ilha){
      const pos = ilha.position.clone().add(new THREE.Vector3(0, 2, 5));
      moveCameraTo(pos, ilha.position);
    }
  });

})();
