import type { NodeSnapshot } from "../snapshot/NetworkSnapshot";
import { ForwardNodeTrace, type TermComputation } from "./ForwardNodeTrace";

export class DenseForwardTracer {

    computeWithTrace(nodeSnap: NodeSnapshot): ForwardNodeTrace {

        const terms: TermComputation[] = []
        const cumulativeSums: number[] = []

        let runningSum = 0

        for (const conn of nodeSnap.ingoing) {

            const weight = conn.weight
            const input = conn.sourceActivation

            const product = weight * input

            const term: TermComputation = {
                weight,
                input,
                product
            }

            terms.push(term)

            runningSum += product
            cumulativeSums.push(runningSum)
        }

        const bias = nodeSnap.bias
        const z = runningSum + bias
        const activation = nodeSnap.output

        return new ForwardNodeTrace(
            nodeSnap.layerIndex,
            nodeSnap.nodeIndex,
            activation,
            terms,
            cumulativeSums,
            bias,
            z
        )
    }
}