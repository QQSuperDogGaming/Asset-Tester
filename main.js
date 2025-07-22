let game;
let isMobile = false;
let joystickVector = { x: 0, y: 0 };

document.getElementById('uploadBtn').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

document.getElementById('loadSprite').addEventListener('click', () => {
  const fileInput = document.getElementById('fileInput');
  const frameWidth = parseInt(document.getElementById('frameWidth').value, 10);
  const frameHeight = parseInt(document.getElementById('frameHeight').value, 10);
  isMobile = document.getElementById('deviceType').value === 'mobile';

  if (fileInput.files.length === 0) return alert('Please upload a sprite sheet');
  const file = fileInput.files[0];
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
    if (isMobile) document.getElementById('mobileControls').style.display = 'flex';
    else document.getElementById('mobileControls').style.display = 'none';

    game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 600,
      height: 400,
      backgroundColor: '#1d1d1d',
      parent: 'gameContainer',
      physics: {
        default: 'arcade',
        arcade: { debug: false }
      },
      scene: { preload, create, update }
    });

    function preload() {
      this.load.spritesheet('sprite', e.target.result, {
        frameWidth,
        frameHeight
      });
    }

    function create() {
      const animKey = 'defaultAnim';
      const totalFrames = Math.floor(this.textures.get('sprite').frameTotal);

      this.anims.create({
        key: animKey,
        frames: this.anims.generateFrameNumbers('sprite', {
          start: 0,
          end: totalFrames - 1
        }),
        frameRate: 10,
        repeat: -1
      });

      const player = this.physics.add.sprite(300, 200, 'sprite');
      player.play(animKey);

      // Auto scale to fit height if needed
      const scale = Math.min(100 / frameHeight, 2);
      player.setScale(scale);

      this.player = player;
      this.bullets = this.physics.add.group();
      this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

      if (!isMobile) {
        this.cursors = this.input.keyboard.addKeys({
          up: 'W',
          down: 'S',
          left: 'A',
          right: 'D'
        });
      } else {
        setupJoystick();
        document.getElementById('jumpBtn').addEventListener('touchstart', () => {
          joystickVector.y = -1;
        });
        document.getElementById('jumpBtn').addEventListener('touchend', () => {
          joystickVector.y = 0;
        });
      }

      this.shootCooldown = 0;
    }

    function update(_, delta) {
      const speed = 200;
      this.player.setVelocity(0);

      if (!isMobile) {
        const c = this.cursors;
        if (c.left.isDown) this.player.setVelocityX(-speed);
        if (c.right.isDown) this.player.setVelocityX(speed);
        if (c.up.isDown) this.player.setVelocityY(-speed);
        if (c.down.isDown) this.player.setVelocityY(speed);
        if (Phaser.Input.Keyboard.JustDown(this.fireKey) && this.shootCooldown <= 0) {
          const bullet = this.bullets.create(this.player.x, this.player.y, 'sprite');
          bullet.play('defaultAnim');
          bullet.setVelocityX(300);
          this.shootCooldown = 300;
        }
      } else {
        this.player.setVelocityX(joystickVector.x * speed);
        this.player.setVelocityY(joystickVector.y * speed);
      }

      if (this.shootCooldown > 0) this.shootCooldown -= delta;
    }

    function setupJoystick() {
      const joystick = document.getElementById('joystick');
      let origin = null;
      joystick.addEventListener('touchstart', e => origin = e.touches[0]);
      joystick.addEventListener('touchmove', e => {
        if (!origin) return;
        const dx = e.touches[0].clientX - origin.clientX;
        const dy = e.touches[0].clientY - origin.clientY;
        joystickVector.x = Math.max(-1, Math.min(1, dx / 40));
        joystickVector.y = Math.max(-1, Math.min(1, dy / 40));
      });
      joystick.addEventListener('touchend', () => joystickVector = { x: 0, y: 0 });
    }
  };

  reader.readAsDataURL(file);
});
