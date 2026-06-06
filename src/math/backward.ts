export const BACKWARD_MARKDOWN = `
# Backpropagation

## Loss

$$
L = \\frac{1}{2}(y - \\hat{y})^2
$$

## Gradient

$$
\\frac{\\partial L}{\\partial w}
$$

## Chain Rule

$$
\\frac{\\partial L}{\\partial w}
=
\\frac{\\partial L}{\\partial a}
\\cdot
\\frac{\\partial a}{\\partial z}
\\cdot
\\frac{\\partial z}{\\partial w}
$$
`