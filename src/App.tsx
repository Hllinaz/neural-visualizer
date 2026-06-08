import { useEffect, useMemo, useRef, useState } from "react"
import { NetworkCanvas } from "./components/network/NetworkCanvas"
import { TraceController } from "./core/trace/TraceController"
import { NeuralNetwork } from "./core/neural/NeuralNetwork"
import { Sigmoid, ReLU } from "./core/neural/ActivationFunction"
import { MSE } from "./core/neural/LossFunction"
import {
	CustomInitializer,
	HeInitializer,
	XavierInitializer
} from "./core/neural/WeightInitializer"
import { SeededRandom } from "./core/neural/SeededRandom"
import { NetworkSnapshotBuilder } from "./core/snapshot/NetworkSnapshotBuilder"
import type { NetworkSnapshot } from "./core/snapshot/NetworkSnapshot"
import { NeuralTraceBuilder } from "./core/trace/NeuralTraceBuilder"
import { FormulaPanel } from "./components/formulas/FormulaPanel"
import { LossChart, type LossPoint } from "./components/charts/LossChart"
import {
	TrainingTablesModal,
	getTableHeaders,
	type TableRow,
	type TableValue
} from "./components/tables/TrainingTablesModal"
import type { AnimationMode } from "./core/trace/AnimationMode"

import { Header } from "./components/layout/Header"
import {
	Sidebar,
	type BiasOption,
	type WeightOption
} from "./components/layout/Sidebar"

import "./App.css"

const rng = new SeededRandom()

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

const traceBuilder = new NeuralTraceBuilder()
const controller = new TraceController()

