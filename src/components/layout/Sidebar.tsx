import type { AnimationMode } from "../../core/trace/AnimationMode"
import { Sigmoid, ReLU } from "../../core/neural/ActivationFunction"
import { MSE } from "../../core/neural/LossFunction"
import { HeInitializer, XavierInitializer } from "../../core/neural/WeightInitializer"

export const ACTIVATIONS = {
    sigmoid: Sigmoid,
    relu: ReLU,
}

export const LOSSES = {
    mse: MSE,
}

export const INITIALIZERS = {
    he: HeInitializer,
    xavier: XavierInitializer
}

import "./Sidebar.css"

export interface WeightOption {
    id: string
    label: string
    weight: number
}

interface Props {
    mode: AnimationMode

    onModeChange: (mode: AnimationMode) => void
    onStep: () => void
    onReset: () => void

    learningRate: number
    onLearningRateChange: (value: number) => void

    architecture: string
    onArchitectureChange: (value: string) => void

    activation: string
    onActivationChange: (value: string) => void

    loss: string
    onLossChange: (value: string) => void

    initializer: string
    onInitializerChange: (value: string) => void

    weightOptions: WeightOption[]
    selectedWeightId: string
    selectedWeightValue: number
    onSelectedWeightChange: (value: string) => void
    onWeightValueChange: (value: number) => void
    canEditWeights: boolean
}

export function Sidebar({
    mode, onModeChange, onStep,
    onReset, learningRate, onLearningRateChange,
    architecture, onArchitectureChange,
    activation, onActivationChange,
    loss, onLossChange,
    initializer, onInitializerChange,
    weightOptions,
    selectedWeightId,
    selectedWeightValue,
    onSelectedWeightChange,
    onWeightValueChange,
    canEditWeights
}: Props) {

    return (

        <aside className="sidebar">

            <div className="sidebar-section">

                <h3>Network</h3>

                <label>Architecture</label>

                <input value={architecture} onChange={(e) => onArchitectureChange(e.target.value)} />

                <div className="sidebar-field">
                    <label>Activation</label>

                    <select value={activation} onChange={(e) => onActivationChange(e.target.value)}>
                        {Object.keys(ACTIVATIONS)
                            .map(key => (
                                <option key={key} value={key}>
                                    {key}
                                </option>
                            ))
                        }
                    </select>
                </div>

                <div className="sidebar-field">
                    <label>Loss</label>

                    <select value={loss} onChange={(e) => onLossChange(e.target.value)}>
                        {Object.keys(LOSSES)
                            .map(key => (
                                <option key={key} value={key}>
                                    {key}
                                </option>
                            ))
                        }
                    </select>
                </div>


                <div className="sidebar-field">
                    <label>Initializer</label>

                    <select value={initializer} onChange={(e) => onInitializerChange(e.target.value)}>
                        {Object.keys(INITIALIZERS)
                            .map(key => (
                                <option key={key} value={key}>
                                    {key}
                                </option>
                            ))
                        }
                    </select>
                </div>

            </div>

            <div className="sidebar-section">

                <h3>Weights</h3>

                <div className="sidebar-field">
                    <label>Connection</label>

                    <select
                        value={selectedWeightId}
                        onChange={(e) => onSelectedWeightChange(e.target.value)}
                    >
                        {weightOptions.map(option => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="sidebar-field">
                    <label>Initial Weight</label>

                    <input
                        type="number"
                        step="0.01"
                        disabled={!canEditWeights}
                        value={Number.isFinite(selectedWeightValue)
                            ? selectedWeightValue
                            : 0}
                        onChange={(e) => {
                            const value = e.target.valueAsNumber

                            if (Number.isFinite(value)) {
                                onWeightValueChange(value)
                            }
                        }}
                    />
                </div>

                <p className="sidebar-hint">
                    {canEditWeights
                        ? "Edita el peso antes de iniciar la red."
                        : "Puedes seleccionar pesos para inspeccionarlos. Usa Reset para volver a editarlos."}
                </p>

            </div>

            <div className="sidebar-section">

                <h3>Training</h3>

                <div className="sidebar-field">
                    <label>Learning Rate</label>

                    <input
                        type="number"
                        step="0.01"
                        value={learningRate}
                        onChange={(e) => onLearningRateChange(Number(e.target.value))}
                    />
                </div>
            </div>

            <div className="sidebar-section">

                <h3>Visualization</h3>

                <div className="mode-button">

                    <button
                        className={
                            mode === "LAYER"
                                ? "active" : ""
                        }
                        onClick={() => onModeChange("LAYER")}
                    > Layer </button>

                    <button
                        className={
                            mode === "NODE"
                                ? "active" : ""
                        }
                        onClick={() => onModeChange("NODE")}
                    > Node </button>

                    <button
                        className={
                            mode === "TERM"
                                ? "active" : ""
                        }
                        onClick={() => onModeChange("TERM")}
                    > Term </button>

                </div>
            </div>

            <div className="sidebar-section">

                <h3>Playback</h3>

                <div className="playback-buttons">

                    <button onClick={onStep}>Step</button>

                    <button className="secondary" onClick={onReset}>Reset</button>

                </div>
            </div>
        </aside>
    )
}
