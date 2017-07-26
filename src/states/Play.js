import Phaser from 'phaser'

import * as utils from '../utils'
import Shape from '../shape'

export default class extends Phaser.State {
  init() {
    this.COLORS = [0xffffff, 0x00cafc]
    // this.COLORS = [0xffffff, 0x00cafc, 0x00cafc, 0xd54243, 0xd54243]
    // , 0x53eca5, 0x53eca5, 0xede26e, 0xede26e, 0xfb8e4b, 0xfb8e4b, 0xec50aa, 0xec50aa
    this.SHAPES = ['circle']
    // , 'square' , 'triangleUp', 'pentagon', 'plus', 'triangleDown', 'diamond', 'hexagon', 'cross'

    this.targets = [null, null, null, null]
    this.shapes = []
    this.availableShapeIndexes = Array.from(Array(24).keys())

    this.secondsToNextTargetChange = 0
    this.secondsToNextShape = 2
  }

  create () {
    this.successSound = game.add.audio('success')

    this.hud = game.add.graphics(0, 0)

    this.hud.lineStyle(1, 0x999999)
    this.hud.moveTo(120, 20)
    this.hud.lineTo(120, 340)

    this.timer = game.time.events.loop(Phaser.Timer.SECOND, this.tick, this)
  }

  update() {
    this.manageTargets()
    this.manageShapes()

    this.shapes.filter(shape => shape !== undefined).forEach((shape) => {
      if (shape.lifespan <= 0) {
        let miss = this.targets.some(target => target !== null && target.equals(shape))
        if (miss) {
          shape.miss().onComplete.add(() => {
            shape.graphics.destroy()
            this.shapes[shape.index] = undefined
            this.availableShapeIndexes.push(shape.index)
          })
        }
        else {
          shape.destroy().onComplete.add(() => {
            shape.graphics.destroy()
            this.shapes[shape.index] = undefined
            this.availableShapeIndexes.push(shape.index)
          })
        }
      }
    })

    this.targets.filter(target => target !== null).forEach(target => target.draw())
    this.shapes.filter(shape => shape !== undefined).forEach((shape) => {
      shape.draw()

      if (!shape.clickable) {
        shape.graphics.inputEnabled = true
        shape.graphics.input.useHandCursor = true
        shape.graphics.events.onInputUp.add(() => {
          shape.graphics.inputEnabled = false
          let success = this.targets.some(target => target !== null && target.equals(shape))
          if (success) {
            this.successSound.play()
            shape.success().onComplete.add(() => {
              shape.graphics.destroy()
              this.shapes[shape.index] = undefined
              this.availableShapeIndexes.push(shape.index)
            })
          }
        }, this)
        shape.clickable = true
      }
    })
  }

  tick() {
    this.secondsToNextTargetChange -= 1
    this.secondsToNextShape -= 1

    this.shapes.filter(shape => shape !== undefined).forEach(shape => shape.tick())
  }

  manageTargets() {
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
        let takenShapes = this.targets.filter(target => target !== null  && (color === 0xffffff || target.color === color || target.color === 0xffffff)).map(target => target.shape)
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
        oldShape.destroy().onComplete.add(() => {
          oldShape.graphics.destroy()
          this.targets[targetIndex] = null
        })
      }

      this.secondsToNextTargetChange = 15 + utils.random(16)
    }
  }

  manageShapes() {
    if (this.secondsToNextShape === 0) {
      let color = this.COLORS[utils.random(this.COLORS.length - 1) + 1]
      let shape = utils.randomPick(this.SHAPES)

      let metaIndex = utils.random(this.availableShapeIndexes.length)
      let index = this.availableShapeIndexes[metaIndex]
      this.availableShapeIndexes.splice(metaIndex, 1)

      this.shapes[index] = new Shape(color, shape, false, index, 5 + utils.random(6))

      this.secondsToNextShape = 2 + utils.random(4)
    }
  }
}
