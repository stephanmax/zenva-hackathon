export function random(x) {
  return Math.floor(Math.random() * x)
}

export function randomPick(arr) {
  return arr[random(arr.length)]
}
