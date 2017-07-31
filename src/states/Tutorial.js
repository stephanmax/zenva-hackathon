import Phaser from 'phaser'

export default class extends Phaser.State {
  create() {
    let tutorial = game.add.sprite(game.world.centerX, game.world.centerY, 'tutorial')
    tutorial.anchor.set(0.5)

    game.input.onDown.add(() => {
      game.state.start('Title')
    }, this)
  }
}
