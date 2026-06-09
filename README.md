# Neural Network Playground

An interactive educational tool for visualizing how a feedforward neural network learns from a single observation. The project focuses on making forward propagation, backpropagation, gradients, weights, biases, and loss evolution visible step by step.

## Overview

Neural Network Playground lets students inspect a small dense neural network while it trains. Users can configure the architecture, activation function, loss function, initializer, sample inputs, targets, learning rate, weights, and biases. The app also provides header playback controls, adjustable playback speed, loss charts, formula panels, and exportable reports.

## Features

- Interactive neural network canvas with node, connection, weight, bias, activation, delta, and loss values.
- Minimizable sample panel for editing inputs and targets without covering the canvas.
- Step-by-step animation modes: layer, node, and term.
- Header playback controls for reset, play/pause, step, epoch, and speed.
- Keyboard shortcuts for training flow.
- Weight initializers: He, Xavier, and custom initialization.
- Manual weight and bias editing in custom initialization mode.
- Loss chart by epoch with SVG, PNG, and PDF export.
- Exportable tables for:
  - Forward pass values.
  - Backward pass gradients.
  - Parameter evolution by epoch.
- GitHub Wiki link from the application header.

## Tech Stack

- React
- TypeScript
- Vite
- Recharts
- Lucide React
- KaTeX

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Documentation

The full documentation should live in the GitHub Wiki:

https://github.com/Hllinaz/neural-network-playground/wiki

## Authors

**Humberto J. Llinas M.**  
Email: lhumberto@uninorte.edu.co

**Dr. rer. nat. Humberto J. Llinas S.**  
Email: hllinas@uninorte.edu.co
