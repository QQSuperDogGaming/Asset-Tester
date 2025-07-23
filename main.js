let game, isMobile = false, joystickVector = { x: 0, y: 0 }, selectedDevice = null;

window.onload = () => {
  document.getElementById('deviceModal').style.display = 'flex';
};

function selectDevice(type) {
  isMobile = type === 'mobile';
  selectedDevice = type;
  document.getElementById('deviceModal').style.display = 'none';
}

const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');

uploadBtn.addEventListener('click', () => {
  if (!selectedDevice) return alert('Please select a device first!');
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;

  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    document.getElementById('frameWidth').value = img.width;
    document.getElementById('frameHeight').value = img.height;
    URL.revokeObjectURL(url);
    loadSpriteFromFile(file);
  };
  img.src = url;
});

function loadSpriteFromFile(file) {
  const frameWidth = parseInt(document.getElementById('frameWidth').value, 10);
  const frameHeight = parseInt(document.getElementById('frameHeight').value, 10);
  const fps = parseInt(document.getElementById('fpsInput').value, 10) || 10;

  const reader = new FileReader();

  reader.onprogress = e => {
    if (e.lengthComputable) {
      const percent = (e.loaded / e.total) * 100;
      document.getElementById('progressBarContainer').style.display = 'block';
      document.getElementById('progressBar').style.width = percent + '%';
    }
  };

  reader.onload = function (e) {
    document.getElementById('progressBar').style.width = '100%';
    document.getElementById('uploadStatus').textContent = '✅ Upload Completed';

    if (game) game.destroy(true);
    document.getElementById('mobileControls').style.display = isMobile ? 'flex' : 'none';

    game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 800,
      height: 500,
      backgroundColor: '#1d1d1d',
      parent: 'gameContainer',
      physics: { default: 'arcade', arcade: { debug: false } },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: { preload, create, update }
    });

    function preload() {
      this.load.spritesheet('sprite', e.target.result, { frameWidth, frameHeight });
    }

    function create() {
      const totalFrames = this.textures.get('sprite').frameTotal;
      this.anims.create({
        key: 'autoAnim',
        frames: this.anims.generateFrameNumbers('sprite', { start: 0, end: totalFrames - 1 }),
        frameRate: fps,
        repeat: -1
      });
      const player = this.physics.add.sprite(400, 250, 'sprite');
      player.play('autoAnim');
      player.setScale(Math.min(100 / frameHeight, 2));
      document.getElementById('importStatus').textContent = '✅ Sprite imported successfully!';

      this.player = player;
      this.cursors = this.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' });
    }

    function update() {
      const speed = 200;
      this.player.setVelocity(0);

      if (!isMobile) {
        const c = this.cursors;
        if (c.left.isDown) this.player.setVelocityX(-speed);
        if (c.right.isDown) this.player.setVelocityX(speed);
        if (c.up.isDown) this.player.setVelocityY(-speed);
        if (c.down.isDown) this.player.setVelocityY(speed);
      } else {
        this.player.setVelocityX(joystickVector.x * speed);
        this.player.setVelocityY(joystickVector.y * speed);
      }
    }
  };

  reader.readAsDataURL(file);
}
