import type { TraceType } from "./TraceType"

export interface NodeTrace {
    layerIndex: number
    nodeIndex: number
    
    type: TraceType

    getStepCount(): number
}