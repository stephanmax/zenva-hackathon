import Phaser from 'phaser'

import * as utils from '../utils'
import Shape from '../shape'

export default class extends Phaser.State {
  init() {
    this.COLORS = [0x00cafc, 0xd54243, 0x53eca5, 0xede26e, 0xffffff, 0xfb8e4b, 0xec50aa]
    this.SHAPES = ['circle', 'square', 'triangleUp', 'pentagon', 'plus', 'triangleDown', 'diamond', 'hexagon', 'cross']

    this.targets = [null, null, null, null]
    this.secondsToNextTargetChange = 0
  }

  create () {
    this.successSound = game.add.audio('success')

    this.hud = game.add.graphics(0, 0)

    this.hud.lineStyle(1, 0xcccccc)
    this.hud.moveTo(120, 20)
    this.hud.lineTo(120, 340)

    this.timer = game.time.events.loop(Phaser.Timer.SECOND, this.tick, this)

    // this.triangle = game.add.graphics(360, 150)
    //
    // this.triangle.inputEnabled = true
    // this.triangle.input.useHandCursor = true
    //
    // let shrink = game.add.tween(this.triangle.scale).to({x: [0.6, 5], y: [0.6, 5]}, 1000, Phaser.Easing.CUBIC)
    // let fadeOut = game.add.tween(this.triangle).to({alpha: 0}, 1000, Phaser.Easing.EXPONENTIAL)
    //
    // this.triangle.events.onInputUp.add(() => {
    //   this.successSound.play()
    //   this.alp = 1
    //   shrink.start()
    //   fadeOut.start()
    // }, this)
  }

  update() {
    if (this.secondsToNextTargetChange === 0) {
      let targetChangeOptions = ['add', 'remove'], targetChange, targetIndex
      let filledTargetSpots = this.targets.reduce((acc, val, i) => {
        if (val !== null) {
          acc.push(i)
        }
        return acc
      }, [])
      let emptyTargetSpots = this.targets.reduce((acc, val, i) => {
        if (val === null) {
          acc.push(i)
        }
        return acc
      }, [])

      if (filledTargetSpots.length <= 1) {
        targetChange = 'add'
      }
      else if (filledTargetSpots.length === 4) {
        targetChange = 'remove'
      }
      else {
        targetChange = targetChangeOptions[utils.random(targetChangeOptions.length)]
      }

      if (targetChange === 'add') {
        targetIndex = emptyTargetSpots[utils.random(emptyTargetSpots.length)]

        let color = this.COLORS[utils.random(this.COLORS.length)]
        let takenShapes = this.targets.filter(target => target !== null  && (target.color === color || target.color === 0xffffff)).map(target => target.shape)
        let availableShapes = this.SHAPES.filter(shape => !takenShapes.includes(shape))

        if (availableShapes.length === 0) {
          targetChange = 'remove'
        }
        else {
          let shape = availableShapes[utils.random(availableShapes.length)]
          this.targets[targetIndex] = new Shape(color, shape, true, targetIndex)
        }
      }
      if (targetChange === 'remove') {
        targetIndex = filledTargetSpots[utils.random(filledTargetSpots.length)]

        let oldShape = this.targets[targetIndex]
        oldShape.fadeOut.onComplete.add(() => {
          oldShape.graphics.destroy()
          this.targets[targetIndex] = null
        })
        oldShape.fadeOut.start()
      }

      this.secondsToNextTargetChange = 15 + utils.random(16)
    }

    this.targets.filter(target => target !== null).forEach(target => target.draw())
  }

  tick() {
    this.secondsToNextTargetChange -= 1
    console.log(this.secondsToNextTargetChange)
  }
}
