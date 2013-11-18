///<reference path="phaser.d.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Scene = (function (_super) {
    __extends(Scene, _super);
    function Scene(game) {
        _super.call(this);
        this.game = game;
    }
    Scene.prototype.setScene = function (sceneName) {
        this.game.state.start(sceneName, true, false);
    };
    return Scene;
})(Phaser.State);
///<reference path="phaser.d.ts"/>
var Submarine = (function (_super) {
    __extends(Submarine, _super);
    function Submarine(game, createShot, bombs) {
        this.game = game;
        this.createShot = createShot;
        this.bombs = bombs;
        _super.call(this, game, 0, 0, "submarineLongImg", 0);
        this.create();
    }
    Submarine.prototype.create = function () {
        var plusMinus = 1;
        this.x = 650;
        this.y = 300;
        this.duration = 12000;
        this.coolDown = 2 + Math.random() * 2;
        this.nextShotTime = this.game.time.totalElapsedSeconds() + this.coolDown;

        this.anchor.x = 0.5;
        this.anchor.y = 0.5;

        this.body.customSeparateX = true;
        this.body.customSeparateY = true;

        var height = this.body.height;
        var oldWidth = this.body.width;
        var newWidth = oldWidth * 1.05;

        this.animations.add("turnLeft", [0]);
        this.animations.add("turnRight", [1]);

        if (plusMinus < 0) {
            this.moveRight();
        } else {
            this.moveLeft();
        }
    };

    Submarine.prototype.moveRight = function () {
        // Hack! Should be: Phaser.Easing.Linear.None;
        var LinearNone = Phaser.Easing["Linear"].None;

        this.animations.play("turnRight");
        var t = this.game.add.tween(this);
        t.to({ x: 900 }, this.duration, LinearNone);
        t.onComplete.add(this.moveLeft, this);
        t.start(1);
    };

    Submarine.prototype.moveLeft = function () {
        // Hack! Should be: Phaser.Easing.Linear.None;
        var LinearNone = Phaser.Easing["Linear"].None;

        this.animations.play("turnLeft");
        var t = this.game.add.tween(this);
        t.to({ x: 50 }, this.duration, LinearNone);
        t.onComplete.add(this.moveRight, this);
        t.start(1);
    };

    Submarine.prototype.shoot = function () {
        if (this.game.time.totalElapsedSeconds() >= this.nextShotTime) {
            this.createShot(this.x, this.y, this.bombs);
            this.nextShotTime = this.game.time.totalElapsedSeconds() + this.coolDown;
        }
    };
    return Submarine;
})(Phaser.Sprite);
///<reference path="phaser.d.ts"/>
///<reference path="Scene.ts"/>
///<reference path="Submarine.ts"/>
var Boat = (function (_super) {
    __extends(Boat, _super);
    function Boat(game) {
        _super.call(this, game);
    }
    Boat.prototype.create = function () {
        this.lives = 5;
        this.level = 1;

        this.submarines = this.game.add.group(null, "submarines");

        this.barrels = this.game.add.group(null, "barrels");
        for (var i = 0; i < 10; i++) {
            var barrel;
            barrel = this.barrels.create(100, 100, "barrelImg", "0", true);
            barrel.anchor.x = 0.5;
            barrel.anchor.y = 0.5;
            var width = barrel.body.width * 1.5;
            var height = barrel.body.height * 1.5;
            barrel.body.setSize(width, height, 0, 0);
            barrel.x = 200 + 40 * i;
            barrel.y = 70 + 30 * i;
            barrel.body.velocity.y = 27;
            //console.log("Barrel at: " + barrel.body.x + ", " + barrel.body.y)
        }

        this.bombs = this.game.add.group(null, "bombs");
        for (var i = 0; i < 30; i++) {
            var bomb;
            bomb = this.bombs.create(9999, 9999, "bombImg", "0", true);
            bomb.anchor.x = 0.5;
            bomb.anchor.y = 0.5;
            bomb.kill();
        }

        this.lastBoatShot = -100;

        var fontConfig = {
            font: "48px Arial",
            fill: "#222",
            align: "left"
        };
        this.hudLevel = this.game.add.text(this.game.width - 10, 10, "", fontConfig);
        this.hudLevel.anchor.x = 1;
        this.hudLives = this.game.add.text(10, 10, "", fontConfig);

        this.explosions = this.game.add.group(null, "explosions");

        this.jumpToLevel(this.level);
    };

    Boat.prototype.update = function () {
        var keyboard = this.game.input.keyboard;
        var keys = Phaser.Keyboard;

        // boat movement
        // lock boat inside the arena
        // hud
        this.hudLevel["content"] = "Level: " + this.level;
        this.hudLives["content"] = "Lives: " + this.lives;

        if (this.game.time.totalElapsedSeconds() > this.lastBoatShot + 1) {
            if (keyboard.isDown(keys.SPACEBAR)) {
                var barrel = this.barrels.getFirstDead();
                if (barrel) {
                    barrel.body.y = 200;
                    barrel.body.x = 100;
                    barrel.revive();
                    barrel.body.velocity.y = 100;
                }
                this.lastBoatShot = this.game.time.totalElapsedSeconds();
            }
        }

        // All submarines tries to fire.
        this.submarines.forEach(function (submarine) {
            return submarine.shoot();
        }, this, true);

        // handle bomb movement
        this.bombs.forEach(this.handleBombMovement, this, true);

        // handle barrel movement
        this.barrels.forEach(this.handleBarrelMovement, this, true);

        // handle collision bomb x boat
        // handle collision barrel x submarines
        this.game.physics.collide(this.barrels, this.submarines, this.handleBarrelSubmarineCollision, null, this);
        //this.hitTest(this.barrels, this.submarines,
        //             this.handleBarrelSubmarineCollision,
        //             null, this);
    };

    Boat.prototype.hitTest = function (groupA, groupB, overlapCallback, processCallback, callbackContext) {
        var _this = this;
        var overlaps = this.game.physics['overlap'];
        var handleCollision = function (a, b) {
            return overlapCallback.call(callbackContext, a, b);
        };
        var proc = processCallback;
        groupA.forEach(function (a) {
            groupB.forEach(function (b) {
                if (overlaps(a, b)) {
                    if (!proc || (proc && proc(a, b)))
                        handleCollision(a, b);
                }
            }, _this, false);
        }, this, false);
    };

    Boat.prototype.createSubmarines = function (submarines, n) {
        for (var i = 0; i < 1; i++) {
            var submarine = new Submarine(this.game, this.submarineShot, this.bombs);
            submarines.add(submarine);
        }
    };

    Boat.prototype.submarineShot = function (x, y, bombs) {
        var bomb = bombs.getFirstDead();
        if (bomb) {
            bomb.body.x = x;
            bomb.body.y = y;
            bomb.revive();
        }
    };

    Boat.prototype.handleBarrelSubmarineCollision = function (barrel, submarine) {
        submarine.kill();
        this.createExplosionAt(barrel.body.x, barrel.body.y);
        if (this.submarines.countLiving() == 0) {
            this.lives++;
            this.jumpToLevel(this.level + 1);
        }
    };

    Boat.prototype.handleBarrelMovement = function (barrel) {
        if (barrel.body.y > 650) {
            barrel.body.y = 100;
        }
    };

    Boat.prototype.handleBombMovement = function (bomb) {
        bomb.body.velocity.y = -100;
        if (bomb.body.y < 200) {
            bomb.kill();
        }
    };

    Boat.prototype.handleBombsBoatCollision = function (boat, bomb) {
        bomb.kill();

        var acc = boat.body.acceleration.x;
        var vel = boat.body.velocity.x;
        boat.body.reset();
        boat.body.velocity.x = vel / 2;
        boat.body.acceleration.x = acc / 2;

        this.createExplosionAt(bomb.body.x, bomb.body.y);
        if (--this.lives == 0) {
            this.setScene("Lose");
        }
    };

    Boat.prototype.createExplosionAt = function (x, y) {
        var expl;
        expl = this.explosions.create(x, y, "explosionAnim", "0", true);
        expl.anchor.setTo(0.5, 0.5);
        expl.animations.add("exploding", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], 20, false, true);
        expl.animations.play("exploding", 20, false, true);
    };

    Boat.prototype.setScene = function (sceneName) {
        this.barrels.forEach(function (b) {
            return b.kill();
        }, this, false);
        this.bombs.forEach(function (b) {
            return b.kill();
        }, this, false);
        this.submarines.forEach(function (b) {
            return b.kill();
        }, this, false);
        this.explosions.forEach(function (b) {
            return b.kill();
        }, this, false);
        _super.prototype.setScene.call(this, sceneName);
    };

    Boat.prototype.jumpToLevel = function (level) {
        if (level >= 10) {
            this.setScene("Win");
        } else {
            this.level = level;
            this.createSubmarines(this.submarines, this.level);
            if (level > 1) {
                this.displayLevelUpFx();
            }
        }
    };

    Boat.prototype.displayLevelUpFx = function () {
        var fontConfig = {
            font: "72px Arial",
            fill: "#b22",
            align: "center"
        };

        var text;
        text = this.game.add.text(480, 240, "LEVEL UP!", fontConfig);
        text.anchor.setTo(0.5, 0.5);

        var t;
        t = this.game.add.tween(text);
        t.to({ y: 0, alpha: 0 }, 1500, Phaser.Easing["Linear"].None);
        t.start(1);
    };

    Boat.prototype.render = function () {
        var _this = this;
        var draw = function (s) {
            return _this.game.debug.renderSpriteBody(s, "rgba(0,255,0,0.5)");
        };
        this.submarines.forEach(function (submarine) {
            return draw(submarine);
        }, this, true);
        this.barrels.forEach(function (barrel) {
            return draw(barrel);
        }, this, true);
        this.bombs.forEach(function (bomb) {
            return draw(bomb);
        }, this, true);
    };
    return Boat;
})(Scene);
///<reference path="phaser.d.ts"/>
///<reference path="Scene.ts"/>
///<reference path="Boat.ts"/>
var BoatGame = (function () {
    function BoatGame() {
        var state = new Phaser.State();
        state.preload = this.preload;
        state.create = this.create;

        this.game = new Phaser.Game(960, 640, Phaser.CANVAS, "", state, false, false);
    }
    BoatGame.prototype.preload = function () {
        this.game.load.image("boatImg", "assets/images/boat.png");
        this.game.load.image("barrelImg", "assets/images/barrel.png");
        this.game.load.image("bombImg", "assets/images/bomb.png");

        this.game.load.spritesheet("explosionAnim", "assets/images/explosionframes.png", 128, 128, 20);

        // Each submarine frame is 145x30 pixels and there are 2 of them.
        this.game.load.spritesheet("submarineLongImg", "assets/images/submarine_long.png", 145, 30, 2);
    };

    BoatGame.prototype.create = function () {
        // lock keys
        var keyboard = this.game.input.keyboard;
        var keys = Phaser.Keyboard;
        keyboard.addKeyCapture(keys.LEFT);
        keyboard.addKeyCapture(keys.RIGHT);
        keyboard.addKeyCapture(keys.SPACEBAR);

        // add scenes
        this.game.state.add("Boat", new Boat(this.game), false);
        this.game.state.start("Boat", true, true);
    };
    return BoatGame;
})();

window.onload = (function () {
    var boatGame = new BoatGame();
});
