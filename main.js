let game;
let spriteTextureKey = 'userSprite';

document.getElementById('uploadBtn').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

document.getElementById('loadSprite').addEventListener('click', () => {
  const fileInput = document.getElementById('fileInput');
  const frameWidth = parseInt(document.getElementById('frameWidth').value, 10);
  const frameHeight = parseInt(document.getElementById('frameHeight').value, 10);
  const assetType = document.getElementById('assetType').value;

  if (fileInput.files.length === 0) return alert('Please upload a sprite sheet');

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    if (game) game.destroy(true);

    const config = {
      type: Phaser.AUTO,
      width: 600,
      height: 400,
      backgroundColor: '#1d1d1d',
      parent: 'gameContainer',
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      },
      scene: {
        preload: preload,
        create: create,
        update: update
      }
    };

    let sprite, cursors, bullets, fireKey, shootCooldown = 0;

    game = new Phaser.Game(config);

    function preload() {
      this.load.spritesheet(spriteTextureKey, e.target.result, {
        frameWidth: frameWidth,
        frameHeight: frameHeight
      });
    }

    function create() {
      if (assetType === 'character') {
        this.anims.create({
          key: 'walk',
          frames: this.anims.generateFrameNumbers(spriteTextureKey),
          frameRate: 8,
          repeat: -1
        });

        sprite = this.physics.add.sprite(300, 200, spriteTextureKey).setScale(2);
        sprite.play('walk');

        cursors = this.input.keyboard.createCursorKeys();
        fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        bullets = this.physics.add.group();
      }

      if (assetType === 'projectile') {
        this.anims.create({
          key: 'fly',
          frames: this.anims.generateFrameNumbers(spriteTextureKey),
          frameRate: 12,
          repeat: -1
        });

        bullets = this.physics.add.group();
        fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      }

      if (assetType === 'effect') {
        this.anims.create({
          key: 'explode',
          frames: this.anims.generateFrameNumbers(spriteTextureKey),
          frameRate: 12,
          repeat: 0
        });

        fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      }
    }

    function update(time, delta) {
      if (assetType === 'character') {
        const speed = 200;
        sprite.setVelocity(0);

        if (cursors.left.isDown) sprite.setVelocityX(-speed);
        if (cursors.right.isDown) sprite.setVelocityX(speed);
        if (cursors.up.isDown) sprite.setVelocityY(-speed);
        if (cursors.down.isDown) sprite.setVelocityY(speed);

        if (Phaser.Input.Keyboard.JustDown(fireKey) && shootCooldown <= 0) {
          const bullet = bullets.create(sprite.x, sprite.y, spriteTextureKey).setScale(1);
          bullet.play('walk');
          bullet.setVelocityX(300);
          shootCooldown = 300;
        }
      }

      if (assetType === 'projectile') {
        if (Phaser.Input.Keyboard.JustDown(fireKey) && shootCooldown <= 0) {
          const proj = bullets.create(100, 200, spriteTextureKey).setScale(2);
          proj.play('fly');
          proj.setVelocityX(300);
          shootCooldown = 300;
        }
      }

      if (assetType === 'effect') {
        if (Phaser.Input.Keyboard.JustDown(fireKey)) {
          const fx = game.scene.scenes[0].add.sprite(
            Phaser.Math.Between(100, 500),
            Phaser.Math.Between(100, 300),
            spriteTextureKey
          ).setScale(2);
          fx.play('explode');
          fx.on('animationcomplete', () => fx.destroy());
        }
      }

      if (shootCooldown > 0) shootCooldown -= delta;
    }
  };

  reader.readAsDataURL(file);
});
