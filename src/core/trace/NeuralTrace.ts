import type { NodeTrace } from "./NodeTrace"

export class NeuralTrace {

    layers: NodeTrace[][] = []

    addLayerTrace(layer: NodeTrace[]) {
        this.layers.push(layer)
    }

    getLayer(index: number): NodeTrace[] {
        return this.layers[index]
    }

    getLayerCount(): number {
        return this.layers.length
    }
}