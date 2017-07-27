import Phaser from 'phaser'

export default class extends Phaser.State {
  init(score) {
    this.score = score
  }

  create () {
    let scoreText = game.add.text(game.world.centerX, game.world.centerY, `You got ${this.score} points`, {font: "48px Helvetica", fill: "#ffffff", align: "center"})
    scoreText.anchor.set(0.5)
  }
}
