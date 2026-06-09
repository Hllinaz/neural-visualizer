import { useRef } from "react"
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts"

import "./LossChart.css"

export interface LossPoint {
    epoch: number
    loss: number
}

interface Props {
    data: LossPoint[]
}

export function LossChart({ data }: Props) {
    const chartRef = useRef<HTMLDivElement | null>(null)
    const latestLoss = data[data.length - 1]?.loss

    const handleDownloadChart = () => {
        const svg = chartRef.current?.querySelector("svg")

        if (!svg || data.length === 0) return

        const clone = svg.cloneNode(true) as SVGSVGElement
        const { width, height } = svg.getBoundingClientRect()

        clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
        clone.setAttribute("width", String(Math.ceil(width)))
        clone.setAttribute("height", String(Math.ceil(height)))
        clone.setAttribute("viewBox", `0 0 ${Math.ceil(width)} ${Math.ceil(height)}`)

        const background = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        background.setAttribute("width", "100%")
        background.setAttribute("height", "100%")
        background.setAttribute("fill", "#ffffff")
        clone.insertBefore(background, clone.firstChild)

        const svgText = new XMLSerializer().serializeToString(clone)
        const blob = new Blob([svgText], {
            type: "image/svg+xml;charset=utf-8"
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")

        link.href = url
        link.download = "loss_chart.svg"
        link.click()

        URL.revokeObjectURL(url)
    }

    return (
        <section className="loss-chart-panel">
            <div className="loss-chart-header">
                <h2>Loss</h2>
                <div className="loss-chart-actions">
                    <span>
                        {latestLoss === undefined
                            ? "Epoch 0"
                            : `Epoch ${data.length} · ${formatLoss(latestLoss)}`}
                    </span>
                    <button
                        type="button"
                        className="loss-chart-download"
                        aria-label="Download loss chart"
                        title="Download loss chart"
                        disabled={data.length === 0}
                        onClick={handleDownloadChart}
                    >
                        ↓
                    </button>
                </div>
            </div>

            <div className="loss-chart-body" ref={chartRef}>
                {data.length === 0 ? (
                    <div className="loss-chart-empty">
                        No epochs yet
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{
                                top: 8,
                                right: 12,
                                bottom: 0,
                                left: 6
                            }}
                        >
                            <CartesianGrid
                                stroke="#e5e7eb"
                                strokeDasharray="3 3"
                            />
                            <XAxis
                                dataKey="epoch"
                                tick={{ fontSize: 11, fill: "#64748b" }}
                                tickLine={false}
                                axisLine={{ stroke: "#cbd5e1" }}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: "#64748b" }}
                                tickLine={false}
                                axisLine={{ stroke: "#cbd5e1" }}
                                width={58}
                                tickFormatter={formatLoss}
                            />
                            <Tooltip
                                formatter={(value) => [
                                    formatLoss(Number(value)),
                                    "Loss"
                                ]}
                                labelFormatter={(value) => `Epoch ${value}`}
                            />
                            <Line
                                type="monotone"
                                dataKey="loss"
                                stroke="#2563eb"
                                strokeWidth={2}
                                dot={{ r: 3, fill: "#2563eb" }}
                                activeDot={{ r: 5 }}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </section>
    )
}

function formatLoss(value: number) {
    if (Math.abs(value) >= 100) {
        return value.toFixed(1)
    }

    if (Math.abs(value) >= 1) {
        return value.toFixed(3)
    }

    return value.toFixed(5)
}
