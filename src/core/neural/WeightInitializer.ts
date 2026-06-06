import { SeededRandom } from "./SeededRandom"

export interface WeightInitializer {
    initialize(fanIn: number, fanOut: number): number
}

export class HeInitializer implements WeightInitializer {

  constructor(private rng: SeededRandom) {}

  initialize(fanIn: number, fanOut: number): number {

    fanOut = 0
    
    const std = Math.sqrt(2 / fanIn)

    return this.rng.nextGaussian() * std
  }
}

export class XavierInitializer implements WeightInitializer {

  constructor(private rng: SeededRandom) {}

  initialize(fanIn: number, fanOut: number): number {

    const limit = Math.sqrt(6 / (fanIn + fanOut))

    return this.rng.nextRange(-limit, limit)
  }
}