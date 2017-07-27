import Phaser from 'phaser'

import * as utils from '../utils'
import Shape from '../shape'

export default class extends Phaser.State {
  init() {
    this.MAXLIVES = 10
    this.TICK = 100
    this.COLORSTARGET = [0xffffff, 0x00c0ff, 0xff0141]
    this.COLORSSHAPE = [0x00c0ff, 0xff0141]
    this.EXTRACOLORS = [0x53eca5, 0xffff01, 0xfb8e4b, 0xec50aa]
    this.SHAPES = ['circle', 'square']
    this.EXTRASHAPES = ['triangleUp', 'pentagon', 'triangleDown', 'diamond', 'hexagon']

    this.targets = [undefined, undefined, undefined, undefined]
    this.shapes = []
    this.availableShapeIndexes = Array.from(Array(24).keys())

    this.secondsToNextTargetChange = 0
    this.secondsToNextShape = 2

    this.lives = this.MAXLIVES
    this.lifeOrbs = []

    this.score = 0

    this.difficulties = [{
      value: 10,
      rate: 2
    }, {
      value: 10,
      rate: 1
    }, {
      value: 2,
      rate: 0.4
    }, {
      value: 2,
      rate: 0.4
    }]

    this.targetChangeOptions = ['add', 'remove']
    this.difficultyShapeLifespanConst = 3
    this.difficultyShapeLifespanVar = 3
  }

  create () {
    this.successSound = game.add.audio('success')
    this.missSound = game.add.audio('miss')
    this.failSound = game.add.audio('fail')
    this.newTargetSound = game.add.audio('newTarget')

    this.hud = game.add.graphics(0, 0)

    this.hud.lineStyle(2, 0xaaaaaa)
    this.hud.moveTo(120, 20)
    this.hud.lineTo(120, 340)

    Array.from(Array(this.MAXLIVES).keys()).forEach((i) => {
      this.hud.beginFill(0x000000)
      this.hud.drawCircle(120, 320 - i * (280 / (this.MAXLIVES-1)), 11)
      this.hud.endFill()

      let lifeOrb = game.add.graphics(120, 320 - i * (280 / (this.MAXLIVES-1)))
      let lifeAnimScale = game.add.tween(lifeOrb.scale).to({x: 8, y: 8}, 2000, Phaser.Easing.Linear.In)
      let lifeAnimFade = game.add.tween(lifeOrb).to({alpha: 0}, 2000, Phaser.Easing.Quartic.Out)

      this.lifeOrbs.push({lifeOrb, animate: () => {
        lifeAnimScale.start()
        lifeAnimFade.start()
      }})
    })

    this.timer = game.time.events.loop(100, this.tick, this)
  }

  update() {
    if (this.lives <= 0) {
      game.state.start('End', true, false, this.score)
    }
    this.drawLives()

    this.manageTargets()
    this.manageShapes()

    this.shapes.filter(shape => shape !== undefined).forEach((shape) => {
      if (shape.lifespan <= 0) {
        this.shapes[shape.index] = undefined
        let miss = this.targets.some(target => target !== undefined && target.equals(shape))
        if (miss) {
          this.missSound.play('', 0, 0.5)
          this.lives -= 1
          this.lifeOrbs[Math.max(this.lives, 0)].animate()
          shape.destroy('miss').onComplete.add(() => this.cleanup(shape))
        }
        else {
          shape.destroy().onComplete.add(() => this.cleanup(shape))
        }
      }
    })

    this.targets.filter(target => target !== undefined).forEach(target => target.draw())
    this.shapes.filter(shape => shape !== undefined).forEach((shape) => {
      shape.draw()

      if (!shape.clickable) {
        shape.graphics.inputEnabled = true
        shape.graphics.input.useHandCursor = true
        shape.graphics.events.onInputUp.add(() => {
          this.shapes[shape.index] = undefined
          let success = this.targets.some(target => target !== undefined && target.equals(shape))
          if (success) {
            this.successSound.play()
            shape.destroy('success').onComplete.add(() => this.cleanup(shape))
          }
          else {
            this.failSound.play('', 0, 0.3)
            this.lives -= 1
            this.lifeOrbs[Math.max(this.lives, 0)].animate()
            shape.destroy('fail').onComplete.add(() => this.cleanup(shape))
          }
        }, this)
        shape.clickable = true
      }
    })
  }

