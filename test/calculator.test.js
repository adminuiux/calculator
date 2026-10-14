/**
 * Unit Test Suite for @adminuiux/calculator
 * Tests core arithmetic, expressions, percentage handling, scientific functions, and stream state machine.
 */

'use strict';

const assert = require('assert');
const path = require('path');

// Import the UMD bundle
const { Calculator, Formatter, StreamCalculator } = require('../dist/calculator.js');

let passedCount = 0;
let totalCount = 0;

function it(description, fn) {
    totalCount++;
    try {
        fn();
        console.log(`  ✔ ${description}`);
        passedCount++;
    } catch (err) {
        console.error(`  ✖ ${description}`);
        console.error(`    ${err.message}`);
    }
}

function describe(suiteName, fn) {
    console.log(`\n--- ${suiteName} ---`);
    fn();
}

// 1. Basic Arithmetic
describe('Calculator Core Arithmetic', () => {
    it('should add numbers accurately', () => {
        assert.strictEqual(Calculator.add(10, 25), 35);
        assert.strictEqual(Calculator.add(0.1, 0.2), 0.3); // Floating point precision handled
    });

    it('should subtract numbers accurately', () => {
        assert.strictEqual(Calculator.subtract(100, 45), 55);
        assert.strictEqual(Calculator.subtract(0.3, 0.1), 0.2);
    });

    it('should multiply numbers accurately', () => {
        assert.strictEqual(Calculator.multiply(12, 12), 144);
        assert.strictEqual(Calculator.multiply(0.2, 0.2), 0.04);
    });

    it('should divide numbers accurately and prevent divide-by-zero crash', () => {
        assert.strictEqual(Calculator.divide(100, 4), 25);
        assert.strictEqual(Calculator.divide(100, 0), 0);
    });

    it('should calculate power and modulo', () => {
        assert.strictEqual(Calculator.power(2, 8), 256);
        assert.strictEqual(Calculator.modulo(17, 5), 2);
    });
});

// 2. Percentage Handling
describe('Percentage Calculations', () => {
    it('should calculate raw percentage value', () => {
        assert.strictEqual(Calculator.percent(100, 10), 10);
        assert.strictEqual(Calculator.percent(250, 20), 50);
    });

    it('should add percentage to base value', () => {
        assert.strictEqual(Calculator.addPercent(100, 10), 110);
        assert.strictEqual(Calculator.addPercent(200, 15), 230);
    });

    it('should subtract percentage from base value', () => {
        assert.strictEqual(Calculator.subtractPercent(100, 10), 90);
        assert.strictEqual(Calculator.subtractPercent(500, 20), 400);
    });

    it('should multiply by percentage (e.g. 100 * 10% = 10)', () => {
        assert.strictEqual(Calculator.multiplyPercent(100, 10), 10);
    });

    it('should divide by percentage (e.g. 100 / 10% = 1000)', () => {
        assert.strictEqual(Calculator.dividePercent(100, 10), 1000);
    });
});

// 3. Expression Evaluator (Shunting-Yard)
describe('Expression Evaluator (Calculator.evaluate)', () => {
    it('should evaluate simple additions and subtractions', () => {
        assert.strictEqual(Calculator.evaluate('10 + 20 + 30'), 60);
        assert.strictEqual(Calculator.evaluate('100 - 45 - 5'), 50);
    });

    it('should respect operator precedence (PEMDAS / BODMAS)', () => {
        assert.strictEqual(Calculator.evaluate('100 + 25 * 2'), 150);
        assert.strictEqual(Calculator.evaluate('10 + 20 / 2'), 20);
        assert.strictEqual(Calculator.evaluate('2 + 3 * 4 - 5'), 9);
    });

    it('should handle parentheses correctly', () => {
        assert.strictEqual(Calculator.evaluate('(10 + 20) * 3'), 90);
        assert.strictEqual(Calculator.evaluate('((2 + 3) * (4 + 1)) / 5'), 5);
    });

    it('should handle unary negative signs', () => {
        assert.strictEqual(Calculator.evaluate('-5 + 10'), 5);
        assert.strictEqual(Calculator.evaluate('10 * -2'), -20);
    });

    it('should evaluate percentage inside expressions', () => {
        assert.strictEqual(Calculator.evaluate('100 * 10%'), 10);
        assert.strictEqual(Calculator.evaluate('100 + 10%'), 110);
        assert.strictEqual(Calculator.evaluate('100 - 10%'), 90);
    });

    it('should handle custom display symbols (×, ÷, −)', () => {
        assert.strictEqual(Calculator.evaluate('10 × 5 ÷ 2'), 25);
        assert.strictEqual(Calculator.evaluate('100 − 30'), 70);
    });
});

