import { Layer } from "./Layer"
import { Node } from "./Node"
import { Connection } from "./Connection"
import type { Activation } from "./ActivationFunction"
import type { LossFunction } from "./LossFunction"
import type { WeightInitializer } from "./WeightInitializer"

interface NeuralNetworkConfig {
    architecture: number[]
    activation: Activation
    loss: LossFunction
    initializer: WeightInitializer
}

export class NeuralNetwork {

    layers: Layer[] = []
    loss: LossFunction
    private initializer: WeightInitializer

    constructor(config: NeuralNetworkConfig) {

        const {
            architecture,
            activation,
            loss,
            initializer
        } = config

        this.loss = loss
        this.initializer = initializer

        for (let i = 0; i < architecture.length; i++) {

            const nodes = []

            for (let j = 0; j < architecture[i]; j++) {
                nodes.push(
                    new Node(
                        i === 0 ? null : activation, 
                        i, j)
                )
            }

            this.layers.push(new Layer(nodes))
        }

        this.connectLayers()
    }

    private connectLayers() {
        for (let l = 0; l < this.layers.length - 1; l++) {

            const current = this.layers[l]
            const next = this.layers[l + 1]

            const fanIn = current.nodes.length
            const fanOut = next.nodes.length

            for (const origin of current.nodes) {
                for (const target of next.nodes) {

                    const weight = this.initializer.initialize(fanIn, fanOut)

                    const conn = new Connection(
                        origin,
                        target,
                        weight
                    )

                    origin.outgoing.push(conn)
                    target.incoming.push(conn)
                }
            }
        }
    }

    forward(inputs: number[]) {

        // Input layer
        for (let i = 0; i < inputs.length; i++) {
            this.layers[0].nodes[i].output = inputs[i]
        }

        // Hidden + Output
        for (let l = 1; l < this.layers.length; l++) {
            for (const node of this.layers[l].nodes) {
                node.forward()
            }
        }
    }

    backward(targets: number[]) {

        const last = this.layers.length - 1
        const outputLayer = this.layers[last]

        // Output layer delta
        for (let i = 0; i < outputLayer.nodes.length; i++) {

            const node = outputLayer.nodes[i]

            const dLoss = this.loss.derivative(node.output, targets[i])
            const dActivation = node.activation
                ? node.activation.derivative(node.z)
                : 1

            node.delta = dLoss * dActivation
        }

        // Hidden layers
        for (let l = last - 1; l > 0; l--) {

            let layer = this.layers[l]

            for (const node of layer.nodes) {

                let sum = 0

                for (const c of node.outgoing) {
                    sum += c.weight * c.target.delta
                }

                const dActivation = node.activation
                    ? node.activation.derivative(node.z)
                    : 1

                node.delta = sum * dActivation
            }
        }

        // Gradients
        for (let l = 0; l < this.layers.length - 1; l++) {

            for (const node of this.layers[l].nodes) {

                for (const c of node.outgoing) {
                    c.gradient = node.output * c.target.delta
                }
            }
        }
    }

    applyGradients(lr: number) {
        for (const layer of this.layers) {
            for (const node of layer.nodes) {
                node.bias -= lr * node.delta

                for (const c of node.outgoing) {
                    c.weight -= lr * c.gradient
                }
            }
        }
    }
}