  tick() {
    this.secondsToNextTargetChange -= this.TICK / Phaser.Timer.SECOND
    this.secondsToNextShape -= this.TICK / Phaser.Timer.SECOND

    this.shapes.filter(shape => shape !== undefined).forEach(shape => shape.lifespan -= this.TICK / Phaser.Timer.SECOND)

    this.score += this.TICK / 1000

    this.progressDifficulty()
  }

  drawLives() {
    this.lifeOrbs.forEach((lifeOrb, i) => {
      lifeOrb.lifeOrb.clear()
      lifeOrb.lifeOrb.beginFill(0xaaaaaa)
      lifeOrb.lifeOrb.drawCircle(0, 0, 11)
      lifeOrb.lifeOrb.endFill()
    })
  }

  manageTargets() {
    if (this.secondsToNextTargetChange <= 0) {
      let targetChange, targetIndex
      let filledTargetSpots = this.targets.reduce((acc, val, i) => {
        if (val !== undefined) {
          acc.push(i)
        }
        return acc
      }, [])
      let emptyTargetSpots = this.targets.reduce((acc, val, i) => {
        if (val === undefined) {
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
        targetChange = utils.randomPick(this.targetChangeOptions)
      }

      if (targetChange === 'add') {
        targetIndex = utils.randomPick(emptyTargetSpots)

        let color = utils.randomPick(this.COLORSTARGET)
        let takenShapes = this.targets.filter(target => target !== undefined  && (color === 0xffffff || target.color === color || target.color === 0xffffff)).map(target => target.shape)
        let availableShapes = this.SHAPES.filter(shape => !takenShapes.includes(shape))

        if (availableShapes.length === 0) {
          targetChange = 'remove'
        }
        else {
          let shape = utils.randomPick(availableShapes)
          this.newTargetSound.play('', 0, 0.3)
          this.targets[targetIndex] = new Shape(color, shape, true, targetIndex)
          // Fairness measure
          this.shapes.filter(shape => shape !== undefined && shape.equals(this.targets[targetIndex])).forEach(shape => shape.lifespan += 2)
        }
      }
      if (targetChange === 'remove') {
        targetIndex = utils.randomPick(filledTargetSpots)

        let oldShape = this.targets[targetIndex]
        oldShape.destroy().onComplete.add(() => {
          oldShape.graphics.destroy()
          this.targets[targetIndex] = undefined
        })
      }

      this.secondsToNextTargetChange = 3 + this.difficulties[0].value + utils.randomFloat(4 + this.difficulties[1].value)
    }
  }

  manageShapes() {
    if (this.secondsToNextShape <= 0) {
      if (this.availableShapeIndexes.length > 0) {
        let color = utils.randomPick(this.COLORSSHAPE)
        let shape = utils.randomPick(this.SHAPES)

        let index = this.availableShapeIndexes.splice(utils.random(this.availableShapeIndexes.length), 1)[0]

        this.shapes[index] = new Shape(color, shape, false, index, 2 + this.difficultyShapeLifespanConst + utils.randomFloat(3 + this.difficultyShapeLifespanVar))
      }
      this.secondsToNextShape = 0.5 + 0.1 * (4 - this.targets.filter(target => target !== undefined).length) + this.difficulties[2].value + utils.randomFloat(1 + this.difficulties[3].value)
      console.log(this.secondsToNextShape)
    }
  }

  progressDifficulty() {
    if (this.score % 45 < 0.1) {
      let dice = utils.random(2)
      if (dice === 0) {
        if (this.EXTRACOLORS.length > 0) {
          this.COLORSTARGET.push(this.EXTRACOLORS.shift())
          this.COLORSSHAPE.push(this.EXTRACOLORS.shift())
        }
      }
      if (dice === 1) {
        if (this.EXTRASHAPES.length > 0) {
          this.SHAPES.push(this.EXTRASHAPES.shift())
        }
      }
    }

    if (this.score % 60 < 0.1) {
      this.targetChangeOptions.push('add')
    }

    if (this.score % 10 < 0.1) {
      this.difficulties.forEach((difficulty) => {
        if (difficulty.value > 0) {
          difficulty.value = Math.max(0, difficulty.value - difficulty.rate)
        }
      })
    }
  }

  cleanup(shape) {
    shape.graphics.destroy()
    this.availableShapeIndexes.push(shape.index)
  }

  // render() {
  //   this.game.debug.text(`Tweens: ${game.tweens.getAll().length}`, 20, 20, 'lime')
  //   this.game.debug.text(`Points: ${this.score}`, 20, 36, 'lime')
  // }
}
