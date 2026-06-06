import type { AnimationMode } from "./AnimationMode"
import type { NeuralTrace } from "./NeuralTrace"
import type { NodeTrace } from "./NodeTrace"

export class TraceCursor {

    private trace: NeuralTrace

    private layerIndex = 0
    private nodeIndex = 0
    private termIndex = -1

    constructor(trace: NeuralTrace) {
        this.trace = trace
    }

    advance(mode: AnimationMode) {
        switch (mode) {
            case "TERM":
                this.advanceTerm()
                break;
            case "NODE":
                this.advanceNode()
                break;
            case "LAYER":
                this.advanceLayer()
                break;
        }
    }

    private advanceTerm() {
        const node = this.getCurrentNode()
        if (!node) return

        if (this.termIndex < node.getStepCount() - 1) {
            this.termIndex++
        } else {
            this.advanceNode()
        }
    }

    private advanceNode() {
        const layer = this.trace.layers[this.layerIndex]
        if (!layer) return

        if (this.nodeIndex < layer.length - 1) {
            this.nodeIndex++
        } else {
            this.nodeIndex = 0
            this.advanceLayer()
        }

        this.termIndex = -1
    }

    private advanceLayer() {
        if (this.layerIndex < this.trace.layers.length) {
            this.layerIndex++
            this.nodeIndex = 0
            this.termIndex = -1
        }
    }

    getLayerIndex() { return this.layerIndex }
    getNodeIndex() { return this.nodeIndex }
    getTermIndex() { return this.termIndex }

    getCurrentNode(): NodeTrace | null {
        if (this.nodeIndex < 0) return null
        const layer = this.trace.layers[this.layerIndex]
        return layer?.[this.nodeIndex] ?? null
    }

    isFinished(): boolean {
        const node = this.getCurrentNode()
        if (!node) return true

        const lastLayer = this.trace.layers.length - 1
        const lastNode = this.trace.layers[this.layerIndex].length - 1
        const lastStep = node.getStepCount() - 1

        return (
            this.layerIndex === lastLayer &&
            this.nodeIndex === lastNode &&
            this.termIndex >= lastStep
        )
    }
}