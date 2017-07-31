import Phaser from 'phaser'

import * as utils from '../utils'
import Shape from '../shape'

export default class extends Phaser.State {
  init() {
    this.MAXLIVES = 10
    this.TICK = 100
    this.COLORS = [0x00c0ff, 0xff0141, 0x53eca5, 0xffff01, 0xfb8e4b, 0xec50aa]
    this.COLORSTARGET = [0xffffff, 0x00c0ff, 0xff0141]
    this.COLORSSHAPE = [0x00c0ff, 0xff0141]
    this.SHAPES = ['circle', 'square']
    this.EXTRAS = ['triangleUp', 'pentagon', 'triangleDown', 'diamond', 'hexagon', 0x53eca5, 0xffff01, 0xfb8e4b, 0xec50aa]

    this.targets = [undefined, undefined, undefined, undefined]
    this.shapes = []
    this.availableShapeIndexes = Array.from(Array(24).keys())

    this.secondsToNextTargetChange = 0
    this.secondsToNextShape = 2

    this.lives = this.MAXLIVES
    this.lifeOrbs = []

    this.time = 0
    this.score = 0
    this.streak = 0

    this.difficulties = [{
      value: 6,
      rate: 2
    }, {
      value: 7,
      rate: 1
    }, {
      value: 1,
      rate: 0.3
    }, {
      value: 1,
      rate: 0.3
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
      let lifeAnimScale = game.add.tween(lifeOrb.scale).to({x: 10, y: 10}, 1500, Phaser.Easing.Quadratic.EaseOut)
      let lifeAnimFade = game.add.tween(lifeOrb).to({alpha: 0}, 1500, Phaser.Easing.Linear.In)

      this.lifeOrbs.push({lifeOrb, animate: () => {
        lifeAnimScale.start()
        lifeAnimFade.start()
      }})
    })

    this.COLORS.forEach((color) => {
      let bmd = game.add.bitmapData(32, 32)
      let radgrad = bmd.ctx.createRadialGradient(16, 16, 2, 16, 16, 16)
      let c = Phaser.Color.getRGB(color)
      radgrad.addColorStop(0, Phaser.Color.getWebRGB(c))
      c.a = 0
      radgrad.addColorStop(1, Phaser.Color.getWebRGB(c))
      bmd.context.fillStyle = radgrad
      bmd.context.fillRect(0, 0, 32, 32)

      game.cache.addBitmapData('particleShade' + color, bmd)
    })

    this.scoreText = game.add.text(game.world.centerX + 60, game.world.centerY, this.score, {font: "180px 'Helvetica Neue'", fill: "rgba(255, 255, 255, 0.15)", align: "center"})
    this.scoreText.anchor.set(0.5)

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
          this.missSound.play('', 0, 0.7)
          this.lives -= 1
          this.lifeOrbs[Math.max(this.lives, 0)].animate()
          shape.destroy('miss').onComplete.add(() => this.cleanup(shape))
          this.streak = 0
        }
        else {
          shape.destroy().onComplete.add(() => this.cleanup(shape))
          this.score++
          this.streak++
        }
      }
    })

    this.targets.filter(target => target !== undefined).forEach(target => target.draw())
    this.shapes.filter(shape => shape !== undefined).forEach((shape) => {
      shape.draw()

      if (!shape.clickable) {
        shape.graphics.inputEnabled = true
        shape.graphics.input.useHandCursor = true
        shape.graphics.events.onInputUp.add((pointer) => {
          this.shapes[shape.index] = undefined
          let success = this.targets.some(target => target !== undefined && target.equals(shape))
          if (success) {
            this.successSound.play()
            this.score++
            this.streak++
            shape.destroy('success', this.streak).onComplete.add(() => this.cleanup(shape))
          }
          else {
            this.failSound.play('', 0, 0.5)
            this.lives -= 1
            this.streak = 0
            this.lifeOrbs[Math.max(this.lives, 0)].animate()
            shape.destroy('fail').onComplete.add(() => this.cleanup(shape))
          }
        }, this)
        shape.clickable = true
      }
    })
    this.scoreText.setText(this.score)
  }

  tick() {
    this.secondsToNextTargetChange -= this.TICK / Phaser.Timer.SECOND
    this.secondsToNextShape -= this.TICK / Phaser.Timer.SECOND

    this.shapes.filter(shape => shape !== undefined).forEach(shape => shape.lifespan -= this.TICK / Phaser.Timer.SECOND)

    this.time += this.TICK / 1000

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
          this.newTargetSound.play('', 0, 0.5)
          this.targets[targetIndex] = new Shape(color, shape, true, targetIndex)
          // Fairness measure
          this.shapes.filter(shape => shape !== undefined && shape.equals(this.targets[targetIndex])).forEach(shape => shape.lifespan += 3)
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

      this.secondsToNextTargetChange = 2 + this.difficulties[0].value + utils.randomFloat(2 + this.difficulties[1].value)
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
      this.secondsToNextShape = 0.5 + this.difficulties[2].value + utils.randomFloat(0.5 + this.difficulties[3].value)
    }
  }

  progressDifficulty() {
    if (this.time % 25 < 0.1) {
      if (this.EXTRAS.length > 0) {
        let extra = this.EXTRAS.splice(utils.random(this.EXTRAS.length), 1)[0]
        if (typeof extra === "number") {
          this.COLORSTARGET.push(extra)
          this.COLORSSHAPE.push(extra)
        }
        else {
          this.SHAPES.push(extra)
        }
      }
    }

    if (this.time % 20 < 0.1) {
      this.targetChangeOptions.push('add')
    }

    if (this.time % 5 < 0.1) {
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

  render() {
    // this.game.debug.text(`Tweens: ${game.tweens.getAll().length}`, 20, 20, 'lime')
    // this.game.debug.text(`Points: ${this.score}`, 20, 36, 'lime')
  }
}
