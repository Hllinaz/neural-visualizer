export interface Activation {
  activate(x: number): number
  derivative(x: number): number
}

export const Sigmoid: Activation = {
  activate: (x) => 1 / (1 + Math.exp(-x)),
  derivative: (x) => {
    const s = 1 / (1 + Math.exp(-x))
    return s * (1 - s)
  }
}

export const ReLU: Activation = {
  activate: (x) => Math.max(0, x),
  derivative: (x) => x > 0 ? 1 : 0
}