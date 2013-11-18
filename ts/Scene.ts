///<reference path="phaser.d.ts"/>

class Scene extends Phaser.State {
    public game: Phaser.Game;

    constructor(game: Phaser.Game) {
        super();
        this.game = game;
    }

    public setScene(sceneName: string): void {
        this.game.state.start(sceneName, true, false);
    }
}
