window.onload = function() {
    // You might want to start with a template that uses GameStates:
    //     https://github.com/photonstorm/phaser/tree/master/resources/Project%20Templates/Basic
    
    // You can copy-and-paste the code from any of the examples at http://examples.phaser.io here.
    // You will need to change the fourth parameter to "new Phaser.Game()" from
    // 'phaser-example' to 'game', which is the id of the HTML element where we
    // want the game to go.
    // The assets (and code) can be found at: https://github.com/photonstorm/phaser/tree/master/examples/assets
    // You will need to change the paths you pass to "game.load.image()" or any other
    // loading functions to reflect where you are putting the assets.
    // All loading functions will typically all be found inside "preload()".
    
    "use strict";
    
    var game = new Phaser.Game( 800, 600, Phaser.AUTO, 'game', { preload: preload, create: create, update: update } );
    
    function preload() {
        // Load all images.
        game.load.image('laser', 'assets/laser.png');
        game.load.image('enemyBullet', 'assets/enemy_bullet.png');
        game.load.image('enemy', 'assets/enemy.png');
        game.load.image('ship', 'assets/ship.png');
        game.load.spritesheet('boom', 'assets/explosion.png', 48, 48);
        game.load.image('space', 'assets/space.png');
    }
    
    var player;
    var aliens;
    var bullets;
    var bulletTime = 0;
    var cursors;
    var fireButton;
    var explosions;
    var space;
    var score = 0;
    var scoreString = 'Score : ';
    var scoreText;
    var lives;
    var enemyBullets;
    var firingTimer = 0;
    var stateText;
    var livingEnemies = [];
    
    function create() {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        space = game.add.tileSprite(0, 0, 800, 600, 'space');

        //game.setBounds(0, 0, 800, 600);

        //  Our bullet group
        bullets = game.add.group();
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.ARCADE;
        bullets.createMultiple(30, 'laser');
        bullets.setAll('anchor.x', 0.5);
        bullets.setAll('anchor.y', 1);
        bullets.setAll('bulletOOB', true);
        bullets.setAll('checkWorldBounds', true);

        // The enemy's bullets
        enemyBullets = game.add.group();
        enemyBullets.enableBody = true;
        enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
        enemyBullets.createMultiple(30, 'enemyBullet');
        enemyBullets.setAll('anchor.x', 0.5);
        enemyBullets.setAll('anchor.y', 0.5);
        enemyBullets.setAll('enemyBulletOOB', true);
        enemyBullets.setAll('checkWorldBounds', true);

        //  The hero!
        player = game.add.sprite(700, 300, 'ship');
        player.anchor.setTo(0.5, 0.5);
        //player.angle = 180;
        game.physics.enable(player, Phaser.Physics.ARCADE);

        //  The baddies!
        aliens = game.add.group();
        aliens.enableBody = true;
        aliens.physicsBodyType = Phaser.Physics.ARCADE;
        //aliens.setAll('alienOOB', true);
        //aliens.setAll('checkWorldBounds', true);

        createAliens();

        //  The score
        //scoreString = 'Score : ';
        scoreText = game.add.text(10, 10, scoreString + score, { font: '34px Arial', fill: '#fff' });

        //  Lives
        lives = game.add.group();
        game.add.text(game.world.width - 100, 10, 'Lives : ', { font: '34px Arial', fill: '#fff' });

        //  Text
        stateText = game.add.text(game.world.centerX, game.world.centerY, ' ', { font: '84px Arial', fill: '#fff' });
        stateText.anchor.setTo(0.5, 0.5);
        stateText.visible = false;

        for (var i = 0; i < 3; i++) {
            var ship = lives.create(game.world.width - 100 + (30 * i), 80, 'ship');
            ship.anchor.setTo(0.5, 0.5);
            ship.angle = 90;
            ship.alpha = 0.4;
        }

        //  An explosion pool
        explosions = game.add.group();
        explosions.createMultiple(30, 'boom');
        explosions.forEach(setupInvader, this);

        //  And some controls to play the game with
        cursors = game.input.keyboard.createCursorKeys();
        fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    }

    function createAliens() {

        for (var y = 0; y < 10; y++) {
            var alien = aliens.create((Math.random() * 100), game.world.randomY, 'enemy');
            alien.anchor.setTo(0.5, 0.5);
            alien.events.onOutOfBounds.add(alienOOB, this);
            alien.checkWorldBounds = true;
            //alien.angle = 180;
            //alien.animations.add('fly', [0, 1, 2, 3], 20, true);
            //alien.play('fly');
            //alien.body.moves = false;
        }

        //aliens.x = 100;
        //aliens.y = 50;

        //  All this does is basically start the invaders moving. Notice we're moving the Group they belong to, rather than the invaders directly.
        game.add.tween(aliens).to({ x: game.width + (1600 + alien.x) }, 40000, Phaser.Easing.Linear.None, true);

        //  When the tween loops it calls descend
        //tween.onLoop.add(createAliens, this);
    }

    function setupInvader(invader) {

        invader.anchor.x = 0.5;
        invader.anchor.y = 0.5;
        invader.animations.add('boom');

    }

    function descend() {

        //aliens.y += 10;

    }

    function update() {

        //  Scroll the background
        space.tilePosition.x += 2;

        if (player.alive) {
            //  Reset the player, then check for movement keys
            player.body.velocity.setTo(0, 0);

            if (cursors.left.isDown) {
                player.body.velocity.x = -200;
            }
            else if (cursors.right.isDown) {
                player.body.velocity.x = 200;
            }
            else if (cursors.down.isDown) {
                player.body.velocity.y = 200;
            }
            else if (cursors.up.isDown) {
                player.body.velocity.y = -200;
            }

            //  Firing?
            if (fireButton.isDown) {
                fireBullet();
            }

            if (game.time.now > firingTimer) {
                enemyFires();
            }

            //  Run collision
            game.physics.arcade.overlap(bullets, aliens, collisionHandler, null, this);
            game.physics.arcade.overlap(enemyBullets, player, enemyHitsPlayer, null, this);
            //checkOutOfBounds();
        }

    }

    function render() {

        // for (var i = 0; i < aliens.length; i++)
        // {
        //     game.debug.body(aliens.children[i]);
        // }

    }

    function collisionHandler(bullet, alien) {

        //  When a bullet hits an alien we kill them both
        bullet.kill();
        alien.kill();

        //  Increase the score
        score += 20;
        scoreText.text = scoreString + score;

        //  And create an explosion :)
        var explosion = explosions.getFirstExists(false);
        explosion.reset(alien.body.x, alien.body.y);
        explosion.play('boom', 30, false, true);

        if (aliens.countLiving() == 0) {
            score += 1000;
            scoreText.text = scoreString + score;

            enemyBullets.callAll('kill', this);
            stateText.text = " You Won, \n Click to restart";
            stateText.visible = true;

            //the "click to restart" handler
            game.input.onTap.addOnce(restart, this);
        }

    }

    function enemyHitsPlayer(player, enemyBullet) {

        enemyBullet.kill();
        player.kill();

        if (lives.countLiving() > 0) {
            var live = lives.getFirstExists(false);
            live.kill();
            player.revive();
        }

        //  And create an explosion :)
        var explosion = explosions.getFirstExists(false);
        explosion.reset(player.body.x, player.body.y);
        explosion.play('boom', 30, false, true);

        // When the player dies
        if (lives.countLiving() == 0) {

            enemyBullets.callAll('kill', this);
            stateText.text = " GAME OVER \n Click to restart";
            stateText.visible = true;

            //the "click to restart" handler
            game.input.onTap.addOnce(restart, this);
        }

    }

    function enemyFires() {

        //  Grab the first bullet we can from the pool
        var enemyBullet = enemyBullets.getFirstExists(false);

        livingEnemies.length = 0;

        aliens.forEachAlive(function (alien) {

            // put every living enemy in an array
            livingEnemies.push(alien);
        });


        if (enemyBullet && livingEnemies.length > 0) {

            var random = game.rnd.integerInRange(0, livingEnemies.length - 1);

            // randomly select one of them
            var shooter = livingEnemies[random];
            // And fire the bullet from this enemy
            enemyBullet.reset(shooter.body.x + 20, shooter.body.y + 16);

            game.physics.arcade.moveToObject(enemyBullet, player, 120);
            firingTimer = game.time.now + 2000;
        }

    }

    function fireBullet() {

        //  To avoid them being allowed to fire too fast we set a time limit
        if (game.time.now >= bulletTime) {
            //  Grab the first bullet we can from the pool
            var bullet = bullets.getFirstExists(false);

            if (bullet) {
                //  And fire it
                bullet.reset(player.x - 8, player.y + 6);
                bullet.body.velocity.x = -400;
                bulletTime = game.time.now + 200;
            }
        }

    }

    function enemyBulletOOB(enemyBullet) {

        //  Called if the bullet goes out of the screen
        enemyBullet.kill();
    }

    function bulletOOB(bullet) {
        bullet.kill();
    }

    function alienOOB(alien) {
        alien.kill();
    }

    function restart() {

        //  A new level starts
        score = 0;
        bulletTime = 0;
        firingTimer = 0;

        //resets the life count
        lives.callAll('revive');
        //  And brings the aliens back from the dead :)
        aliens.removeAll();
        enemybullets.removeAll();
        createAliens();

        //revives the player
        player.revive();
        //hides the text
        stateText.visible = false;
        //scoreText.text = scoreString + score;

    }
};