// 4. Scientific & Financial Functions
describe('Scientific & Financial Helpers', () => {
    it('should compute square root and powers', () => {
        assert.strictEqual(Calculator.sqrt(144), 12);
        assert.strictEqual(Calculator.sqr(9), 81);
        assert.strictEqual(Calculator.cube(3), 27);
    });

    it('should compute factorials correctly', () => {
        assert.strictEqual(Calculator.factorial(0), 1);
        assert.strictEqual(Calculator.factorial(5), 120);
        assert.strictEqual(Calculator.factorial(6), 720);
    });

    it('should compute trigonometry in degrees mode', () => {
        assert.strictEqual(Calculator.sin(30, 'deg'), 0.5);
        assert.strictEqual(Calculator.cos(60, 'deg'), 0.5);
        assert.strictEqual(Calculator.tan(45, 'deg'), 1);
    });

    it('should calculate tax, tips, and discounts', () => {
        assert.strictEqual(Calculator.tax(100, 0.18, true), 118);
        assert.strictEqual(Calculator.tax(118, 0.18, false), 100);
        assert.strictEqual(Calculator.tip(80, 15), 92);
        assert.strictEqual(Calculator.discount(200, 25), 150);
    });
});

// 5. Formatter
describe('Formatter Utilities', () => {
    it('should format numbers with thousand separators', () => {
        assert.strictEqual(Formatter.format(1234567.89), '1,234,567.89');
        assert.strictEqual(Formatter.format(1000), '1,000');
    });

    it('should prepend currency symbols if specified', () => {
        assert.strictEqual(Formatter.format(5999, { currency: '$' }), '$ 5,999');
    });

    it('should parse formatted strings back to numbers', () => {
        assert.strictEqual(Formatter.parse('$ 1,234,567.89'), 1234567.89);
    });
});

// 6. Stream Calculator State Machine
describe('Stream Calculator State Machine', () => {
    it('should handle chained calculation stream (e.g. 100 + 50 - 20 = 130)', () => {
        const stream = new StreamCalculator();
        stream.inputDigit(1);
        stream.inputDigit(0);
        stream.inputDigit(0);
        stream.inputOperator('+');
        stream.inputDigit(5);
        stream.inputDigit(0);
        stream.inputOperator('-');
        assert.strictEqual(stream.previousValue, 150);
        stream.inputDigit(2);
        stream.inputDigit(0);
        const result = stream.inputEquals();
        assert.strictEqual(result, 130);
    });

    it('should handle percentage in stream (e.g. 100 * 10% = 10)', () => {
        const stream = new StreamCalculator();
        stream.inputDigit(1);
        stream.inputDigit(0);
        stream.inputDigit(0);
        stream.inputOperator('*');
        stream.inputDigit(1);
        stream.inputDigit(0);
        stream.applyPercent();
        const result = stream.inputEquals();
        assert.strictEqual(result, 10);
    });

    it('should support memory operations (M+, M-, MR, MC)', () => {
        const stream = new StreamCalculator();
        stream.inputDigit(5);
        stream.inputDigit(0);
        stream.memory += stream.parseCurrent(); // M+ 50
        assert.strictEqual(stream.memory, 50);

        stream.clearAll();
        stream.inputDigit(2);
        stream.inputDigit(0);
        stream.memory -= stream.parseCurrent(); // M- 20
        assert.strictEqual(stream.memory, 30);

        stream.clearAll();
        stream.currentInput = String(stream.memory); // MR
        assert.strictEqual(stream.parseCurrent(), 30);
    });
});

// Summary
console.log(`\n========================================`);
console.log(`Test Results: ${passedCount} / ${totalCount} Passed`);
console.log(`========================================\n`);

if (passedCount !== totalCount) {
    process.exit(1);
}
