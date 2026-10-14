# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-14

### Added
- Core `Calculator` engine completely decoupled from HTML/DOM.
- Safe, zero-dependency mathematical expression evaluator `Calculator.evaluate(expr)` supporting operator precedence, parentheses, decimals, and percentages.
- Arithmetic helpers: `Calculator.add()`, `subtract()`, `multiply()`, `divide()`, `modulo()`, `power()`.
- Smart percentage calculation logic: `percent()`, `addPercent()`, `subtractPercent()`, `multiplyPercent()`, `dividePercent()`.
- Scientific functions: `sin()`, `cos()`, `tan()`, `asin()`, `acos()`, `atan()`, `sqrt()`, `sqr()`, `cube()`, `log()`, `ln()`, `exp()`, `reciprocal()`, `abs()`, `factorial()`.
- Financial utilities: `tax()`, `tip()`, `discount()`.
- Formatter utilities with IEEE 754 precision rounding, comma grouping, and currency prefixes.
- Stateful `StreamCalculator` engine for desk/handheld calculator workflows (history tokens, memory reel, tape history).
- `AdminUIUXCalculator` DOM binding component with automated `DOMContentLoaded` discovery, keyboard shortcuts, output target binding (`data-calculator-output`), calculation target sync (`data-calculator-calculation`), and `calculator:change` custom events.
- UMD, ESM, CommonJS, and Browser Global packaging support.
- Unit test suite and interactive demo application.
