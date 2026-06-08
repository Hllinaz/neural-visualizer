import type { AnimationMode } from "../../core/trace/AnimationMode"
import { Sigmoid, ReLU } from "../../core/neural/ActivationFunction"
import { MSE } from "../../core/neural/LossFunction"
import {
    CustomInitializer,
    HeInitializer,
    XavierInitializer
} from "../../core/neural/WeightInitializer"

export const ACTIVATIONS = {
    sigmoid: Sigmoid,
    relu: ReLU,
}

export const LOSSES = {
    mse: MSE,
}

export const INITIALIZERS = {
    he: HeInitializer,
    xavier: XavierInitializer,
    custom: CustomInitializer
}

const AUTHORS = [
    {
        name: "Humberto J. Llinas M.",
        email: "lhumberto@uninorte.edu.co"
    },
    {
        name: "Dr. rer. nat. Humberto J. Llinas S.",
        email: "hllinas@uninorte.edu.co"
    }
]

import "./Sidebar.css"

export interface WeightOption {
    id: string
    label: string
    weight: number
}

export interface BiasOption {
    id: string
    label: string
    bias: number
}

interface Props {
    mode: AnimationMode

    onModeChange: (mode: AnimationMode) => void
    onStep: () => void
    onEpoch: () => void
    onReset: () => void
    isPlaying: boolean
    onPlayToggle: () => void
    canDownloadTables: boolean
    onGenerateTable: () => void

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
    onSelectedWeightReset: () => void
    canEditWeights: boolean
    canCustomizeInitializer: boolean

    biasOptions: BiasOption[]
    selectedBiasId: string
    selectedBiasValue: number
    onSelectedBiasChange: (value: string) => void
    onBiasValueChange: (value: number) => void
    onSelectedBiasReset: () => void
    canEditBiases: boolean
}

export function Sidebar({
    mode, onModeChange, onStep,
    onEpoch, onReset, isPlaying, onPlayToggle,
    canDownloadTables,
    onGenerateTable,
    learningRate, onLearningRateChange,
    architecture, onArchitectureChange,
    activation, onActivationChange,
    loss, onLossChange,
    initializer, onInitializerChange,
    weightOptions,
    selectedWeightId,
    selectedWeightValue,
    onSelectedWeightChange,
    onWeightValueChange,
    onSelectedWeightReset,
    canEditWeights,
    canCustomizeInitializer,
    biasOptions,
    selectedBiasId,
    selectedBiasValue,
    onSelectedBiasChange,
    onBiasValueChange,
    onSelectedBiasReset,
    canEditBiases
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

            {canCustomizeInitializer && (
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

                <button
                    className="secondary"
                    disabled={!canEditWeights}
                    onClick={onSelectedWeightReset}
                >
                    Reset Weight
                </button>

                <p className="sidebar-hint">
                    {canEditWeights
                        ? "Edit the weight before starting the network."
                        : "You can select weights to inspect them. Use Reset to edit them again."}
                </p>

            </div>
            )}

            {canCustomizeInitializer && (
            <div className="sidebar-section">

                <h3>Biases</h3>

                <div className="sidebar-field">
                    <label>Node</label>

                    <select
                        value={selectedBiasId}
                        disabled={!canEditBiases}
                        onChange={(e) => onSelectedBiasChange(e.target.value)}
                    >
                        {biasOptions.map(option => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="sidebar-field">
                    <label>Initial Bias</label>

                    <input
                        type="number"
                        step="0.01"
                        disabled={!canEditBiases}
                        value={Number.isFinite(selectedBiasValue)
                            ? selectedBiasValue
                            : 0}
                        onChange={(e) => {
                            const value = e.target.valueAsNumber

                            if (Number.isFinite(value)) {
                                onBiasValueChange(value)
                            }
                        }}
                    />
                </div>

                <button
                    className="secondary"
                    disabled={!canEditBiases}
                    onClick={onSelectedBiasReset}
                >
                    Reset Bias
                </button>

                <p className="sidebar-hint">
                    Edit the bias before starting the network. Reset returns it to 0.
                </p>

            </div>
            )}

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

                <button
                    className="secondary"
                    disabled={!canDownloadTables}
                    onClick={onGenerateTable}
                >
                    Generate Table
                </button>
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

                    <button onClick={onEpoch}>Epoch</button>

                    <button
                        className={isPlaying ? "active" : ""}
                        onClick={onPlayToggle}
                    >
                        {isPlaying ? "Pause" : "Play"}
                    </button>

                    <button className="secondary" onClick={onReset}>Reset</button>

                </div>
            </div>

            <div className="sidebar-section sidebar-authors">
                <h3>Developed by:</h3>

                <ul>
                    {AUTHORS.map(author => (
                        <li key={author.email}>
                            <span>{author.name}</span>
                            <a href={`mailto:${author.email}`}>
                                {author.email}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    )
}
