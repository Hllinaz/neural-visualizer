import {
    BookOpen,
    FastForward,
    Gauge,
    Pause,
    Play,
    RotateCcw,
    StepForward
} from "lucide-react"

import "./Header.css";

const DOCUMENTATION_URL = "https://github.com/Hllinaz/neural-visualizer/wiki"

interface Props {
    isPlaying: boolean
    onStep: () => void
    onEpoch: () => void
    onReset: () => void
    onPlayToggle: () => void
    playbackSpeed: number
    onPlaybackSpeedChange: () => void
}

export function Header({
    isPlaying,
    onStep,
    onEpoch,
    onReset,
    onPlayToggle,
    playbackSpeed,
    onPlaybackSpeedChange
}: Props) {

    return (

        <header className="header">
            <div className="header-playback" aria-label="Playback controls">

                <button
                    type="button"
                    aria-label="Reset"
                    title="Reset"
                    onClick={onReset}
                >
                    <RotateCcw aria-hidden="true" size={18} strokeWidth={2.3} />
                </button>

                <button
                    type="button"
                    className={isPlaying ? "active" : ""}
                    aria-label={isPlaying ? "Pause" : "Play"}
                    title={isPlaying ? "Pause" : "Play"}
                    onClick={onPlayToggle}
                >
                    {isPlaying
                        ? <Pause aria-hidden="true" size={18} fill="currentColor" />
                        : <Play aria-hidden="true" size={18} fill="currentColor" />}
                </button>

                <button
                    type="button"
                    aria-label="Step"
                    title="Step"
                    onClick={onStep}
                >
                    <StepForward aria-hidden="true" size={18} strokeWidth={2.3} />
                </button>

                <button
                    type="button"
                    aria-label="Epoch"
                    title="Epoch"
                    onClick={onEpoch}
                >
                    <FastForward aria-hidden="true" size={18} strokeWidth={2.3} />
                </button>

                <button
                    type="button"
                    className="header-speed-button"
                    aria-label={`Playback speed ${playbackSpeed}x`}
                    title={`Playback speed ${playbackSpeed}x`}
                    onClick={onPlaybackSpeedChange}
                >
                    <Gauge aria-hidden="true" size={17} strokeWidth={2.3} />
                    <span>{playbackSpeed}x</span>
                </button>
            </div>

            <div className="header-title">
                <h2>
                    Neural Network Playground
                </h2>
            </div>

            <a
                className="header-docs-link"
                href={DOCUMENTATION_URL}
                target="_blank"
            rel="noreferrer"
            >
                <BookOpen aria-hidden="true" size={17} strokeWidth={2.2} />
                Documentation
            </a>
        </header>
    )
}
