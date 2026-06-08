# Neural Network Visualizer

An interactive educational tool for visualizing how a feedforward neural network learns from a single observation. The project focuses on making forward propagation, backpropagation, gradients, weights, biases, and loss evolution visible step by step.

## Overview

Neural Network Visualizer lets students inspect a small dense neural network while it trains. Users can configure the architecture, activation function, loss function, initializer, sample inputs, targets, learning rate, weights, and biases. The app also provides animated training playback, loss charts, formula panels, and exportable training tables.

## Features

- Interactive neural network canvas with node, connection, weight, bias, activation, delta, and loss values.
- Step-by-step animation modes: layer, node, and term.
- Manual epoch playback and continuous play mode.
- Keyboard shortcuts for training flow.
- Weight initializers: He, Xavier, and custom initialization.
- Manual weight and bias editing in custom initialization mode.
- Loss chart by epoch.
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

https://github.com/Hllinaz/neural-visualizer/wiki

To edit the Wiki:

1. Open the repository on GitHub.
2. Go to the `Wiki` tab.
3. Create or edit the home page.
4. Add pages for usage, formulas, training controls, table exports, and examples.

Suggested Wiki pages:

- Home
- User Guide
- Network Configuration
- Training Controls
- Forward Pass
- Backpropagation
- Exported Tables
- Keyboard Shortcuts

## Authors

**Humberto J. Llinas M.**  
Email: lhumberto@uninorte.edu.co

**Dr. rer. nat. Humberto J. Llinas S.**  
Email: hllinas@uninorte.edu.co