function createNetwork(
	architecture: number[],
	activation: keyof typeof ACTIVATIONS,
	loss: keyof typeof LOSSES,
	initializer: keyof typeof INITIALIZERS
) {
	const isCustomInitializer = initializer === "custom"

	return new NeuralNetwork({
		architecture,
		activation: ACTIVATIONS[activation],
		loss: LOSSES[loss],
		initializer: new INITIALIZERS[initializer](rng),
		biasInitializer: () =>
			isCustomInitializer
				? 0
				: rng.nextRange(-1, 1)
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
	const [selectedBiasId, setSelectedBiasId] = useState("")
	const [inputs, setInputs] = useState([1, 0])
	const [outputs, setOutputs] = useState([1])
	const [lossHistory, setLossHistory] = useState<LossPoint[]>([])
	const [forwardRows, setForwardRows] = useState<TableRow[]>([])
	const [backwardRows, setBackwardRows] = useState<TableRow[]>([])
	const [parameterRows, setParameterRows] = useState<TableRow[]>([])
	const [isTableModalOpen, setIsTableModalOpen] = useState(false)
	const [hasStarted, setHasStarted] = useState(false)
	const [isPlaying, setIsPlaying] = useState(false)
	const [isRunningEpoch, setIsRunningEpoch] = useState(false)
	const advanceStepRef = useRef<() => boolean>(() => false)
	const startEpochRef = useRef<() => void>(() => {})
	const resetRef = useRef<() => void>(() => {})
	const togglePlayRef = useRef<() => void>(() => {})

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

	const biasOptions = useMemo(
		() => buildBiasOptions(snapshot),
		[snapshot]
	)

	const selectedWeight = weightOptions.find(
		option => option.id === selectedWeightId
	)

	const selectedWeightValue = selectedWeight?.weight ?? 0

	const selectedBias = biasOptions.find(
		option => option.id === selectedBiasId
	)

	const selectedBiasValue = selectedBias?.bias ?? 0
	const isCustomInitializer = initializer === "custom"

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

	useEffect(() => {
		if (biasOptions.length === 0) {
			setSelectedBiasId("")
			return
		}

		const selectedExists = biasOptions.some(
			option => option.id === selectedBiasId
		)

		if (!selectedExists) {
			setSelectedBiasId(biasOptions[0].id)
		}
	}, [biasOptions, selectedBiasId])

	const rebuildNetwork = () => {

		setIsPlaying(false)
		setIsRunningEpoch(false)

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
		setLossHistory([])
		setForwardRows([])
		setBackwardRows([])
		setParameterRows(buildInitialParameterRows(snap))
		setIsTableModalOpen(false)
	}

	const runTraining = () => {

		network.forward(inputs)
		network.backward(outputs)
		const beforeUpdateSnap = structuredClone(
			NetworkSnapshotBuilder.build(network, outputs)
		)

		network.applyGradients(learningRate)

		const snap = structuredClone(
			NetworkSnapshotBuilder.build(network, outputs)
		)

		const trace = traceBuilder.trainingTrace(snap)

		controller.start(trace, "FORWARD")

		const epoch = lossHistory.length + 1

		setLossHistory(current => [
			...current,
			{
				epoch,
				loss: computeSnapshotLoss(snap)
			}
		])

		setForwardRows(current => [
			...current,
			buildForwardTableRow(epoch, snap, inputs, outputs)
		])

		setBackwardRows(current => [
			...current,
			buildBackwardTableRow(epoch, snap)
		])

		setParameterRows(current =>
			appendParameterEpoch(
				current.length > 0
					? current
					: buildInitialParameterRows(beforeUpdateSnap),
				epoch,
				snap
			)
		)

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

		if (hasStarted || !isCustomInitializer) return

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

	const handleBiasValueChange = (value: number) => {

		if (hasStarted || !isCustomInitializer) return

		const parsed = parseBiasId(selectedBiasId)

		if (!parsed || parsed.layerIndex === 0) return

		network.setBias(
			parsed.layerIndex,
			parsed.nodeIndex,
			value
		)

		refreshTrace()
	}

	const handleSelectedBiasReset = () => {
		handleBiasValueChange(0)
	}

	const handleSelectedWeightReset = () => {
		handleWeightValueChange(0)
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

	const advanceTrainingStep = () => {

		setHasStarted(true)

		if (!controller.isFinished()) {
			controller.step()

			const newSnap = structuredClone(
				NetworkSnapshotBuilder.build(network, outputs)
			)

			setSnapshot(newSnap)
			return false
		} else {
			runTraining()
			return true
		}
	}

	const handleStep = () => {
		setIsPlaying(false)
		setIsRunningEpoch(false)
		advanceTrainingStep()
	}

	const handleEpoch = () => {
		setIsPlaying(false)
		setIsRunningEpoch(true)
	}

	const handleReset = () => {
		setIsPlaying(false)
		setIsRunningEpoch(false)
		rebuildNetwork()
	}

	const handlePlayToggle = () => {
		setIsRunningEpoch(false)
		setIsPlaying(current => !current)
	}

	const handleGenerateTable = () => {
		if (forwardRows.length === 0) return
		setIsTableModalOpen(true)
	}

	const handleDownloadForwardTable = () => {
		downloadCsv("forward_pass.csv", forwardRows)
	}

	const handleDownloadBackwardTable = () => {
		downloadCsv("backward_gradients.csv", backwardRows)
	}

	const handleDownloadParameterTable = () => {
		downloadCsv("parameter_evolution.csv", parameterRows)
	}

	advanceStepRef.current = advanceTrainingStep
	startEpochRef.current = handleEpoch
	resetRef.current = handleReset
	togglePlayRef.current = handlePlayToggle

	useEffect(() => {
		if (!isPlaying && !isRunningEpoch) return

		const intervalId = window.setInterval(() => {
			const completedEpoch = advanceStepRef.current()

			if (completedEpoch && !isPlaying) {
				setIsRunningEpoch(false)
			}
		}, 150)

		return () => window.clearInterval(intervalId)
	}, [isPlaying, isRunningEpoch])

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (isEditableKeyboardTarget(event.target)) return

			if (event.key === "ArrowRight") {
				event.preventDefault()
				advanceStepRef.current()
				return
			}

			if (event.key.toLowerCase() === "r") {
				event.preventDefault()
				resetRef.current()
				return
			}

			if (event.code === "Space") {
				event.preventDefault()
				togglePlayRef.current()
			}
		}

		window.addEventListener("keydown", handleKeyDown)

		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [])

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
					onEpoch={handleEpoch}
					onReset={handleReset}
					isPlaying={isPlaying}
					onPlayToggle={handlePlayToggle}
					canDownloadTables={forwardRows.length > 0}
					onGenerateTable={handleGenerateTable}

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
					onSelectedWeightReset={handleSelectedWeightReset}
					canEditWeights={!hasStarted && isCustomInitializer}
					canCustomizeInitializer={isCustomInitializer}

					biasOptions={biasOptions}
					selectedBiasId={selectedBiasId}
					selectedBiasValue={selectedBiasValue}
					onSelectedBiasChange={setSelectedBiasId}
					onBiasValueChange={handleBiasValueChange}
					onSelectedBiasReset={handleSelectedBiasReset}
					canEditBiases={!hasStarted && isCustomInitializer}
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

				<div className="analysis-section">
					<LossChart data={lossHistory} />

					<FormulaPanel
						controller={controller}
						snapshot={snapshot}
						targets={outputs}
					/>
				</div>

			</div>

			{isTableModalOpen && (
				<TrainingTablesModal
					forwardRows={forwardRows}
					backwardRows={backwardRows}
					parameterRows={parameterRows}
					onClose={() => setIsTableModalOpen(false)}
					onDownloadForward={handleDownloadForwardTable}
					onDownloadBackward={handleDownloadBackwardTable}
					onDownloadParameters={handleDownloadParameterTable}
				/>
			)}

		</div>
	)
}

function computeSnapshotLoss(snapshot: ReturnType<typeof NetworkSnapshotBuilder.build>) {
	const outputLayer = snapshot.layers[snapshot.layers.length - 1]
	const losses = outputLayer?.nodes.map(node => node.loss) ?? []

	if (losses.length === 0) {
		return 0
	}

	return losses.reduce((total, loss) => total + loss, 0) / losses.length
}

function buildForwardTableRow(
	epoch: number,
	snapshot: NetworkSnapshot,
	inputs: number[],
	targets: number[]
): TableRow {
	const row: TableRow = { epoch }

	inputs.forEach((value, index) => {
		row[`x${index + 1}`] = formatTableNumber(value)
	})

	targets.forEach((value, index) => {
		row[targets.length === 1 ? "y" : `y${index + 1}`] = formatTableNumber(value)
	})

	for (const layer of snapshot.layers) {
		if (layer.layerIndex === 0) continue

		for (const node of layer.nodes) {
			const isOutputLayer = layer.layerIndex === snapshot.layers.length - 1
			const suffix = isOutputLayer
				? outputColumnSuffix(node.nodeIndex, layer.nodes.length)
				: hiddenColumnSuffix(layer.layerIndex, node.nodeIndex)

			row[`z_${suffix}`] = formatTableNumber(node.z)
			row[isOutputLayer
				? outputActivationColumn(node.nodeIndex, layer.nodes.length)
				: suffix] =
				formatTableNumber(node.output)
		}
	}

	row.loss = formatTableNumber(computeSnapshotLoss(snapshot))
	row.class = getPredictedClass(snapshot)

	return row
}

function buildBackwardTableRow(
	epoch: number,
	snapshot: NetworkSnapshot
): TableRow {
	const row: TableRow = { epoch }
	let weightIndex = 1

	for (const layer of snapshot.layers) {
		for (const node of layer.nodes) {
			for (const connection of node.outgoing) {
				row[`grad_w${weightIndex}`] =
					formatTableNumber(connection.gradient)
				weightIndex++
			}
		}
	}

	return row
}

function buildInitialParameterRows(snapshot: NetworkSnapshot): TableRow[] {
	return [
		...getWeightValues(snapshot).map((value, index) => ({
			Parameter: `w${index + 1}`,
			Initial: formatTableNumber(value)
		})),
		...getBiasValues(snapshot).map((value, index) => ({
			Parameter: `b${index + 1}`,
			Initial: formatTableNumber(value)
		})),
		...getActivationValues(snapshot).map((item) => ({
			Parameter: item.label,
			Initial: "NA"
		})),
		{
			Parameter: "grad_mean",
			Initial: "NA"
		}
	]
}

function appendParameterEpoch(
	rows: TableRow[],
	epoch: number,
	snapshot: NetworkSnapshot
) {
	const column = `Epoch_${epoch}`
	const weights = getWeightValues(snapshot)
	const biases = getBiasValues(snapshot)
	const activations = getActivationValues(snapshot)
	const gradMean = getGradientMean(snapshot)

	return rows.map(row => {
		const parameter = String(row.Parameter)
		const weightMatch = /^w(\d+)$/.exec(parameter)
		const biasMatch = /^b(\d+)$/.exec(parameter)
		const activation = activations.find(item => item.label === parameter)
		let value: TableValue = ""

		if (weightMatch) {
			value = formatTableNumber(weights[Number(weightMatch[1]) - 1] ?? 0)
		} else if (biasMatch) {
			value = formatTableNumber(biases[Number(biasMatch[1]) - 1] ?? 0)
		} else if (activation) {
			value = formatTableNumber(activation.value)
		} else if (parameter === "grad_mean") {
			value = formatTableNumber(gradMean)
		}

		return {
			...row,
			[column]: value
		}
	})
}

function getWeightValues(snapshot: NetworkSnapshot) {
	return snapshot.layers.flatMap(layer =>
		layer.nodes.flatMap(node =>
			node.outgoing.map(connection => connection.weight)
		)
	)
}

function getBiasValues(snapshot: NetworkSnapshot) {
	return snapshot.layers.flatMap(layer =>
		layer.nodes
			.filter(node => node.layerIndex > 0)
			.map(node => node.bias)
	)
}

function getActivationValues(snapshot: NetworkSnapshot) {
	return snapshot.layers.flatMap(layer => {
		if (layer.layerIndex === 0) return []

		const isOutputLayer = layer.layerIndex === snapshot.layers.length - 1

		return layer.nodes.map(node => ({
			label: isOutputLayer
				? outputActivationColumn(node.nodeIndex, layer.nodes.length)
				: hiddenColumnSuffix(layer.layerIndex, node.nodeIndex),
			value: node.output
		}))
	})
}

function getGradientMean(snapshot: NetworkSnapshot) {
	const gradients = snapshot.layers.flatMap(layer =>
		layer.nodes.flatMap(node =>
			node.outgoing.map(connection => Math.abs(connection.gradient))
		)
	)

	if (gradients.length === 0) {
		return 0
	}

	return gradients.reduce((total, gradient) => total + gradient, 0)
		/ gradients.length
}

function downloadCsv(
	fileName: string,
	rows: TableRow[]
) {
	if (rows.length === 0) return

	const headers = getTableHeaders(rows)

	const csv = [
		headers.join(","),
		...rows.map(row =>
			headers
				.map(header => csvCell(row[header] ?? ""))
				.join(",")
		)
	].join("\n")

	const blob = new Blob([csv], {
		type: "text/csv;charset=utf-8"
	})
	const url = URL.createObjectURL(blob)
	const link = document.createElement("a")

	link.href = url
	link.download = fileName
	link.click()

	URL.revokeObjectURL(url)
}

function csvCell(value: TableValue) {
	const text = String(value)

	if (!/[",\n]/.test(text)) {
		return text
	}

	return `"${text.replaceAll("\"", "\"\"")}"`
}

function hiddenColumnSuffix(
	layerIndex: number,
	nodeIndex: number
) {
	return layerIndex === 1
		? `h${nodeIndex + 1}`
		: `l${layerIndex}_h${nodeIndex + 1}`
}

function outputColumnSuffix(
	nodeIndex: number,
	outputCount: number
) {
	return outputCount === 1
		? "y"
		: `y${nodeIndex + 1}`
}

function outputActivationColumn(
	nodeIndex: number,
	outputCount: number
) {
	return outputCount === 1
		? "y_hat"
		: `y_hat_${nodeIndex + 1}`
}

function getPredictedClass(snapshot: NetworkSnapshot) {
	const outputNodes = snapshot.layers[snapshot.layers.length - 1]?.nodes ?? []

	if (outputNodes.length === 0) {
		return ""
	}

	if (outputNodes.length === 1) {
		return outputNodes[0].output >= 0.5 ? 1 : 0
	}

	return outputNodes.reduce(
		(bestIndex, node, index) =>
			node.output > outputNodes[bestIndex].output ? index : bestIndex,
		0
	)
}

function formatTableNumber(value: number) {
	const normalized = Math.abs(value) < 0.0000005 ? 0 : value
	return Number(normalized.toFixed(6))
}

function isEditableKeyboardTarget(target: EventTarget | null) {
	if (!(target instanceof HTMLElement)) {
		return false
	}

	return target instanceof HTMLInputElement
		|| target instanceof HTMLSelectElement
		|| target instanceof HTMLTextAreaElement
		|| target.isContentEditable
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

function buildBiasOptions(snapshot: ReturnType<typeof NetworkSnapshotBuilder.build>): BiasOption[] {
	return snapshot.layers.flatMap(layer =>
		layer.nodes
			.filter(node => node.layerIndex > 0)
			.map(node => ({
				id: biasId(node.layerIndex, node.nodeIndex),
				label: `L${node.layerIndex} N${node.nodeIndex} (${node.bias.toFixed(2)})`,
				bias: Number(node.bias.toFixed(4))
			}))
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

function biasId(
	layerIndex: number,
	nodeIndex: number
) {
	return `${layerIndex}:${nodeIndex}`
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

function parseBiasId(id: string) {
	const parts = id.split(":").map(Number)

	if (parts.length !== 2 || parts.some(part => !Number.isFinite(part))) {
		return null
	}

	const [
		layerIndex,
		nodeIndex
	] = parts

	return {
		layerIndex,
		nodeIndex
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
