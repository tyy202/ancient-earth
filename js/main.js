(function () {
  var webglEl = document.getElementById('webgl');

  if (!Detector.webgl) {
    document.getElementById('loading').style.display = 'none';
    Detector.addGetWebGLMessage(webglEl);
    return;
  }

  var width = webglEl.clientWidth,
    height = webglEl.clientHeight;
  var mobileLayout = window.matchMedia('(max-width: 767px), (max-width: 1024px) and (pointer: coarse)');

  // UI elements
  var yearsago = document.getElementById('years-ago');

  // Earth params
  var radius = 0.5,
    segments = 32,
    rotation = 11;

  var sphereGeometry = new THREE.SphereGeometry(radius, segments, segments);

  var noRotation = false;
  var simulationClicked = false;
	webglEl.addEventListener( 'mousedown', function() {
    simulationClicked = true;
  }, false);

  var scene = new THREE.Scene();

  var camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
  camera.position.z = mobileLayout.matches ? 2.2 : 4;

  var renderer = new THREE.WebGLRenderer();
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', '互动地球：拖动旋转，缩放查看，左右方向键切换年代');
  renderer.domElement.addEventListener('mousedown', function() {
    // OrbitControls prevents the default mouse action, so focus explicitly.
    renderer.domElement.focus();
  });
  renderer.setSize(width, height);

  //scene.add(new THREE.AmbientLight(0x333333));
  scene.add(new THREE.AmbientLight(0x666666));

  var light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5,3,5);
  scene.add(light);

  var sphere;
  var loadedCount = 0;
  var DEFAULT_YEAR = 600;
  var startingYear = DEFAULT_YEAR;
  if (window.location.hash) {
    startingYear = parseInt(window.location.hash.slice(1));
  }
  if (!Object.prototype.hasOwnProperty.call(EXPLAIN_MAP, startingYear)) {
    startingYear = DEFAULT_YEAR;
  }
  yearsago.value = String(startingYear);
  updateSelectWithValue(startingYear);
  onYearsAgoChanged();

  var clouds = createClouds(radius, segments);
  clouds.rotation.y = rotation;
  scene.add(clouds)

  var stars = createStars(90, 64);
  scene.add(stars);

  var controls = new THREE.OrbitControls(camera, webglEl);
  controls.minDistance = 1;
  controls.maxDistance = 20;
  controls.noKeys = true;
  controls.rotateSpeed = 1.4;
  controls.addEventListener('start', function() {
    simulationClicked = true;
  });
  function updateInteractionMode() {
    controls.noPan = mobileLayout.matches;
    controls.rotateSpeed = mobileLayout.matches ? 0.8 : 1.4;
  }
  updateInteractionMode();
  mobileLayout.addListener(updateInteractionMode);

  THREEx.WindowResize(renderer, camera, webglEl);

  webglEl.appendChild(renderer.domElement);

  setupSelect();
  setupControls();

  render();

  setTimeout(function() {
    preloadTextures();
  }, 3000);

  function render() {
    controls.update();

    if (!noRotation) {
      if (simulationClicked) {
        sphere.rotation.y += 0.0005;
        clouds.rotation.y += 0.0005;
      } else {
        sphere.rotation.y += 0.001;
        clouds.rotation.y += 0.001;
      }
    }

    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }

  function preloadTextures() {
    for (key in EXPLAIN_MAP) {
      var i = new Image()
      i.src = imagePathForYearsAgo(key);
    }
  }

  function updateSelectWithValue(howmany) {
    document.getElementById('how-long-ago').textContent = yearsago.options[yearsago.selectedIndex].text;
    document.getElementById('explanation').innerHTML = EXPLAIN_MAP[parseInt(howmany)];
    document.getElementById('explanation').scrollTop = 0;
  }

  function onYearsAgoChanged() {
    var howmany = parseInt(yearsago.value);
    if (sphere) {
      scene.remove(sphere);
      // Each era owns a material and texture; release them on phones as well as desktop.
      sphere.material.map.dispose();
      sphere.material.dispose();
    }
    var img = imagePathForYearsAgo(howmany);
    sphere = createSphere(radius, segments, img);
    sphere.rotation.y = rotation;
    scene.add(sphere);

    updateSelectWithValue(howmany);
    window.location.replace('#' + howmany);
  }

  function setupSelect() {
    yearsago.onchange = onYearsAgoChanged;

    var t = -1;
    document.addEventListener('keydown', function(e) {
      if (/^(SELECT|INPUT|TEXTAREA|BUTTON)$/.test(e.target.tagName)) return;
      var now = new Date().getTime();
      if (now - t > 150) {
        // Left and right keys are 37 and 39 respectively, they step through the
        // select.
        var select = document.getElementById('years-ago');
        if (e.keyCode == 37 || e.keyCode == 75) {
          select.selectedIndex = Math.max(select.selectedIndex - 1, 0);
          onYearsAgoChanged();
        } else if (e.keyCode == 39 || e.keyCode == 74) {
          select.selectedIndex =
            Math.min(select.selectedIndex + 1, select.length - 1);
          onYearsAgoChanged();
        }
        t = now;
      }
    }, false);

    var jumpToElt = document.getElementById('jump-to');
    jumpToElt.onchange = function(e) {
      yearsago.value = jumpToElt.value;
      onYearsAgoChanged();
    };
  }

  function imagePathForYearsAgo(years) {
    return years == 0 ? 'images/scrape/000present.jpg' : 'images/scrape/'
        + ((years+'').length < 3 ? '0' + years : years) + 'Marect.jpg';
  }

  function createSphere(radius, segments, img) {
    var map = THREE.ImageUtils.loadTexture(img, undefined, function() {
      if (++loadedCount >= 2) {
        document.getElementById('loading').style.display = 'none';
      }
    });
    map.minFilter = THREE.LinearFilter;
    var mesh = new THREE.Mesh(
      sphereGeometry,
      new THREE.MeshPhongMaterial({
        map:         map,
        "color": 0xbbbbbb, "specular": 0x111111, "shininess": 1,
        bumpMap:     map,
        bumpScale:   0.02,
        specularMap: map,
        //specular:    new THREE.Color('grey')
        /*
        bumpMap:     THREE.ImageUtils.loadTexture('images/elev_bump_4k.jpg'),
        bumpScale:   0.005,
        specularMap: THREE.ImageUtils.loadTexture('images/water_4k.png'),
        specular:    new THREE.Color('grey')
        */
      })
    );
    return mesh;
  }

  function setupControls() {
    var cloudsHidden = false;
    var removeCloudsElt = document.getElementById('remove-clouds');
    removeCloudsElt.onclick = function() {
      cloudsHidden = !cloudsHidden;
      clouds.visible = !cloudsHidden;
      removeCloudsElt.textContent = cloudsHidden ? '显示云层' : '隐藏云层';
      removeCloudsElt.setAttribute('aria-pressed', String(cloudsHidden));
    };
    var stopRotationElt = document.getElementById('stop-rotation');
    stopRotationElt.onclick = function() {
      noRotation = !noRotation;
      stopRotationElt.textContent = noRotation ? '恢复自转' : '停止自转';
      stopRotationElt.setAttribute('aria-pressed', String(noRotation));
    };
    var explanationToggle = document.getElementById('explanation-toggle');
    explanationToggle.onclick = function() {
      var expanded = explanationToggle.getAttribute('aria-expanded') !== 'true';
      document.getElementById('info-panel').classList.toggle('is-expanded', expanded);
      explanationToggle.setAttribute('aria-expanded', String(expanded));
      explanationToggle.textContent = expanded ? '收起说明' : '展开说明';
    };
  }

  function createClouds(radius, segments) {
    var map = THREE.ImageUtils.loadTexture('images/fair_clouds_4k.png', undefined, function() {
      if (++loadedCount >= 2) {
        document.getElementById('loading').style.display = 'none';
      }
    });
    return new THREE.Mesh(
      new THREE.SphereGeometry(radius + 0.003, segments, segments),
      new THREE.MeshPhongMaterial({
        map:         map,
        transparent: true,
        opacity: 1.0,
      })
    );
  }

  function createStars(radius, segments) {
    return new THREE.Mesh(
      new THREE.SphereGeometry(radius, segments, segments),
      new THREE.MeshBasicMaterial({
        map:  THREE.ImageUtils.loadTexture('images/galaxy_starfield.png'),
        side: THREE.BackSide
      })
    );
  }
}());
