import type { TraceController } from "../trace/TraceController"
import type { NodeVisualState } from "./NodeVisualState"

export function getNodeState(
    layerIndex: number,
    nodeIndex: number,
    totalLayers: number,
    controller: TraceController
): NodeVisualState {

    if (!controller.isReady()) return "FUTURE"
    if (controller.isFinished()) return "COMPLETED"

    const currentNodeTrace = controller.getCurrentNode()

    if (!currentNodeTrace) return "FUTURE"

    const currentLayer = currentNodeTrace?.layerIndex ?? -1
    const currentNode = currentNodeTrace?.nodeIndex ?? -1

    const mode = controller.getMode()
    const type = currentNodeTrace.type

    if (!type) return "FUTURE"

    const logicalLayer =
        type === "FORWARD"
            ? layerIndex 
            : totalLayers - 1 - layerIndex

    const logicalCurrentLayer =
        type === "FORWARD"
            ? currentLayer
            : totalLayers - 1 - currentLayer

    if (logicalLayer < logicalCurrentLayer) return "COMPLETED"
    if (logicalLayer > logicalCurrentLayer) return "FUTURE"

    switch (mode) {

        case "LAYER":
            return "CURRENT"

        case "NODE":

            if (nodeIndex < currentNode) return "COMPLETED"
            if (nodeIndex === currentNode) return "CURRENT"
            return "FUTURE"

        case "TERM":

            if (nodeIndex < currentNode) return "COMPLETED"            
            if (nodeIndex > currentNode) return "FUTURE"

            const termIndex = controller.getTermIndex()
            
            if (termIndex < 0) return "CURRENT"

            return "COMPLETED"
    }

    return "FUTURE"
}