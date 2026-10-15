# @goadminuiux/calculator

<p align="center">
  <img src="https://raw.githubusercontent.com/adminuiux/calculator/main/calculator.png" alt="AdminUIUX Calculator JS" width="100%">
</p>

> Production-ready, zero-dependency universal JavaScript calculator engine & DOM component with chained stream arithmetic, smart percentage handling, scientific math functions, and accessibility.

[![npm version](https://img.shields.io/npm/v/@goadminuiux/calculator.svg)](https://www.npmjs.com/package/@goadminuiux/calculator)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](package.json)
[![Bundle Size](https://img.shields.io/badge/size-%3C22KB%20minified-brightgreen.svg)](dist/calculator.min.js)

---

## 🌟 Features

- **Zero External Dependencies**: Pure vanilla JavaScript. No Bootstrap, jQuery, React, or build requirements needed for basic execution.
- **Headless Core Engine**: Complete mathematical calculation engine (`Calculator`) completely decoupled from the DOM.
- **Safe Expression Evaluator**: `Calculator.evaluate("100 + 25 * 2")` follows standard operator precedence (PEMDAS / BODMAS) without unsafe `eval()` or `new Function()`.
- **Smart Percentage Logic**: Resolves `100 × 10% = 10`, `100 + 10% = 110`, `100 − 10% = 90`, and `100 ÷ 10% = 1000`.
- **Stream / Desk Calculator**: Stateful engine simulating physical handheld calculators with chained arithmetic, operand stack, and memory (`M+`, `M-`, `MR`, `MC`).
- **Scientific Functions**: Trigonometric (`sin`, `cos`, `tan`, inverses), logarithmic (`log`, `ln`), exponential (`exp`), powers, roots (`sqrt`, `sqr`, `cube`), and factorial (`fact`).
- **Financial Helpers**: Instant tax addition/deduction (`tax`), tipping (`tip`), and discounts (`discount`).
- **DOM Binding Layer (`AdminUIUXCalculator`)**: Automatic discovery and initialization on `.calculator` containers with live display syncing, keyboard listeners, RTL support, and custom events.
- **Universal Package**: Supports ES Modules, CommonJS, AMD, and Browser `<script>` tags via jsDelivr CDN.

---

## 📦 Installation

### Via npm

```bash
npm install @goadminuiux/calculator
```

### Via jsDelivr CDN

```html
<!-- Minified Production Build -->
<script src="https://cdn.jsdelivr.net/npm/@goadminuiux/calculator@1.0.0/dist/calculator.min.js"></script>
```

Or directly from your local repository:

```html
<script src="path/to/plugins-custom/calculator.min.js"></script>
```

---

## 🚀 Quick Usage

### 1. Headless JavaScript API (ES Modules)

```javascript
import { Calculator, Formatter } from "@goadminuiux/calculator";

// Evaluate mathematical expressions
const total = Calculator.evaluate("100 + 25 * 2"); // 150
const grouped = Calculator.evaluate("(10 + 20) * 3"); // 90
const percentCalc = Calculator.evaluate("100 * 10%"); // 10

// Arithmetic helpers
Calculator.add(10, 25); // 35
Calculator.subtract(100, 45); // 55
Calculator.multiply(12, 12); // 144
Calculator.divide(100, 4); // 25

// Percentages
Calculator.percent(250, 15); // 37.5
Calculator.addPercent(100, 10); // 110
Calculator.subtractPercent(100, 10); // 90

// Formatting
Formatter.format(1234567.89, { currency: "$" }); // "$ 1,234,567.89"
```

### 2. CommonJS (Node.js)

```javascript
const { Calculator, Formatter } = require("@goadminuiux/calculator");

console.log(Calculator.evaluate("2 ^ 3 + 10")); // 18
console.log(Calculator.tax(100, 0.18)); // 118
```

### 3. Direct Browser `<script>` & CDN

```html
<!-- Include Calculator Script -->
<script src="https://cdn.jsdelivr.net/npm/@goadminuiux/calculator@1.0.0/dist/calculator.min.js"></script>

<script>
    // Access global namespace
    const result = window.Calculator.evaluate("500 - 15%");
    console.log(result); // 425
</script>
```

---

## 🖥️ Drop-in HTML Widget (`AdminUIUXCalculator`)

Add HTML with data attributes. The library automatically detects and binds to `.calculator` containers on `DOMContentLoaded`:

```html
<div class="calculator card shadow-sm" data-calculator-type="basic" data-calculator-output="#orderTotal">
    <div class="card-body">
        <!-- Display Screen -->
        <div class="calculator-screen bg-dark text-white p-3 rounded-3 mb-3">
            <p class="calculator-history small opacity-75 font-monospace text-end" data-calc-history>&nbsp;</p>
            <h4 class="calculator-display font-monospace text-end mb-0" data-calc-display>0</h4>
        </div>

        <!-- Buttons Grid -->
        <div class="row g-2 mb-2">
            <div class="col-3"><button type="button" class="btn btn-danger w-100" data-calc-action="clear">C</button></div>
            <div class="col-3">
                <button type="button" class="btn btn-secondary w-100" data-calc-action="backspace"><i class="bi bi-backspace"></i></button>
            </div>
            <div class="col-3"><button type="button" class="btn btn-secondary w-100" data-calc-action="percent">%</button></div>
            <div class="col-3"><button type="button" class="btn btn-primary w-100" data-calc-action="operator" data-val="/">÷</button></div>
        </div>
        <div class="row g-2 mb-2">
            <div class="col-3"><button type="button" class="btn btn-light w-100" data-calc-action="num" data-val="7">7</button></div>
            <div class="col-3"><button type="button" class="btn btn-light w-100" data-calc-action="num" data-val="8">8</button></div>
            <div class="col-3"><button type="button" class="btn btn-light w-100" data-calc-action="num" data-val="9">9</button></div>
            <div class="col-3"><button type="button" class="btn btn-primary w-100" data-calc-action="operator" data-val="*">×</button></div>
        </div>
        <div class="row g-2 mb-2">
            <div class="col-3"><button type="button" class="btn btn-light w-100" data-calc-action="num" data-val="4">4</button></div>
            <div class="col-3"><button type="button" class="btn btn-light w-100" data-calc-action="num" data-val="5">5</button></div>
            <div class="col-3"><button type="button" class="btn btn-light w-100" data-calc-action="num" data-val="6">6</button></div>
            <div class="col-3"><button type="button" class="btn btn-primary w-100" data-calc-action="operator" data-val="-">−</button></div>
        </div>
        <div class="row g-2 mb-2">
            <div class="col-3"><button type="button" class="btn btn-light w-100" data-calc-action="num" data-val="1">1</button></div>
            <div class="col-3"><button type="button" class="btn btn-light w-100" data-calc-action="num" data-val="2">2</button></div>
            <div class="col-3"><button type="button" class="btn btn-light w-100" data-calc-action="num" data-val="3">3</button></div>
            <div class="col-3"><button type="button" class="btn btn-primary w-100" data-calc-action="operator" data-val="+">+</button></div>
        </div>
        <div class="row g-2">
            <div class="col-3"><button type="button" class="btn btn-secondary w-100" data-calc-action="negate">±</button></div>
            <div class="col-3"><button type="button" class="btn btn-light w-100" data-calc-action="num" data-val="0">0</button></div>
            <div class="col-3"><button type="button" class="btn btn-light w-100" data-calc-action="num" data-val=".">.</button></div>
            <div class="col-3"><button type="button" class="btn btn-primary w-100" data-calc-action="equals">=</button></div>
        </div>
    </div>
</div>

<!-- Output Target receiving live sync -->
<div>Total: <span id="orderTotal">0</span></div>

<script src="dist/calculator.min.js"></script>
```

### Manual JavaScript Initialization

```javascript
import { AdminUIUXCalculator } from "@goadminuiux/calculator";

// Initialize on specific element
const calc = AdminUIUXCalculator.init("#myCalculator", {
    precision: 4,
    currency: "$",
    enableKeyboard: true,
    onCalculate: (result, history) => {
        console.log("Calculation complete:", result, history);
    },
});
```

---

## 📖 API Reference

### `Calculator`

| Method                       | Parameters                                         | Description                                                                                                    |
| ---------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `evaluate(expr, options?)`   | `expr: string`, `options?: { precision?: number }` | Evaluates string expression with full operator precedence (e.g. `100 + 25 * 2`, `(10 + 20) * 3`, `100 - 10%`). |
| `add(a, b, precision?)`      | `a: number`, `b: number`                           | Adds two numbers with IEEE 754 precision rounding.                                                             |
| `subtract(a, b, precision?)` | `a: number`, `b: number`                           | Subtracts `b` from `a`.                                                                                        |
| `multiply(a, b, precision?)` | `a: number`, `b: number`                           | Multiplies `a` by `b`.                                                                                         |
| `divide(a, b, precision?)`   | `a: number`, `b: number`                           | Divides `a` by `b` (returns `0` on divide-by-zero).                                                            |
| `power(a, b, precision?)`    | `a: number`, `b: number`                           | Computes $a^b$.                                                                                                |
| `modulo(a, b, precision?)`   | `a: number`, `b: number`                           | Computes $a \pmod b$.                                                                                          |
| `percent(val, pct)`          | `val: number`, `pct: number`                       | Computes `(val * pct) / 100`.                                                                                  |
| `addPercent(val, pct)`       | `val: number`, `pct: number`                       | Computes `val + (val * pct) / 100`.                                                                            |
| `subtractPercent(val, pct)`  | `val: number`, `pct: number`                       | Computes `val - (val * pct) / 100`.                                                                            |
| `multiplyPercent(val, pct)`  | `val: number`, `pct: number`                       | Computes `(val * pct) / 100`.                                                                                  |
| `dividePercent(val, pct)`    | `val: number`, `pct: number`                       | Computes `val / (pct / 100)`.                                                                                  |
| `tax(amt, rate?, isAdd?)`    | `amt: number`, `rate?: number`, `isAdd?: boolean`  | Computes tax addition or extraction.                                                                           |
| `tip(amt, percent?)`         | `amt: number`, `percent?: number`                  | Computes amount with percentage tip.                                                                           |
| `discount(amt, percent?)`    | `amt: number`, `percent?: number`                  | Computes amount after discount percentage.                                                                     |
| `sin(val, angleMode?)`       | `val: number`, `angleMode?: 'deg' \| 'rad'`        | Sine function in degrees or radians.                                                                           |
| `cos(val, angleMode?)`       | `val: number`, `angleMode?: 'deg' \| 'rad'`        | Cosine function in degrees or radians.                                                                         |
| `tan(val, angleMode?)`       | `val: number`, `angleMode?: 'deg' \| 'rad'`        | Tangent function in degrees or radians.                                                                        |
| `sqrt(val)`                  | `val: number`                                      | Square root.                                                                                                   |
| `factorial(n)`               | `n: number`                                        | Factorial ($n!$).                                                                                              |

### `Formatter`

| Method                    | Parameters                                                                   | Description                                                     |
| ------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `round(val, precision=8)` | `val: number`, `precision?: number`                                          | Rounds float safely avoiding `0.30000000000000004` artifacts.   |
| `format(num, options?)`   | `num: number\|string`, `options?: { currency?: string, precision?: number }` | Groups thousands with commas and prepends currency if provided. |
| `parse(str)`              | `str: string`                                                                | Strips formatting and extracts numeric float value.             |

---

## 🛠 Development & Testing

```bash
# Run unit test suite
npm test

# Build production bundles
npm run build
```

---

## 📄 License

MIT © [AdminUIUX](https://adminuiux.com)
