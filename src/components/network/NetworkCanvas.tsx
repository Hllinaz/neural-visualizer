import { useEffect, useRef, useState } from "react"
import { getNodeState } from "../../core/visual/getNodeState" 
import { getConnectionState } from "../../core/visual/getConnectionState"
import { BackwardNodeTrace } from "../../core/trace/BackwardNodeTrace"
import { ForwardNodeTrace } from "../../core/trace/ForwardNodeTrace"
import type { TraceController } from "../../core/trace/TraceController"
import type { NodeSnapshot } from "../../core/snapshot/NetworkSnapshot"
import type {
    ConnectionSnapshot,
    NetworkSnapshot
} from "../../core/snapshot/NetworkSnapshot"

import { THEME } from "../../theme/theme"

import "./NetworkCanvas.css"

interface Props {
    snapshot: NetworkSnapshot
    controller: TraceController
    selectedWeightId: string
    selectedWeightValue: number
    onSelectedWeightChange: (value: string) => void
    onWeightValueChange: (value: number) => void
    canEditWeights: boolean
    inputs: number[]
    outputs: number[]
    onInputChange: (index: number, value: number) => void
    onOutputChange: (index: number, value: number) => void
}

export function NetworkCanvas({
    snapshot,
    controller,
    selectedWeightId,
    selectedWeightValue,
    onSelectedWeightChange,
    onWeightValueChange,
    canEditWeights,
    inputs,
    outputs,
    onInputChange,
    onOutputChange
}: Props) {

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

    useEffect(() => {

        const canvas = canvasRef.current

        if (!canvas) return

        const ctx = canvas.getContext("2d")

        if (!ctx) return

        const parent = canvas.parentElement

        if (!parent) return

        const pixelRatio = window.devicePixelRatio || 1
        const displayWidth = parent.clientWidth
        const displayHeight = parent.clientHeight

        setCanvasSize({
            width: displayWidth,
            height: displayHeight
        })

        canvas.width = displayWidth * pixelRatio
        canvas.height = displayHeight * pixelRatio

        canvas.style.width = `${displayWidth}px`
        canvas.style.height = `${displayHeight}px`

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

        drawNetwork(
            ctx,
            displayWidth,
            displayHeight,
            snapshot,
            controller,
            selectedWeightId
        )

    }, [snapshot, controller, selectedWeightId])

    const editorPosition = getConnectionEditorPosition(
        snapshot,
        selectedWeightId,
        canvasSize.width,
        canvasSize.height
    )

    return (
        <div className="network-canvas-frame">
            <canvas
                ref={canvasRef}
                className="network-canvas can-select-weights"
                onClick={(event) => {
                    const canvas = canvasRef.current

                    if (!canvas) return

                    const rect = canvas.getBoundingClientRect()
                    const x = event.clientX - rect.left
                    const y = event.clientY - rect.top
                    const connectionId = findConnectionAtPoint(
                        snapshot,
                        x,
                        y,
                        rect.width,
                        rect.height
                    )

                    if (connectionId) {
                        onSelectedWeightChange(connectionId)
                    }
                }}
            />

            {editorPosition && (
                <div
                    className={
                        canEditWeights
                            ? "canvas-weight-editor"
                            : "canvas-weight-editor read-only"
                    }
                    style={{
                        left: editorPosition.x,
                        top: editorPosition.y
                    }}
                >
                    <span>w</span>
                    <input
                        type="number"
                        step="0.01"
                        disabled={!canEditWeights}
                        value={Number.isFinite(selectedWeightValue)
                            ? selectedWeightValue
                            : 0}
                        onChange={(event) => {
                            const value = event.target.valueAsNumber

                            if (Number.isFinite(value)) {
                                onWeightValueChange(value)
                            }
                        }}
                    />
                </div>
            )}

            <SamplePanel
                inputs={inputs}
                outputs={outputs}
                onInputChange={onInputChange}
                onOutputChange={onOutputChange}
            />
        </div>
    )
}

