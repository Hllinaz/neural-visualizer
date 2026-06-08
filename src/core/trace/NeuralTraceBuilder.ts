import type { NetworkSnapshot } from "../snapshot/NetworkSnapshot";
import { BackwardNodeTrace } from "./BackwardNodeTrace";
import { DenseForwardTracer } from "./DenseForwardTracer";
import { ForwardNodeTrace } from "./ForwardNodeTrace";
import { NeuralTrace } from "./NeuralTrace";

export class NeuralTraceBuilder {

    private forwardTracer = new DenseForwardTracer()

    trainingTrace(snapshot: NetworkSnapshot): NeuralTrace {

        const trace = new NeuralTrace()

        const forward = this.forwardWithTrace(snapshot)
        const backward = this.backwardWithTrace(snapshot)

        for (const layer of forward.layers) {
            trace.addLayerTrace(layer)
        }

        for (const layer of backward.layers) {
            trace.addLayerTrace(layer)
        }

        return trace
    }

    forwardWithTrace(snapshot: NetworkSnapshot): NeuralTrace {

        const trace = new NeuralTrace()
        const layers = snapshot.layers

        const layerInput = layers[0]
        const inputTrace: ForwardNodeTrace[] = []

        for (let i = 0; i < layerInput.nodes.length; i++) {

            const node = layerInput.nodes[i]

            inputTrace.push(
                new ForwardNodeTrace(
                    0,                  // layerIndex
                    i,                  // nodeIndex
                    node.output     // activation
                )
            )
        }

        // Add input layer to the trace
        trace.addLayerTrace(inputTrace)

        for (let l = 1; l < layers.length; l++) {

            const layerSnap = layers[l]
            const layerTrace: ForwardNodeTrace[] = []

            for (const nodeSnap of layerSnap.nodes) {

                const nodeTrace = this.forwardTracer.computeWithTrace(nodeSnap)
                layerTrace.push(nodeTrace)

            }

            trace.addLayerTrace(layerTrace)
        }

        return trace
    }

    backwardWithTrace(snapshot: NetworkSnapshot): NeuralTrace {

        const trace = new NeuralTrace()

        const layers = snapshot.layers

        for (let l = layers.length - 1; l >= 0; l--) {

            const layerSnap = layers[l]

            const layerTrace: BackwardNodeTrace[] = []

            const isOutputLayer = l === layers.length - 1
            const isInputLayer = l === 0

            for (const nodeSnap of layerSnap.nodes) {

                let runningSum = 0
                const connections = []

                if (!isOutputLayer) {

                    for (const conn of nodeSnap.outgoing) {

                        runningSum += conn.gradient
                        connections.push(conn)
                    }
                }

                const activationDerivative = isInputLayer
                    ? 1
                    : nodeSnap.activationDerivative

                const deltaValue = isInputLayer
                    ? 0
                    : nodeSnap.delta

                const nodeTrace = new BackwardNodeTrace(
                    nodeSnap.layerIndex,
                    nodeSnap.nodeIndex,
                    connections,
                    runningSum,
                    activationDerivative,
                    deltaValue,
                    nodeSnap.z
                )

                layerTrace.push(nodeTrace)
            }

            trace.addLayerTrace(layerTrace)
        }

        return trace
    }
}
