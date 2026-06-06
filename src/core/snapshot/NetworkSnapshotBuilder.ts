import type { NeuralNetwork } from "../neural/NeuralNetwork"

import type {
    NetworkSnapshot,
    LayerSnapshot,
    NodeSnapshot,
    ConnectionSnapshot,
    VisualizationStats
} from "./NetworkSnapshot"

export class NetworkSnapshotBuilder {

    static build(net: NeuralNetwork, targets?: number[]): NetworkSnapshot {

        let stats: VisualizationStats = {
            maxActivation: 0,
            maxDelta: 0,
            maxError: 0,
            maxGradient: 0,
            maxWeight: 0
        };

        const layers = net.layers
        const snapshotLayers: LayerSnapshot[] = []

        for (let l = 0; l < layers.length; l++) {

            const layer = layers[l]
            const nodeSnapshots: NodeSnapshot[] = []

            const isOutputLayer = l == layers.length - 1

            for (let n = 0; n < layer.nodes.length; n++) {

                const node = layer.nodes[n]

                let error = 0
                let loss = 0

                if (isOutputLayer && targets && targets[n] !== undefined) {
                    const lossFn = net.loss;
                    error = lossFn.derivative(node.output, targets[n])
                    loss = lossFn.compute(node.output, targets[n])
                }

                stats.maxActivation = Math.max(stats.maxActivation, Math.abs(node.output));
                stats.maxDelta = Math.max(stats.maxDelta, Math.abs(node.delta));
                stats.maxError = Math.max(stats.maxError, Math.abs(error))

                nodeSnapshots.push({
                    layerIndex: l,
                    nodeIndex: n,
                    isOutputLayer: isOutputLayer,
                    output: node.output,
                    z: node.z,
                    bias: node.bias,
                    delta: node.delta,
                    error: error,
                    loss: loss,
                    activationDerivative:
                        node.activation
                            ? node.activation.derivative(node.z)
                            : 1,
                    outgoing: [],
                    ingoing: []
                })
            }

            snapshotLayers.push({
                layerIndex: l,
                nodes: nodeSnapshots
            })
        }

        for (let l = 0; l < layers.length; l++) {

            const layer = layers[l];

            for (let n = 0; n < layer.nodes.length; n++) {

                const node = layer.nodes[n];
                const sourceSnap = snapshotLayers[l].nodes[n]

                let connectionIndex = 0

                for (const conn of node.outgoing) {

                    const targetLayer = conn.target.layerIndex
                    const targetNode = conn.target.nodeIndex

                    const targetSnap =
                        snapshotLayers[targetLayer].nodes[targetNode]

                    const targetIndex = targetSnap.ingoing.length

                    stats.maxWeight = Math.max(stats.maxWeight, Math.abs(conn.weight));
                    stats.maxGradient = Math.max(stats.maxGradient, Math.abs(conn.gradient));

                    const connSnap: ConnectionSnapshot = {
                        sourceIndex: connectionIndex,
                        targetIndex,
                        sourceLayer: node.layerIndex,
                        sourceNode: node.nodeIndex,
                        targetLayer,
                        targetNode,
                        weight: conn.weight,
                        gradient: conn.gradient,
                        targetDelta: conn.target.delta,
                        sourceActivation: node.output
                    }

                    sourceSnap.outgoing.push(connSnap)
                    targetSnap.ingoing.push(connSnap)

                    connectionIndex++
                }

            }
        }

        return { layers: snapshotLayers, stats }

    }
}