import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { BackwardNodeTrace } from "../../core/trace/BackwardNodeTrace"
import { ForwardNodeTrace } from "../../core/trace/ForwardNodeTrace"
import type { TraceController } from "../../core/trace/TraceController"
import type { NetworkSnapshot } from "../../core/snapshot/NetworkSnapshot"

import "katex/dist/katex.min.css"

import "./FormulaPanel.css"

interface Props {
    content?: string
    controller?: TraceController
    snapshot?: NetworkSnapshot
    targets?: number[]
}

export function FormulaPanel({ content, controller, snapshot, targets }: Props) {

    const formulaContent = content
        ?? buildFormulaContent(controller, snapshot, targets)

    return (
        <div className="formula-panel">

            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
            >
                {formulaContent}
            </ReactMarkdown>

        </div>
    )
}

function buildFormulaContent(
    controller?: TraceController,
    snapshot?: NetworkSnapshot,
    targets?: number[]
) {
    const trace = controller?.getCurrentNode()

    if (!controller || !trace) {
        return introFormulaContent
    }

    if (trace instanceof ForwardNodeTrace) {
        return buildForwardContent(trace, controller.getTermIndex())
    }

    if (trace instanceof BackwardNodeTrace) {
        return buildBackwardContent(
            trace,
            controller.getTermIndex(),
            snapshot?.layers.length ?? 0,
            targets
        )
    }

    return introFormulaContent
}

function buildForwardContent(trace: ForwardNodeTrace, step: number) {
    if (trace.terms.length === 0) {
        return `
# Input Layer

This neuron receives a value directly from the dataset.

$$
a = x = ${format(trace.activation)}
$$
`
    }

    const visibleStep = step < 0
        ? trace.terms.length + 1
        : step

    const maxTerm = Math.min(visibleStep, trace.terms.length - 1)

    const terms = trace.terms
        .slice(0, maxTerm + 1)
        .map((term) =>
            `(${format(term.weight)} \\times ${format(term.input)})`
        )
        .join(" + ")

    const currentTerm = maxTerm >= 0
        ? trace.terms[maxTerm]
        : null

    const currentSum = maxTerm >= 0
        ? trace.cumulativeSums[maxTerm]
        : 0

    return `
# Forward Pass

Node: layer ${trace.layerIndex}, neuron ${trace.nodeIndex}

## Formula

$$
z = \\sum_i w_i a_i + b
$$

$$
a = f(z)
$$

## Substitution

$$
z = ${terms || "0"}${visibleStep >= trace.terms.length ? ` + ${format(trace.bias ?? 0)}` : ""}
$$

${currentTerm ? `
## Current Term

$$
w_i a_i = ${format(currentTerm.weight)} \\times ${format(currentTerm.input)} = ${format(currentTerm.product)}
$$

$$
\\text{partial sum} = ${format(currentSum)}
$$
` : ""}

${visibleStep >= trace.terms.length ? `
## Weighted Sum

$$
z = ${format(trace.z ?? 0)}
$$
` : ""}

${visibleStep >= trace.terms.length + 1 ? `
## Activation

$$
a = f(${format(trace.z ?? 0)}) = ${format(trace.activation)}
$$
` : ""}
`
}

function buildBackwardContent(
    trace: BackwardNodeTrace,
    step: number,
    totalLayers: number,
    targets?: number[]
) {
    const isInputLayer = trace.layerIndex === 0
    const isOutputLayer = totalLayers > 0
        && trace.layerIndex === totalLayers - 1

    if (isInputLayer) {
        return `
# Backpropagation

The input layer does not compute its own delta.

$$
\\delta = 0
$$
`
    }

    const visibleStep = step < 0
        ? trace.getStepCount() - 1
        : step

    const maxConnection = Math.min(
        visibleStep,
        trace.connections.length - 1
    )

    const gradientTerms = trace.connections
        .slice(0, maxConnection + 1)
        .map((conn) => format(conn.gradient))
        .join(" + ")

    const currentConnection = maxConnection >= 0
        ? trace.connections[maxConnection]
        : null

    if (isOutputLayer) {
        const target = targets?.[trace.nodeIndex]

        return `
# Backpropagation

Output node: layer ${trace.layerIndex}, neuron ${trace.nodeIndex}

## Formula

$$
\\delta = \\frac{\\partial L}{\\partial a} \\cdot f'(z)
$$

## Values

${target !== undefined ? `
$$
y = ${format(target)}
$$
` : ""}

$$
f'(z) = ${format(trace.activationDerivative)}
$$

$$
\\delta = ${format(trace.delta)}
$$
`
    }

    return `
# Backpropagation

Hidden node: layer ${trace.layerIndex}, neuron ${trace.nodeIndex}

## Formula

$$
\\delta = f'(z) \\cdot \\sum_j w_j \\delta_j
$$

## Propagated Gradients

$$
\\sum_j w_j \\delta_j = ${gradientTerms || "0"}
$$

${currentConnection ? `
## Current Connection

$$
\\frac{\\partial L}{\\partial w} = a_{prev} \\cdot \\delta_{next}
$$

$$
${format(currentConnection.sourceActivation)} \\times ${format(currentConnection.targetDelta)} = ${format(currentConnection.gradient)}
$$
` : ""}

${visibleStep >= trace.connections.length ? `
## Sum

$$
\\sum_j w_j \\delta_j = ${format(trace.propagatedSum)}
$$
` : ""}

${visibleStep >= trace.connections.length + 1 ? `
## Derivative

$$
f'(z) = ${format(trace.activationDerivative)}
$$
` : ""}

${visibleStep >= trace.connections.length + 2 ? `
## Delta

$$
\\delta = ${format(trace.activationDerivative)} \\times ${format(trace.propagatedSum)} = ${format(trace.delta)}
$$
` : ""}
`
}

function format(value: number) {
    const normalized = Math.abs(value) < 0.0005 ? 0 : value
    return normalized.toFixed(4)
}

const introFormulaContent = `
# Neural Network Math

Select **Step** to see how each neuron computes its values.

## Forward

$$
z = \\sum_i w_i a_i + b
$$

$$
a = f(z)
$$

## Backward

$$
\\delta = f'(z) \\cdot \\sum_j w_j \\delta_j
$$

$$
w \\leftarrow w - \\alpha \\frac{\\partial L}{\\partial w}
$$
`
