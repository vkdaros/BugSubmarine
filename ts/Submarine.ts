///<reference path="phaser.d.ts"/>

class Submarine extends Phaser.Sprite {
    public game: Phaser.Game;
    private duration: number;
    private coolDown: number; // Seconds between shots.
    private nextShotTime: number;
    private createShot: Function;
    private bombs: Phaser.Group;

    constructor(game: Phaser.Game, createShot: Function, bombs: Phaser.Group) {
        this.game = game;
        this.createShot = createShot;
        this.bombs = bombs;
        super(game, 0, 0, "submarineLongImg", 0);
        this.create();
    }

    public create(): void {
        var plusMinus: number = 1;
        this.x = 650;
        this.y = 300;
        this.duration = 12000;
        this.coolDown = 2 + Math.random() * 2; 
        this.nextShotTime = this.game.time.totalElapsedSeconds() +
                            this.coolDown;

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
        }
        else {
            this.moveLeft();
        }
    }

    private moveRight() {
        // Hack! Should be: Phaser.Easing.Linear.None;
        var LinearNone = Phaser.Easing["Linear"].None;

        this.animations.play("turnRight");
        var t: Phaser.Tween = this.game.add.tween(this);
        t.to({x: 900}, this.duration, LinearNone);
        t.onComplete.add(this.moveLeft, this);
        t.start(1);
    }

    private moveLeft() {
        // Hack! Should be: Phaser.Easing.Linear.None;
        var LinearNone = Phaser.Easing["Linear"].None;

        this.animations.play("turnLeft");
        var t: Phaser.Tween = this.game.add.tween(this);
        t.to({x: 50}, this.duration, LinearNone);
        t.onComplete.add(this.moveRight, this);
        t.start(1);
    }

    public shoot() {
        if (this.game.time.totalElapsedSeconds() >= this.nextShotTime) {
            this.createShot(this.x, this.y, this.bombs);
            this.nextShotTime = this.game.time.totalElapsedSeconds() +
                                this.coolDown;
        }
    }
}