interface SamplePanelProps {
    inputs: number[]
    outputs: number[]
    onInputChange: (index: number, value: number) => void
    onOutputChange: (index: number, value: number) => void
}

function SamplePanel({
    inputs,
    outputs,
    onInputChange,
    onOutputChange
}: SamplePanelProps) {
    return (
        <div className="canvas-sample-panel">
            <div className="sample-panel-header">
                <strong>Sample</strong>
            </div>

            <div className="sample-panel-group">
                <span className="sample-panel-label">Inputs</span>

                <div className="sample-value-grid">
                    {inputs.map((value, index) => (
                        <label key={index} className="sample-value-cell">
                            <span>x{index}</span>
                            <input
                                type="number"
                                step="0.01"
                                value={value}
                                onChange={(event) => {
                                    const nextValue = event.target.valueAsNumber

                                    if (Number.isFinite(nextValue)) {
                                        onInputChange(index, nextValue)
                                    }
                                }}
                            />
                        </label>
                    ))}
                </div>
            </div>

            <div className="sample-panel-group">
                <span className="sample-panel-label">Target</span>

                <div className="sample-value-grid">
                    {outputs.map((value, index) => (
                        <label key={index} className="sample-value-cell">
                            <span>y{index}</span>
                            <input
                                type="number"
                                step="0.01"
                                value={value}
                                onChange={(event) => {
                                    const nextValue = event.target.valueAsNumber

                                    if (Number.isFinite(nextValue)) {
                                        onOutputChange(index, nextValue)
                                    }
                                }}
                            />
                        </label>
                    ))}
                </div>
            </div>
        </div>
    )
}

function drawNetwork(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    snapshot: NetworkSnapshot,
    controller: TraceController,
    selectedWeightId: string
) {

    ctx.clearRect(0, 0, width, height)

    ctx.fillStyle = THEME.background

    ctx.fillRect(0, 0, width, height)

    drawLayerLabels(ctx, width, height, snapshot)

    drawConnections(ctx, width, height, snapshot, controller, selectedWeightId)

    drawNodes(ctx, width, height, snapshot, controller)

    drawActiveNodeCard(ctx, width, height, snapshot, controller)

    drawLegend(ctx, width, height)
}

function drawLayerLabels(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    snapshot: NetworkSnapshot
) {
    const structure = snapshot.layers.map(layer => layer.nodes.length)

    ctx.save()
    ctx.font = "600 12px Inter"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    for (const layer of snapshot.layers) {
        const { x } = getNodePosition(
            width,
            height,
            structure,
            layer.layerIndex,
            0
        )

        const label = layer.layerIndex === 0
            ? "Input"
            : layer.layerIndex === snapshot.layers.length - 1
                ? "Output"
                : `Hidden ${layer.layerIndex}`

        drawPill(ctx, label, x, 28, "#ffffff", "#cbd5e1", "#334155")
    }

    ctx.restore()
}

function drawNodes(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    snapshot: NetworkSnapshot,
    controller: TraceController
) {

    const structure = snapshot.layers.map(layer => layer.nodes.length)

    for (const layer of snapshot.layers) {

        for (const node of layer.nodes) {

            const { x, y } = getNodePosition(
                width,
                height,
                structure,
                node.layerIndex,
                node.nodeIndex
            )

            drawNode(
                ctx,
                x,
                y,
                node,
                controller,
                snapshot.layers.length
            )
        }
    }
}

