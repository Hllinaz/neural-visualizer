import { useEffect, useMemo, useState } from "react"
import { NetworkCanvas } from "./components/network/NetworkCanvas"
import { TraceController } from "./core/trace/TraceController"
import { NeuralNetwork } from "./core/neural/NeuralNetwork"
import { Sigmoid, ReLU } from "./core/neural/ActivationFunction"
import { MSE } from "./core/neural/LossFunction"
import { HeInitializer, XavierInitializer } from "./core/neural/WeightInitializer"
import { SeededRandom } from "./core/neural/SeededRandom"
import { NetworkSnapshotBuilder } from "./core/snapshot/NetworkSnapshotBuilder"
import { NeuralTraceBuilder } from "./core/trace/NeuralTraceBuilder"
import { FormulaPanel } from "./components/formulas/FormulaPanel"
import type { AnimationMode } from "./core/trace/AnimationMode"

import { Header } from "./components/layout/Header"
import { Sidebar, type WeightOption } from "./components/layout/Sidebar"

import "./App.css"

const rng = new SeededRandom(42)

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

const traceBuilder = new NeuralTraceBuilder()
const controller = new TraceController()

function createNetwork(
	architecture: number[],
	activation: keyof typeof ACTIVATIONS,
	loss: keyof typeof LOSSES,
	initializer: keyof typeof INITIALIZERS
) {
	return new NeuralNetwork({
		architecture,
		activation: ACTIVATIONS[activation],
		loss: LOSSES[loss],
		initializer: new INITIALIZERS[initializer](rng)
	})
}

function App() {

	const [architecture, setArchitecture] = useState("2,3,2,1")
	const [activation, setActivation] = useState("sigmoid")
	const [loss, setLoss] = useState("mse")
	const [initializer, setInitializer] = useState("he")
	const [learningRate, setLearningRate] = useState(0.1)
	const [mode, setMode] = useState<AnimationMode>("LAYER")
	const [selectedWeightId, setSelectedWeightId] = useState("")
	const [inputs, setInputs] = useState([1, 0])
	const [outputs, setOutputs] = useState([1])
	const [hasStarted, setHasStarted] = useState(false)

	const [network, setNetwork] =
		useState(() =>
			createNetwork(
				[2, 3, 2, 1],
				"sigmoid",
				"mse",
				"he"
			)
		)
	
	const [snapshot, setSnapshot] = useState(
		NetworkSnapshotBuilder.build(network, outputs)
	)

	const parsedArchitecture = useMemo(
		() => parseArchitecture(architecture),
		[architecture]
	)

	const weightOptions = useMemo(
		() => buildWeightOptions(snapshot),
		[snapshot]
	)

	const selectedWeight = weightOptions.find(
		option => option.id === selectedWeightId
	)

	const selectedWeightValue = selectedWeight?.weight ?? 0

	useEffect(() => {
		if (weightOptions.length === 0) {
			setSelectedWeightId("")
			return
		}

		const selectedExists = weightOptions.some(
			option => option.id === selectedWeightId
		)

		if (!selectedExists) {
			setSelectedWeightId(weightOptions[0].id)
		}
	}, [weightOptions, selectedWeightId])

	const rebuildNetwork = () => {

		const newNetwork = createNetwork(
			parsedArchitecture,
			activation as keyof typeof ACTIVATIONS,
			loss as keyof typeof LOSSES,
			initializer as keyof typeof INITIALIZERS
		)

		setNetwork(newNetwork)

		const snap = NetworkSnapshotBuilder.build(newNetwork, outputs)

		setSnapshot(snap)
		setHasStarted(false)
	}

	const runTraining = () => {

		network.forward(inputs)
		network.backward(outputs)
		network.applyGradients(learningRate)

		const snap = structuredClone(
			NetworkSnapshotBuilder.build(network, outputs)
		)

		const trace = traceBuilder.trainingTrace(snap)

		controller.start(trace, "FORWARD")

		setSnapshot(snap)
	}

	const refreshTrace = () => {

		network.forward(inputs)
		network.backward(outputs)

		const snap = structuredClone(
			NetworkSnapshotBuilder.build(network, outputs)
		)

		const trace = traceBuilder.trainingTrace(snap)

		controller.start(trace, "FORWARD")

		setSnapshot(snap)
	}

	const handleWeightValueChange = (value: number) => {

		if (hasStarted) return

		const parsed = parseConnectionId(selectedWeightId)

		if (!parsed) return

		const sourceNode = network
			.layers[parsed.sourceLayer]
			?.nodes[parsed.sourceNode]

		if (!sourceNode) return

		const connection = sourceNode.outgoing.find(conn =>
			conn.target.layerIndex === parsed.targetLayer
			&& conn.target.nodeIndex === parsed.targetNode
		)

		if (!connection) return

		connection.weight = value

		refreshTrace()
	}

	const handleInputChange = (index: number, value: number) => {
		setInputs(current =>
			current.map((item, itemIndex) =>
				itemIndex === index ? value : item
			)
		)
	}

	const handleOutputChange = (index: number, value: number) => {
		setOutputs(current =>
			current.map((item, itemIndex) =>
				itemIndex === index ? value : item
			)
		)
	}

	useEffect(() => {
		rebuildNetwork()
	}, [architecture,activation,loss,initializer])

	useEffect(() => {
		refreshTrace()
	}, [network])

	useEffect(() => {
		setInputs(current =>
			resizeValues(current, parsedArchitecture[0] ?? 0, 0)
		)

		setOutputs(current =>
			resizeValues(
				current,
				parsedArchitecture[parsedArchitecture.length - 1] ?? 0,
				0
			)
		)
	}, [parsedArchitecture])

	useEffect(() => {
		refreshTrace()
	}, [inputs, outputs])

	const handleStep = () => {

		setHasStarted(true)

		if (!controller.isFinished()) {
			controller.step()

			const newSnap = structuredClone(
				NetworkSnapshotBuilder.build(network, outputs)
			)

			setSnapshot(newSnap)
		} else {
			runTraining()
		}

	}

	const handleReset = () => {
		rebuildNetwork()
	}

	return (

		<div className="app">

			<Header />

			<div className="main-layout">

				<Sidebar
					mode={mode}
					onModeChange={(value) => {
						setMode(value)
						controller.setMode(value)
					}}

					onStep={handleStep}
					onReset={handleReset}

					learningRate={learningRate}
					onLearningRateChange={setLearningRate}

					architecture={architecture}
					onArchitectureChange={setArchitecture}

					activation={activation}
					onActivationChange={setActivation}

					loss={loss}
					onLossChange={setLoss}

					initializer={initializer}
					onInitializerChange={setInitializer}

					weightOptions={weightOptions}
					selectedWeightId={selectedWeightId}
					selectedWeightValue={selectedWeightValue}
					onSelectedWeightChange={setSelectedWeightId}
					onWeightValueChange={handleWeightValueChange}
					canEditWeights={!hasStarted}
				/>

				<div className="network-section">

					<NetworkCanvas
						snapshot={snapshot}
						controller={controller}
						selectedWeightId={selectedWeightId}
						selectedWeightValue={selectedWeightValue}
						onSelectedWeightChange={setSelectedWeightId}
						onWeightValueChange={handleWeightValueChange}
						canEditWeights={!hasStarted}
						inputs={inputs}
						outputs={outputs}
						onInputChange={handleInputChange}
						onOutputChange={handleOutputChange}
					/>

				</div>

				<FormulaPanel
					controller={controller}
					snapshot={snapshot}
					targets={outputs}
				/>

			</div>

		</div>
	)
}

