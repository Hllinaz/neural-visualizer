export interface VisualizationStats {
    maxActivation: number
    maxDelta: number
    maxWeight: number
    maxGradient: number
    maxError: number
}

export interface NetworkSnapshot {
    layers: LayerSnapshot[]
    stats: VisualizationStats
}

export interface LayerSnapshot {
    layerIndex: number
    nodes: NodeSnapshot[]
}

export interface NodeSnapshot {
    layerIndex: number
    nodeIndex: number

    isOutputLayer: boolean

    output: number
    z: number
    bias: number
    delta: number

    error: number
    loss: number

    activationDerivative: number

    outgoing: ConnectionSnapshot[]
    ingoing: ConnectionSnapshot[]
}

export interface ConnectionSnapshot {
    sourceIndex: number
    targetIndex: number

    sourceLayer: number
    targetLayer: number

    sourceNode: number
    targetNode: number

    weight: number
    gradient: number

    targetDelta: number
    sourceActivation: number
}