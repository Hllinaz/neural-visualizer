import type { NodeTrace } from "./NodeTrace"
import type { TraceType } from "./TraceType"
import type { ConnectionSnapshot } from "../snapshot/NetworkSnapshot"

export class BackwardNodeTrace implements NodeTrace {

    layerIndex: number
    nodeIndex: number

    type: TraceType = "BACKWARD"

    connections: ConnectionSnapshot[]

    propagatedSum: number

    activationDerivative: number
    delta: number
    z: number

    constructor(
        layerIndex: number,
        nodeIndex: number,
        connections: ConnectionSnapshot[],
        propagatedSum: number,
        activationDerivative: number,
        delta: number,
        z: number
    ) {
        this.layerIndex = layerIndex
        this.nodeIndex = nodeIndex
        this.connections = connections
        this.propagatedSum = propagatedSum
        this.activationDerivative = activationDerivative
        this.delta = delta
        this.z = z
    }

    getStepCount(): number {
        return this.connections.length + 3
    }
}