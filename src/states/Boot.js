import Phaser from 'phaser'

export default class extends Phaser.State {
  preload () {
    game.load.audio('background', './assets/sound/background.ogg')
    game.load.audio('success', './assets/sound/success.ogg')
    game.load.audio('miss', './assets/sound/miss.ogg')
    game.load.audio('fail', './assets/sound/fail.ogg')
    game.load.audio('newTarget', './assets/sound/newTarget.ogg')

    game.load.image('title', './assets/img/title.jpg')
    game.load.image('tutorial', './assets/img/tutorial.jpg')

    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL
  }

  create () {
    game.add.audio('background').play('', 0, 0.4, true)

    game.state.start('Title')
  }
}
