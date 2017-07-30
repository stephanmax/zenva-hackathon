export default class extends Phaser.Particle {
  constructor(game, x, y) {
    super(game, x, y, game.cache.getBitmapData('particleShade'))
  }
}
