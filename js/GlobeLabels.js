/* Lightweight DOM labels anchored to the existing Three.js sphere. */
(function () {
  window.GlobeLabels = function (container) {
    this.layer = document.createElement('div');
    this.layer.id = 'globe-labels';
    this.layer.setAttribute('aria-label', '大陆与大洋名称（位置示意）');
    container.appendChild(this.layer);
    this.items = [];
    this.showGeography = true;
    this.lifeGroup = 'none';
    this.point = new THREE.Vector3();
    this.normal = new THREE.Vector3();
    this.eye = new THREE.Vector3();
  };

  GlobeLabels.prototype.setAge = function (age) {
    this.age = age;
    this.refresh();
  };

  GlobeLabels.prototype.refresh = function () {
    this.layer.textContent = '';
    var fossils = this.lifeGroup === 'dinosaurs' && DINOSAUR_DATA[this.age];
    var labels = fossils ? fossils.labels.slice() : [];
    if (this.showGeography) labels = labels.concat(GEOGRAPHY_LABELS[this.age] || []);
    this.layer.hidden = !this.showGeography && this.lifeGroup === 'none';
    this.layer.setAttribute('aria-label', this.lifeGroup === 'dinosaurs' ? '地名与恐龙化石发现区域（示意）' : '大陆与大洋名称（位置示意）');
    this.items = labels.map(function (label) {
      var element = document.createElement('span');
      element.className = 'globe-label globe-label--' + label.kind;
      element.textContent = label.name;
      element.style.visibility = 'hidden';
      this.layer.appendChild(element);
      var lat = label.lat * Math.PI / 180, lon = label.lon * Math.PI / 180;
      return {element: element, anchor: new THREE.Vector3(
        0.5 * Math.cos(lat) * Math.cos(lon), 0.5 * Math.sin(lat),
        -0.5 * Math.cos(lat) * Math.sin(lon)
      )};
    }, this);
  };

  GlobeLabels.prototype.update = function (sphere, camera) {
    if (this.layer.hidden) return;
    var width = this.layer.clientWidth, height = this.layer.clientHeight;
    var occupied = [], self = this;
    this.eye.setFromMatrixPosition(camera.matrixWorld);
    this.items.forEach(function (item) {
      var element = item.element;
      element.style.visibility = 'hidden';
      self.point.copy(item.anchor).applyMatrix4(sphere.matrixWorld);
      self.normal.copy(item.anchor).transformDirection(sphere.matrixWorld);
      // Perspective horizon: front-facing normals alone are insufficient near the limb.
      var facing = self.normal.dot(self.eye) - self.normal.dot(self.point);
      if (facing < self.eye.distanceTo(self.point) * 0.16) return;
      self.point.project(camera);
      if (self.point.z < -1 || self.point.z > 1) return;
      var x = (self.point.x + 1) * width / 2, y = (1 - self.point.y) * height / 2;
      var w = element.offsetWidth, h = element.offsetHeight;
      var box = {left:x-w/2-4, right:x+w/2+4, top:y-h/2-3, bottom:y+h/2+3};
      if (box.left < 0 || box.right > width || box.top < 0 || box.bottom > height) return;
      if (occupied.some(function (b) {
        return box.left < b.right && box.right > b.left && box.top < b.bottom && box.bottom > b.top;
      })) return;
      occupied.push(box);
      element.style.transform = 'translate(' + (x-w/2).toFixed(1) + 'px,' + (y-h/2).toFixed(1) + 'px)';
      element.style.visibility = 'visible';
    });
  };
}());