function buildWeightOptions(snapshot: ReturnType<typeof NetworkSnapshotBuilder.build>): WeightOption[] {
	return snapshot.layers.flatMap(layer =>
		layer.nodes.flatMap(node =>
			node.outgoing.map(conn => ({
				id: connectionId(
					conn.sourceLayer,
					conn.sourceNode,
					conn.targetLayer,
					conn.targetNode
				),
				label: `L${conn.sourceLayer} N${conn.sourceNode} → L${conn.targetLayer} N${conn.targetNode} (${conn.weight.toFixed(2)})`,
				weight: Number(conn.weight.toFixed(4))
			}))
		)
	)
}

function connectionId(
	sourceLayer: number,
	sourceNode: number,
	targetLayer: number,
	targetNode: number
) {
	return `${sourceLayer}:${sourceNode}:${targetLayer}:${targetNode}`
}

function parseConnectionId(id: string) {
	const parts = id.split(":").map(Number)

	if (parts.length !== 4 || parts.some(part => !Number.isFinite(part))) {
		return null
	}

	const [
		sourceLayer,
		sourceNode,
		targetLayer,
		targetNode
	] = parts

	return {
		sourceLayer,
		sourceNode,
		targetLayer,
		targetNode
	}
}

function parseArchitecture(value: string) {
	const parsed = value
		.split(",")
		.map(part => Number(part.trim()))
		.filter(part =>
			Number.isFinite(part)
			&& Number.isInteger(part)
			&& part > 0
		)

	if (parsed.length < 2) {
		return [2, 1]
	}

	return parsed
}

function resizeValues(
	values: number[],
	size: number,
	defaultValue: number
) {
	if (values.length === size) {
		return values
	}

	return Array.from(
		{ length: size },
		(_, index) => values[index] ?? defaultValue
	)
}

export default App
