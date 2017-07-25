import * as utils from './utils'

export default class Shape {
  constructor(color, shape, isTarget, index, x, y) {

    this.color = color
    this.shape = shape

    this.x = isTarget ? 60 : 145 + utils.random(471)
    this.y = isTarget ? 60 + index * 80 : 25 + utils.random(311)

    this.graphics = game.add.graphics(this.x, this.y)

    this.fadeIn = game.add.tween(this.graphics).from({alpha: 0}, 1000, "Quart.easeIn", true)
    this.fadeOut = game.add.tween(this.graphics).to({alpha: 0}, 1000, "Quart.easeOut")
  }

  draw() {
    this.graphics.clear()
    this.graphics.lineStyle(4, this.color, 1)
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
  }

  equals(shape) {
    return this.shape === shape.shape && (this.color === shape.color || this.color === 0xffffff || shape.color === 0xffffff)
  }
}
