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
    const latestLoss = data[data.length - 1]?.loss

    return (
        <section className="loss-chart-panel">
            <div className="loss-chart-header">
                <h2>Loss</h2>
                <span>
                    {latestLoss === undefined
                        ? "Epoch 0"
                        : `Epoch ${data.length} · ${formatLoss(latestLoss)}`}
                </span>
            </div>

            <div className="loss-chart-body">
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
                                left: -18
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
                                width={52}
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
