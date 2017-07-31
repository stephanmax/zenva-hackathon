export default function(color) {
  return class extends Phaser.Particle {
    constructor(game, x, y) {
      super(game, x, y, game.cache.getBitmapData('particleShade' + color))
    }
  }
}