function drawNode(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    node: NodeSnapshot,
    controller: TraceController,
    totalLayers: number
) {

    const state = getNodeState(
        node.layerIndex,
        node.nodeIndex,
        totalLayers,
        controller
    )

    let fill = THEME.node.idle
    let radius = 22
    let border = THEME.node.border
    let shadow = 0

    switch (state) {

        case "CURRENT":
            fill = THEME.node.active
            radius = 26
            border = "#ffffff"
            shadow = 12
            break

        case "COMPLETED":
            fill = THEME.node.completed
            break
    }

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = fill
    ctx.shadowColor = THEME.connection.activeGlow
    ctx.shadowBlur = shadow
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = border
    ctx.lineWidth = 1.5
    ctx.stroke()

    if (state !== "FUTURE") {

        ctx.fillStyle = state === "CURRENT"
            ? "#ffffff"
            : THEME.node.text

        ctx.font = state === "CURRENT"
            ? "700 12px Inter"
            : "600 11px Inter"

        ctx.textAlign = "center"

        ctx.textBaseline = "middle"

        ctx.fillText(
            formatShort(node.output),
            x,
            y
        )

        if (state === "CURRENT") {
            drawNodeValueBadges(ctx, x, y, radius, node)
        }
    }
}

function drawNodeValueBadges(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    node: NodeSnapshot
) {
    const top = y + radius + 14

    drawPill(
        ctx,
        `z ${formatShort(node.z)}`,
        x,
        top,
        "#eef6ff",
        "#bfdbfe",
        "#1d4ed8"
    )

    if (node.layerIndex > 0) {
        drawPill(
            ctx,
            `b ${formatShort(node.bias)}`,
            x,
            top + 24,
            "#fff7ed",
            "#fed7aa",
            "#c2410c"
        )
    }

    if (Math.abs(node.delta) > 0.0005) {
        drawPill(
            ctx,
            `δ ${formatShort(node.delta)}`,
            x,
            top + 48,
            "#fdf2f8",
            "#fbcfe8",
            "#be185d"
        )
    }
}

function drawConnections(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    snapshot: NetworkSnapshot,
    controller: TraceController,
    selectedWeightId: string
) {

    const structure = snapshot.layers.map(layer => layer.nodes.length)

    for (const layer of snapshot.layers) {

        for (const origin of layer.nodes) {

            const {
                x: originX,
                y: originY
            } = getNodePosition(
                width,
                height,
                structure,
                origin.layerIndex,
                origin.nodeIndex
            )

            for (const conn of origin.outgoing) {
                const connId = connectionId(
                    conn.sourceLayer,
                    conn.sourceNode,
                    conn.targetLayer,
                    conn.targetNode
                )

                const isSelected = connId === selectedWeightId

                const {
                    x: targetX,
                    y: targetY
                } = getNodePosition(
                    width,
                    height,
                    structure,
                    conn.targetLayer,
                    conn.targetNode
                )

                const state = getConnectionState(
                    conn.targetLayer,
                    conn.targetNode,
                    conn,
                    snapshot.layers.length,
                    controller
                )

                const absWeight = Math.abs(conn.weight)

                const intensity = Math.min(absWeight, 1)

                let color = conn.weight >= 0
                    ? THEME.connection.positive
                    : THEME.connection.negative

                if (state === "FUTURE") {
                    color = THEME.connection.inactive
                }

                const gradient = ctx.createLinearGradient(
                    originX,
                    originY,
                    targetX,
                    targetY
                )

                gradient.addColorStop(0, `${color}66`)

                gradient.addColorStop(1, color)

                ctx.beginPath()

                ctx.moveTo(originX, originY)

                ctx.lineTo(targetX, targetY)

                ctx.strokeStyle = gradient

                ctx.lineWidth = isSelected
                    ? 5
                    : state === "ACTIVE"
                    ? 2 + intensity * 3
                    : 1.5

                if (state === "ACTIVE" || isSelected) {

                    ctx.shadowColor =
                        THEME.connection.activeGlow

                    ctx.shadowBlur = isSelected ? 10 : 4
                }

                ctx.globalAlpha = state === "FUTURE"
                    ? 0.25
                    : 0.9

                ctx.stroke()

                ctx.shadowBlur = 0

                ctx.globalAlpha = 1

                if (state === "ACTIVE" && controller.getMode() !== "LAYER") {
                    drawConnectionLabel(
                        ctx,
                        originX,
                        originY,
                        targetX,
                        targetY,
                        conn,
                        controller
                    )
                }

                if (isSelected) {
                    drawPill(
                        ctx,
                        `w ${formatShort(conn.weight)}`,
                        originX + (targetX - originX) * 0.5,
                        originY + (targetY - originY) * 0.5 + 14,
                        "#ffffff",
                        "#2563eb",
                        "#1d4ed8"
                    )
                }
            }
        }
    }
}

