import type { AnimationMode } from "./AnimationMode"
import type { PlaybackState } from "./PlaybackState"
import type { TraceType } from "./TraceType"
import type { NeuralTrace } from "./NeuralTrace"
import type { NodeTrace } from "./NodeTrace"
import { TraceCursor } from "./TraceCursor"

export class TraceController {

    private cursor: TraceCursor | null = null

    private playbackState: PlaybackState = "STOPPED"
    private mode: AnimationMode = "LAYER"
    private traceType: TraceType | null = null

    private finished: boolean = false

    start(trace: NeuralTrace, type: TraceType) {
        this.cursor = new TraceCursor(trace)
        this.traceType = type
        this.playbackState = "PAUSED"
        this.finished = false
    }

    reset() {
        this.cursor = null
        this.traceType = null
        this.playbackState = "STOPPED"
        this.finished = false
    }

    play() {
        if (!this.cursor) return
        this.playbackState = "PLAYING"
    }

    pause() {
        this.playbackState = "PAUSED"
    }

    setMode(mode: AnimationMode) {
        this.mode = mode
    }

    step() {
        if (!this.cursor) return

        this.cursor.advance(this.mode)

        this.finished = this.cursor?.isFinished() ?? false

        if (this.cursor.isFinished()) {
            this.playbackState = "STOPPED"
        }
    }

    getCurrentNode(): NodeTrace | null {
        return this.cursor?.getCurrentNode() ?? null
    }

    getLayerIndex(): number {
        return this.cursor?.getLayerIndex() ?? -1
    }

    getNodeIndex(): number {
        return this.cursor?.getNodeIndex() ?? -1
    }

    getTermIndex(): number {
        return this.cursor?.getTermIndex() ?? -1
    }

    getMode(): AnimationMode {
        return this.mode
    }

    getPlaybackState(): PlaybackState {
        return this.playbackState
    }

    getTraceType(): TraceType | null {
        return this.traceType
    }

    isReady(): boolean {
        return this.cursor !== null
    }

    isFinished(): boolean {
        return this.finished
    }
}