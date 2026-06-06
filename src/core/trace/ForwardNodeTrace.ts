import type { NodeTrace } from "./NodeTrace"
import type { TraceType } from "./TraceType"

export interface TermComputation {
    weight: number
    input: number
    product: number
}

export class ForwardNodeTrace implements NodeTrace {

    layerIndex: number
    nodeIndex: number

    type: TraceType = "FORWARD"

    terms: TermComputation[]
    cumulativeSums: number[]

    bias?: number
    z?: number
    activation: number

    constructor(
        layerIndex: number,
        nodeIndex: number,
        activation: number,
        terms: TermComputation[] = [],
        cumulativeSums: number[] = [],
        bias?: number,
        z?: number
    ) {
        this.layerIndex = layerIndex
        this.nodeIndex = nodeIndex

        this.activation = activation
        this.terms = terms
        this.cumulativeSums = cumulativeSums

        this.bias = bias
        this.z = z
    }

    getStepCount(): number {

        // input layer no tiene pasos de computación
        if (this.terms.length === 0) {
            return 1
        }

        return this.terms.length + 2
    }
}