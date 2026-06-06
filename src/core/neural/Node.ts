import type { Activation } from "./ActivationFunction"
import { Connection } from "./Connection"

export class Node {

    incoming: Connection[] = []
    outgoing: Connection[] = []

    output = 0
    z = 0
    delta = 0
    bias = Math.random() * 2 - 1

    constructor(
        public activation: Activation | null, 
        public layerIndex: number, 
        public nodeIndex: number) { }

    forward() {
        let sum = this.bias

        for (const c of this.incoming) {
            sum += c.origin.output * c.weight
        }

        this.z = sum
        this.output = this.activation
            ? this.activation.activate(sum)
            : sum
    }
}