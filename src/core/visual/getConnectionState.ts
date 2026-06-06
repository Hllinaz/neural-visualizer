import type { ConnectionSnapshot } from "../snapshot/NetworkSnapshot"
import type { TraceController } from "../trace/TraceController"
import type { ConnectionVisualState } from "./ConnectionVisualState"

export function getConnectionState(
    layerIndex: number,
    nodeIndex: number,
    connection: ConnectionSnapshot,
    totalLayers: number,
    controller: TraceController
): ConnectionVisualState {

    if (!controller.isReady()) return "FUTURE"
    if (controller.isFinished()) return "USED"

    const currentNodeTrace = controller.getCurrentNode()
    if (!currentNodeTrace) return "FUTURE"

    const currentLayer = currentNodeTrace.layerIndex
    const currentNode = currentNodeTrace.nodeIndex
    const currentTerm = controller.getTermIndex()

    const mode = controller.getMode()
    const type = currentNodeTrace.type

    if (!type) return "FUTURE"

    const logicalLayer =
        type === "FORWARD"
            ? layerIndex
            : totalLayers - layerIndex - 1

    const logicalCurrentLayer =
        type === "FORWARD"
            ? currentLayer
            : totalLayers - currentLayer - 2

    if (logicalLayer < logicalCurrentLayer) return "USED"
    if (logicalLayer > logicalCurrentLayer) return "FUTURE"

    const connectionIndex =
        type === "FORWARD"
        ? connection.targetIndex
        : connection.sourceIndex

    const relevantNodeIndex =
        type === "FORWARD"
        ? nodeIndex
        : connection.sourceNode

    switch (mode) {

        case "LAYER":
            return "ACTIVE"

        case "NODE":

            if (relevantNodeIndex < currentNode) return "USED"
            if (relevantNodeIndex === currentNode) return "ACTIVE"
            return "FUTURE"

        case "TERM":

            if (relevantNodeIndex < currentNode) return "USED"
            if (relevantNodeIndex > currentNode) return "FUTURE"

            if (currentTerm < 0) return "FUTURE"

            if (connectionIndex < currentTerm) return "USED"
            if (connectionIndex === currentTerm) return "ACTIVE"

            return "FUTURE"
    }
}