function drawConnectionLabel(
    ctx: CanvasRenderingContext2D,
    originX: number,
    originY: number,
    targetX: number,
    targetY: number,
    conn: ConnectionSnapshot,
    controller: TraceController
) {
    const x = originX + (targetX - originX) * 0.5
    const y = originY + (targetY - originY) * 0.5
    const trace = controller.getCurrentNode()

    const label = trace instanceof BackwardNodeTrace
        ? `∂L/∂w ${formatShort(conn.gradient)}`
        : `w ${formatShort(conn.weight)}`

    const fill = trace instanceof ForwardNodeTrace
        ? "#eff6ff"
        : "#fff1f2"

    const stroke = trace instanceof ForwardNodeTrace
        ? "#93c5fd"
        : "#fda4af"

    const text = trace instanceof ForwardNodeTrace
        ? "#1d4ed8"
        : "#be123c"

    drawPill(ctx, label, x, y - 12, fill, stroke, text)
}

function drawActiveNodeCard(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    snapshot: NetworkSnapshot,
    controller: TraceController
) {
    const trace = controller.getCurrentNode()
    if (!trace) return

    const node = snapshot.layers
        .flatMap(layer => layer.nodes)
        .find(item =>
            item.layerIndex === trace.layerIndex
            && item.nodeIndex === trace.nodeIndex
        )

    if (!node) return

    const cardWidth = 210
    const cardHeight = 116
    const x = width - cardWidth - 18
    const y = 18

    ctx.save()
    ctx.fillStyle = "rgba(255,255,255,0.94)"
    ctx.strokeStyle = "#dbe3ef"
    ctx.lineWidth = 1
    roundRect(ctx, x, y, cardWidth, cardHeight, 8)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = "#0f172a"
    ctx.font = "700 13px Inter"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    ctx.fillText(
        `Layer ${node.layerIndex} · Node ${node.nodeIndex}`,
        x + 14,
        y + 12
    )

    ctx.font = "500 12px Inter"
    ctx.fillStyle = "#475569"
    ctx.fillText(`a = ${formatValue(node.output)}`, x + 14, y + 38)
    ctx.fillText(`z = ${formatValue(node.z)}`, x + 14, y + 58)
    ctx.fillText(`b = ${formatValue(node.bias)}`, x + 14, y + 78)
    ctx.fillText(`δ = ${formatValue(node.delta)}`, x + 112, y + 58)
    ctx.fillText(`loss = ${formatValue(node.loss)}`, x + 112, y + 78)
    ctx.restore()
}

function drawLegend(
    ctx: CanvasRenderingContext2D,
    _width: number,
    height: number
) {
    const x = 18
    const y = height - 52

    ctx.save()
    ctx.font = "600 11px Inter"
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"

    drawLegendItem(ctx, x, y, THEME.connection.positive, "peso +")
    drawLegendItem(ctx, x + 82, y, THEME.connection.negative, "peso -")
    drawLegendItem(ctx, x + 164, y, THEME.node.active, "actual")

    ctx.restore()
}

function drawLegendItem(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    label: string
) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x + 6, y, 5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "#475569"
    ctx.fillText(label, x + 16, y)
}

function drawPill(
    ctx: CanvasRenderingContext2D,
    text: string,
    centerX: number,
    centerY: number,
    fill: string,
    stroke: string,
    color: string
) {
    ctx.save()
    ctx.font = "700 11px Inter"
    const paddingX = 8
    const width = ctx.measureText(text).width + paddingX * 2
    const height = 20
    const x = centerX - width / 2
    const y = centerY - height / 2

    ctx.fillStyle = fill
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1
    roundRect(ctx, x, y, width, height, 7)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = color
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(text, centerX, centerY + 0.5)
    ctx.restore()
}

