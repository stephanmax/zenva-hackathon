export function random(x) {
  return Math.floor(Math.random() * x)
}

export function randomPick(arr) {
  return arr[random(arr.length)]
}

export function randomFloat(x) {
  return Math.random() * x
}
