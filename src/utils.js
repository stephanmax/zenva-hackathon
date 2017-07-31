export function random(x) {
  return game.rnd.integerInRange(0, x-1)
}

export function randomPick(arr) {
  return arr[random(arr.length)]
}

export function randomFloat(x) {
  return game.rnd.realInRange(0, x)
}