function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
}

function formatShort(value: number) {
    const normalized = Math.abs(value) < 0.005 ? 0 : value
    return normalized.toFixed(2)
}

function formatValue(value: number) {
    const normalized = Math.abs(value) < 0.00005 ? 0 : value
    return normalized.toFixed(4)
}

function getConnectionEditorPosition(
    snapshot: NetworkSnapshot,
    selectedWeightId: string,
    width: number,
    height: number
) {
    if (!selectedWeightId || width <= 0 || height <= 0) return null

    const connection = findConnectionById(snapshot, selectedWeightId)
    if (!connection) return null

    const structure = snapshot.layers.map(layer => layer.nodes.length)
    const origin = getNodePosition(
        width,
        height,
        structure,
        connection.sourceLayer,
        connection.sourceNode
    )
    const target = getNodePosition(
        width,
        height,
        structure,
        connection.targetLayer,
        connection.targetNode
    )

    return {
        x: origin.x + (target.x - origin.x) * 0.5,
        y: origin.y + (target.y - origin.y) * 0.5 - 46
    }
}

function findConnectionAtPoint(
    snapshot: NetworkSnapshot,
    x: number,
    y: number,
    width: number,
    height: number
) {
    const structure = snapshot.layers.map(layer => layer.nodes.length)
    let closestId = ""
    let closestDistance = Number.POSITIVE_INFINITY

    for (const layer of snapshot.layers) {
        for (const node of layer.nodes) {
            const origin = getNodePosition(
                width,
                height,
                structure,
                node.layerIndex,
                node.nodeIndex
            )

            for (const conn of node.outgoing) {
                const target = getNodePosition(
                    width,
                    height,
                    structure,
                    conn.targetLayer,
                    conn.targetNode
                )
                const distance = distanceToSegment(
                    x,
                    y,
                    origin.x,
                    origin.y,
                    target.x,
                    target.y
                )

                if (distance < closestDistance) {
                    closestDistance = distance
                    closestId = connectionId(
                        conn.sourceLayer,
                        conn.sourceNode,
                        conn.targetLayer,
                        conn.targetNode
                    )
                }
            }
        }
    }

    return closestDistance <= 12 ? closestId : ""
}

function findConnectionById(
    snapshot: NetworkSnapshot,
    selectedWeightId: string
) {
    for (const layer of snapshot.layers) {
        for (const node of layer.nodes) {
            const connection = node.outgoing.find(conn =>
                connectionId(
                    conn.sourceLayer,
                    conn.sourceNode,
                    conn.targetLayer,
                    conn.targetNode
                ) === selectedWeightId
            )

            if (connection) return connection
        }
    }

    return null
}

function distanceToSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
) {
    const dx = x2 - x1
    const dy = y2 - y1
    const lengthSquared = dx * dx + dy * dy

    if (lengthSquared === 0) {
        return Math.hypot(px - x1, py - y1)
    }

    const t = Math.max(
        0,
        Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared)
    )

    const closestX = x1 + t * dx
    const closestY = y1 + t * dy

    return Math.hypot(px - closestX, py - closestY)
}

function connectionId(
    sourceLayer: number,
    sourceNode: number,
    targetLayer: number,
    targetNode: number
) {
    return `${sourceLayer}:${sourceNode}:${targetLayer}:${targetNode}`
}

function getNodePosition(
    width: number,
    height: number,
    layers: number[],
    layerIndex: number,
    nodeIndex: number
) {

    const horizontalSpacing = width / (layers.length + 1)
    const x = horizontalSpacing * (layerIndex + 1)

    const nodeCount = layers[layerIndex]
    const verticalSpacing = height / (nodeCount + 1)
    const y = verticalSpacing * (nodeIndex + 1)

    return { x, y }
}
