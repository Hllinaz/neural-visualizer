export interface LossFunction {
  compute(output: number, target: number): number
  derivative(output: number, target: number): number
}

export const MSE: LossFunction = {
  compute: (o, t) => 0.5 * Math.pow(o - t, 2),
  derivative: (o, t) => o - t
}
