import Phaser from 'phaser'

export default class extends Phaser.State {
  preload () {
    game.load.audio('background', './assets/sound/background.ogg')
    game.load.audio('success', './assets/sound/success.ogg')
  }

  create () {
    game.add.audio('background').play('', 0, 0.3, true)

    game.state.start('Play')
  }
}
