import * as utils from './utils'
import MyParticle from './particle'

export default class Shape {
  constructor(color, shape, isTarget, index, lifespan) {
    this.color = color
    this.shape = shape

    this.isTarget = isTarget
    this.index = index
    this.lifespan = lifespan

    this.x = isTarget ? 60 : 180 + (index % 6) * 80
    this.y = isTarget ? 60 + index * 80 : 60 + Math.floor(index / 6) * 80

    this.graphics = game.add.graphics(this.x, this.y)
    this.clickable = false

    this.emitter = game.add.emitter(this.x, this.y, 100)
    this.emitter.particleClass = MyParticle
    this.emitter.makeParticles()
    // this.emitter.gravity = 200

    game.add.tween(this.graphics).from({alpha: 0}, 1000, Phaser.Easing.Linear.None, true)
  }

  draw() {
    this.graphics.clear()
    this.graphics.lineStyle(4, this.color, 1)
    this.graphics.beginFill(0x000000)
    switch (this.shape) {
      case 'triangleUp':
        this.graphics.drawTriangle([0, -17, -20, 18, 20, 18, 0, -17])
        break
      case 'triangleDown':
        this.graphics.drawTriangle([0, 17, -20, -18, 20, -18, 0, 17])
        break
      case 'square':
        this.graphics.drawRect(-20, -20, 40, 40)
        break
      case 'diamond':
        this.graphics.drawPolygon([0, -20, -20, 0, 0, 20, 20, 0, 0, -20])
        break
      case 'circle':
        this.graphics.drawCircle(0, 0, 40)
        break
      case 'pentagon':
        this.graphics.drawPolygon([0, -18, 19, -4, 12, 18, -12, 18, -19, -4, 0, -18])
        break
      case 'hexagon':
        this.graphics.drawPolygon([-10, 18, -20, 0, -10, -18, 10, -18, 20, 0, 10, 18, -10, 18])
        break
      case 'plus':
        this.graphics.drawPolygon([-6, -20, -6, -6, -20, -6, -20, 6, -6, 6, -6, 20, 6, 20, 6, 6, 20, 6, 20, -6, 6, -6, 6, -20, -6, -20])
        break
      case 'cross':
        this.graphics.drawPolygon([-12, -20, -20, -12, -8, 0, -20, 12, -12, 20, 0, 8, 12, 20, 20, 12, 8, 0, 20, -12, 12, -20, 0, -8, -12, -20])
        break
      default:
    }
    this.graphics.endFill()
  }

  destroy(style) {
    this.graphics.inputEnabled = false

    switch (style) {
      case 'miss':
        game.add.tween(this.graphics.scale).to({x: 0.5, y: 0.5}, 200, Phaser.Easing.Sinusoidal.InOut, true, 0, 5, true)
        return game.add.tween(this.graphics).to({alpha: 0}, 1000, Phaser.Easing.Quartic.In, true)
        break
      case 'success':
        game.add.tween(this.graphics.scale).to({x: 5, y: 5}, 1000, Phaser.Easing.Linear.In, true)
        return game.add.tween(this.graphics).to({alpha: 0}, 1000, Phaser.Easing.Quartic.Out, true)
        break
      case 'fail':
        let bounce = game.add.tween(this.graphics).to({x: 10}, 900, Phaser.Easing.Bounce.InOut, true, 0, 5, true)
        game.add.tween(this.graphics).to({x: -10}, 100, Phaser.Easing.Linear.In, true).chain(bounce)
        return game.add.tween(this.graphics).to({alpha: 0}, 1000, Phaser.Easing.Quartic.Out, true)
        break
      default:
        return game.add.tween(this.graphics).to({alpha: 0}, 1000, Phaser.Easing.Quartic.Out, true)
    }
  }

  equals(shape) {
    return this.shape === shape.shape && (this.color === shape.color || this.color === 0xffffff || shape.color === 0xffffff)
  }
}
