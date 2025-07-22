let game;
let spriteTextureKey = 'userSprite';
let currentSprite;
let joystickVector = { x: 0, y: 0 };
let animSelect = document.getElementById('animSelect');
let animDefsInput = document.getElementById('animDefs');
let isMobile = false;

document.getElementById('uploadBtn').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

document.getElementById('darkModeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

document.getElementById('loadSprite').addEventListener('click', () => {
  const fileInput = document.getElementById('fileInput');
  const frameWidth = parseInt(document.getElementById('frameWidth').value, 10);
  const frameHeight = parseInt(document.getElementById('frameHeight').value, 10);
  const assetType = document.getElementById('assetType').value;
  const selectedDevice = document.getElementById('deviceType').value;

  isMobile = selectedDevice === 'auto'
    ? /Mobi|Android/i.test(navigator.userAgent)
    : selectedDevice === 'mobile';

  if (fileInput.files.length === 0) return alert('Please upload a sprite sheet');
  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onprogress = (e) => {
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
    if (isMobile) {
      document.getElementById('mobileControls').style.display = 'flex';
    } else {
      document.getElementById('mobileControls').style.display = 'none';
    }

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
      this.load.spritesheet(spriteTextureKey, e.target.result, {
        frameWidth,
        frameHeight
      });
    }

    function create() {
      const assetType = document.getElementById('assetType').value;

      // Parse animations like "walk:0-3, idle:4-7"
      function defineAnimations(scene) {
        const animDefs = animDefsInput.value.split(',');
        animSelect.innerHTML = '';
        animDefs.forEach(def => {
          const [name, range] = def.trim().split(':');
          const [start, end] = range.split('-').map(Number);
          if (!isNaN(start) && !isNaN(end)) {
            scene.anims.create({
              key: name,
              frames: scene.anims.generateFrameNumbers(spriteTextureKey, { start, end }),
              frameRate: 10,
              repeat: -1
            });
            const opt = document.createElement('option');
            opt.value = name;
            opt.innerText = name;
            animSelect.appendChild(opt);
          }
        });
      }

      if (assetType === 'character') {
        currentSprite = this.physics.add.sprite(300, 200, spriteTextureKey).setScale(2);
        defineAnimations(this);
        currentSprite.play(animSelect.value);
        this.bullets = this.physics.add.group();

        if (isMobile) {
          setupJoystick();
          document.getElementById('jumpBtn').addEventListener('touchstart', () => {
            joystickVector.y = -1;
          });
          document.getElementById('jumpBtn').addEventListener('touchend', () => {
            joystickVector.y = 0;
          });
        } else {
          this.cursors = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D'
          });
          this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        }
      }

      if (assetType === 'projectile') {
        defineAnimations(this);
        this.bullets = this.physics.add.group();
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      }

      if (assetType === 'effect') {
        defineAnimations(this);
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      }

      this.shootCooldown = 0;
    }

    function update(_, delta) {
      const assetType = document.getElementById('assetType').value;

      if (assetType === 'character') {
        currentSprite.setVelocity(0);
        const speed = 200;

        if (!isMobile) {
          const c = this.cursors;
          if (c.left.isDown) currentSprite.setVelocityX(-speed);
          if (c.right.isDown) currentSprite.setVelocityX(speed);
          if (c.up.isDown) currentSprite.setVelocityY(-speed);
          if (c.down.isDown) currentSprite.setVelocityY(speed);
          if (Phaser.Input.Keyboard.JustDown(this.fireKey) && this.shootCooldown <= 0) {
            const bullet = this.bullets.create(currentSprite.x, currentSprite.y, spriteTextureKey);
            bullet.play(animSelect.value);
            bullet.setVelocityX(300);
            this.shootCooldown = 300;
          }
        } else {
          currentSprite.setVelocityX(joystickVector.x * speed);
          currentSprite.setVelocityY(joystickVector.y * speed);
        }

        if (currentSprite.anims.currentAnim?.key !== animSelect.value) {
          currentSprite.play(animSelect.value);
        }
      }

      if (assetType === 'projectile') {
        if (Phaser.Input.Keyboard.JustDown(this.fireKey) && this.shootCooldown <= 0) {
          const proj = this.bullets.create(100, 200, spriteTextureKey).setScale(2);
          proj.play(animSelect.value);
          proj.setVelocityX(300);
          this.shootCooldown = 300;
        }
      }

      if (assetType === 'effect') {
        if (Phaser.Input.Keyboard.JustDown(this.fireKey)) {
          const fx = game.scene.scenes[0].add.sprite(
            Phaser.Math.Between(100, 500),
            Phaser.Math.Between(100, 300),
            spriteTextureKey
          ).setScale(2);
          fx.play(animSelect.value);
          fx.on('animationcomplete', () => fx.destroy());
        }
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
