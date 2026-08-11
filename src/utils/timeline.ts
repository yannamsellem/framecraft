export const snapToKeyframe = (
  time: number,
  keyframes: number[] | undefined,
  threshold: number = 0.1,
) => {
  if (!keyframes || keyframes.length === 0) return time
  let closest = keyframes[0]
  for (const kf of keyframes) {
    if (Math.abs(time - kf) < Math.abs(time - closest)) {
      closest = kf
    }
  }
  return Math.abs(time - closest) <= threshold ? closest : time
}
