import 'pixi'
import 'p2'
import Phaser from 'phaser'

import Boot from './states/Boot'
import Play from './states/Play'
import End from './states/End'

import config from './config'

class MyGame extends Phaser.Game {
  constructor () {
    super(config.width, config.height, Phaser.AUTO)

    this.state.add('Boot', Boot, false)
    this.state.add('Play', Play, false)
    this.state.add('End', End, false)

    this.state.start('Boot')
  }
}

window.game = new MyGame()
